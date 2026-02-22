from flask import current_app
from app.services.ai_service import get_ai_service
from app.models.interaction import SavedItinerary
from app.models.location import Location
from app import db
from datetime import datetime, timedelta
from typing import List, Dict, Optional


class ItineraryService:
    
    def __init__(self):
        self.ai_service = None
    
    def _get_ai_service(self):
        """Lazy load AI service"""
        if self.ai_service is None:
            self.ai_service = get_ai_service()
        return self.ai_service
    
    def generate_smart_itinerary(self, preferences: Dict, selected_places: Optional[List[int]] = None) -> Dict:
        try:
            # Get selected places from database
            places_data = []
            if selected_places:
                locations = Location.query.filter(Location.id.in_(selected_places)).all()
                places_data = [self._place_to_dict(loc) for loc in locations]
            
            # Build enhanced preferences with places
            enhanced_preferences = preferences.copy()
            if places_data:
                enhanced_preferences['selected_places'] = places_data
            
            # Generate itinerary using AI
            ai_service = self._get_ai_service()
            result = ai_service.generate_itinerary(enhanced_preferences)
            
            if not result['success']:
                return {
                    'success': False,
                    'error': result.get('error', 'Không thể tạo lịch trình')
                }
            
            # Enhance itinerary with additional info
            itinerary = result['itinerary']
            itinerary = self._enhance_itinerary(itinerary, preferences, places_data)
            
            return {
                'success': True,
                'itinerary': itinerary
            }
            
        except Exception as e:
            current_app.logger.error(f"Error generating itinerary: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def save_itinerary(self, user_id: int, itinerary_data: Dict) -> Dict:
        try:
            # Create new itinerary
            itinerary = SavedItinerary(
                user_id=user_id,
                title=itinerary_data.get('title', 'Lịch trình du lịch'),
                total_budget=itinerary_data.get('estimated_cost', 0),
                nodes=itinerary_data.get('days', []) # SavedItinerary uses 'nodes' for JSON data
            )
            
            db.session.add(itinerary)
            db.session.commit()
            
            return {
                'success': True,
                'itinerary_id': itinerary.id,
                'message': 'Lưu lịch trình thành công'
            }
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error saving itinerary: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_user_itineraries(self, user_id: int, limit: int = 20) -> List[Dict]:
       
        try:
            itineraries = SavedItinerary.query.filter_by(
                user_id=user_id
            ).order_by(SavedItinerary.created_at.desc()).limit(limit).all()
            
            return [itinerary.to_dict() for itinerary in itineraries]
            
        except Exception as e:
            current_app.logger.error(f"Error getting user itineraries: {str(e)}")
            return []
    
    def get_itinerary(self, itinerary_id: int, user_id: Optional[int] = None) -> Optional[Dict]:
        """
        Get specific itinerary by ID
        
        Args:
            itinerary_id: Itinerary ID
            user_id: User ID (for permission check)
        
        Returns:
            Itinerary dict or None
        """
        try:
            query = SavedItinerary.query.filter_by(id=itinerary_id)
            
            if user_id:
                query = query.filter_by(user_id=user_id)
            
            itinerary = query.first()
            
            if itinerary:
                return itinerary.to_dict()
            
            return None
            
        except Exception as e:
            current_app.logger.error(f"Error getting itinerary: {str(e)}")
            return None
    
    def update_itinerary(self, itinerary_id: int, user_id: int, updates: Dict) -> Dict:
        """
        Update existing itinerary
        
        Args:
            itinerary_id: Itinerary ID
            user_id: User ID
            updates: Fields to update
        
        Returns:
            Dict with success status
        """
        try:
            itinerary = SavedItinerary.query.filter_by(
                id=itinerary_id,
                user_id=user_id
            ).first()
            
            if not itinerary:
                return {
                    'success': False,
                    'error': 'Không tìm thấy lịch trình'
                }
            
            # Update fields
            if 'title' in updates:
                itinerary.title = updates['title']
            if 'description' in updates:
                itinerary.description = updates['description']
            if 'itinerary_data' in updates:
                itinerary.nodes = updates['itinerary_data'].get('days', [])
            
            itinerary.updated_at = datetime.utcnow()
            db.session.commit()
            
            return {
                'success': True,
                'message': 'Cập nhật lịch trình thành công'
            }
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error updating itinerary: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_itinerary(self, itinerary_id: int, user_id: int) -> Dict:
        """
        Delete itinerary
        
        Args:
            itinerary_id: Itinerary ID
            user_id: User ID
        
        Returns:
            Dict with success status
        """
        try:
            itinerary = SavedItinerary.query.filter_by(
                id=itinerary_id,
                user_id=user_id
            ).first()
            
            if not itinerary:
                return {
                    'success': False,
                    'error': 'Không tìm thấy lịch trình'
                }
            
            db.session.delete(itinerary)
            db.session.commit()
            
            return {
                'success': True,
                'message': 'Xóa lịch trình thành công'
            }
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error deleting itinerary: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _enhance_itinerary(self, itinerary: Dict, preferences: Dict, places: List[Dict]) -> Dict:
        """
        Enhance itinerary with additional information
        
        Args:
            itinerary: Base itinerary from AI
            preferences: User preferences
            places: Selected places data
        
        Returns:
            Enhanced itinerary
        """
        # Add metadata
        itinerary['preferences'] = preferences
        itinerary['created_at'] = datetime.utcnow().isoformat()
        
        # Add place details to activities if available
        if places and 'days' in itinerary:
            place_map = {p['name']: p for p in places}
            
            for day in itinerary['days']:
                if 'activities' in day:
                    for activity in day['activities']:
                        location = activity.get('location', '')
                        # Try to match with selected places
                        for place_name, place_data in place_map.items():
                            if place_name in location:
                                activity['place_id'] = place_data.get('id')
                                activity['place_category'] = place_data.get('category')
                                if 'map_url' in place_data:
                                    activity['map_url'] = place_data['map_url']
                                break
                        
                        # If no place_id match, generate a generic search link if name is available
                        if 'map_url' not in activity and activity.get('location'):
                            from urllib.parse import quote
                            activity['map_url'] = f"https://www.google.com/maps/search/?api=1&query={quote(activity['location'])}"
        
        # Calculate total cost if not present
        if 'estimated_cost' not in itinerary or itinerary['estimated_cost'] == 0:
            total_cost = 0
            if 'days' in itinerary:
                for day in itinerary['days']:
                    if 'activities' in day:
                        for activity in day['activities']:
                            total_cost += activity.get('estimated_cost', 0)
            itinerary['estimated_cost'] = total_cost
        
        return itinerary
    
    def _place_to_dict(self, loc: Location) -> Dict:
        """
        Convert Location model to dictionary
        
        Args:
            loc: Location model instance
        
        Returns:
            Location dictionary
        """
        return {
            'id': loc.id,
            'name': loc.name,
            'description': loc.description,
            'category_id': loc.category_id,
            'address': loc.address,
            'price_range': {
                'min': loc.price_range_min,
                'max': loc.price_range_max
            },
            'rating': loc.rating_avg,
            'image_url': loc.images[0].image_url if loc.images.count() > 0 else None,
            'map_url': loc.map_url
        }
    
    def _parse_date(self, date_str: Optional[str]) -> Optional[datetime]:
        """
        Parse date string to datetime
        
        Args:
            date_str: Date string in ISO format
        
        Returns:
            datetime object or None
        """
        if not date_str:
            return None
        
        try:
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except:
            try:
                return datetime.strptime(date_str, '%Y-%m-%d')
            except:
                return None
    
    def optimize_route(self, itinerary_data: Dict) -> Dict:
        """
        Optimize travel route in itinerary
        
        Args:
            itinerary_data: Itinerary with activities
        
        Returns:
            Optimized itinerary
        """
        # TODO: Implement route optimization using Google Maps API
        # For now, return as is
        return itinerary_data
    
    def estimate_detailed_cost(self, itinerary_data: Dict) -> Dict:
        """
        Get detailed cost estimation
        
        Args:
            itinerary_data: Itinerary data
        
        Returns:
            Detailed cost breakdown
        """
        try:
            ai_service = self._get_ai_service()
            result = ai_service.estimate_cost(itinerary_data)
            
            if result['success']:
                return result['cost']
            
            return {
                'total': 0,
                'breakdown': {},
                'error': result.get('error')
            }
            
        except Exception as e:
            current_app.logger.error(f"Error estimating cost: {str(e)}")
            return {
                'total': 0,
                'breakdown': {},
                'error': str(e)
            }


# Singleton instance
_itinerary_service = None

def get_itinerary_service() -> ItineraryService:
    """
    Get itinerary service instance
    
    Returns:
        ItineraryService singleton instance
    """
    global _itinerary_service
    if _itinerary_service is None:
        _itinerary_service = ItineraryService()
    return _itinerary_service