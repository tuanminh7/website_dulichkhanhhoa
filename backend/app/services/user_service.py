from flask import current_app
from app.models.user import User
from app.models.interaction import SavedItinerary, Review
from app.models.location import Location
from app.models.ai import ChatSession
from app import db
import json
from datetime import datetime

class UserService:
    @staticmethod
    def get_profile(user):
        try:
            user_data = {
                'id': user.id,
                'username': user.email.split('@')[0],
                'email': user.email,
                'full_name': user.fullname,
                'phone': user.phone,
                'avatar_url': user.avatar,
                'preferences': [], # To be handled based on model structure
                'created_at': user.created_at.isoformat(),
                'stats': {
                    'itineraries': SavedItinerary.query.filter_by(user_id=user.id).count(),
                    'reviews': Review.query.filter_by(user_id=user.id).count(),
                    'chat_sessions': ChatSession.query.filter_by(user_id=user.id).count()
                }
            }
            
            # Handle preferences if they exist in some format
            if hasattr(user, 'preferences') and user.preferences:
                try:
                    user_data['preferences'] = json.loads(user.preferences)
                except:
                    pass
            
            return user_data, 200
        except Exception as e:
            return {'error': str(e)}, 500

    @staticmethod
    def update_profile(user, data):
        """Update user profile information"""
        try:
            if 'full_name' in data:
                user.fullname = data['full_name']
            if 'phone' in data:
                user.phone = data['phone']
            if 'avatar_url' in data:
                user.avatar = data['avatar_url']
            
            db.session.commit()
            
            return {
                'message': 'Cập nhật profile thành công',
                'user': user.to_dict()
            }, 200
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

    @staticmethod
    def get_preferences(user):
        """Get user preferences"""
        try:
            preferences = {}
            if hasattr(user, 'preferences') and user.preferences:
                preferences = json.loads(user.preferences)
            return preferences, 200
        except Exception as e:
            return {'error': str(e)}, 500

    @staticmethod
    def update_preferences(user, data):
        """Update user preferences"""
        try:
            existing_prefs = {}
            if hasattr(user, 'preferences') and user.preferences:
                existing_prefs = json.loads(user.preferences)
            
            existing_prefs.update(data)
            user.preferences = json.dumps(existing_prefs, ensure_ascii=False)
            
            db.session.commit()
            
            return {
                'message': 'Cập nhật preferences thành công',
                'preferences': existing_prefs
            }, 200
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

    @staticmethod
    def get_favorites(user):
        """Get user favorite places"""
        try:
            favorites = []
            if hasattr(user, 'preferences') and user.preferences:
                prefs = json.loads(user.preferences)
                favorite_ids = prefs.get('favorite_places', [])
                
                if favorite_ids:
                    locations = Location.query.filter(Location.id.in_(favorite_ids)).all()
                    favorites = [loc.to_dict() for loc in locations]
            
            return {
                'favorites': favorites,
                'total': len(favorites)
            }, 200
        except Exception as e:
            return {'error': str(e)}, 500

    @staticmethod
    def add_favorite(user, place_id):
        """Add a place to favorites"""
        try:
            location = Location.query.get_or_404(place_id)
            
            prefs = {}
            if hasattr(user, 'preferences') and user.preferences:
                prefs = json.loads(user.preferences)
            
            favorite_ids = prefs.get('favorite_places', [])
            
            if place_id not in favorite_ids:
                favorite_ids.append(place_id)
                prefs['favorite_places'] = favorite_ids
                user.preferences = json.dumps(prefs, ensure_ascii=False)
                db.session.commit()
            
            return {
                'message': 'Đã thêm vào yêu thích',
                'place': location.to_dict()
            }, 200
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

    @staticmethod
    def remove_favorite(user, place_id):
        """Remove a place from favorites"""
        try:
            prefs = {}
            if hasattr(user, 'preferences') and user.preferences:
                prefs = json.loads(user.preferences)
            
            favorite_ids = prefs.get('favorite_places', [])
            
            if place_id in favorite_ids:
                favorite_ids.remove(place_id)
                prefs['favorite_places'] = favorite_ids
                user.preferences = json.dumps(prefs, ensure_ascii=False)
                db.session.commit()
            
            return {'message': 'Đã xóa khỏi yêu thích'}, 200
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

    @staticmethod
    def get_dashboard_data(user):
        """Get user dashboard summary"""
        try:
            recent_itineraries = SavedItinerary.query.filter_by(
                user_id=user.id
            ).order_by(SavedItinerary.created_at.desc()).limit(5).all()
            
            recent_reviews = Review.query.filter_by(
                user_id=user.id
            ).order_by(Review.created_at.desc()).limit(5).all()
            
            recent_chats = ChatSession.query.filter_by(
                user_id=user.id
            ).order_by(ChatSession.created_at.desc()).limit(5).all()
            
            stats = {
                'itineraries_count': SavedItinerary.query.filter_by(user_id=user.id).count(),
                'reviews_count': Review.query.filter_by(user_id=user.id).count(),
                'chat_sessions_count': ChatSession.query.filter_by(user_id=user.id).count()
            }
            
            return {
                'stats': stats,
                'recent_itineraries': [i.to_dict() for i in recent_itineraries],
                'recent_reviews': [r.to_dict() for r in recent_reviews],
                'recent_chats': [c.to_dict() for c in recent_chats]
            }, 200
        except Exception as e:
            return {'error': str(e)}, 500

def get_user_service():
    """Factory for UserService"""
    return UserService()
