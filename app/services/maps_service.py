from flask import current_app
import requests
from typing import Dict, List, Optional, Tuple
import json


class GoogleMapsService:
    """Service for Google Maps API operations"""
    
    def __init__(self):
        self.api_key = None
        self.base_url = "https://maps.googleapis.com/maps/api"
        self._configure()
    
    def _configure(self):
        """Configure Google Maps API"""
        try:
            self.api_key = current_app.config.get('GOOGLE_MAPS_API_KEY')
            if not self.api_key:
                current_app.logger.warning("GOOGLE_MAPS_API_KEY not configured")
        except Exception as e:
            current_app.logger.error(f"Error configuring Google Maps: {str(e)}")
    
    def geocode(self, address: str) -> Dict:
        """
        Convert address to coordinates (latitude, longitude)
        
        Args:
            address: Address string
        
        Returns:
            Dict with lat, lng and formatted address
        """
        try:
            if not self.api_key:
                return {
                    'success': False,
                    'error': 'Google Maps API key not configured'
                }
            
            url = f"{self.base_url}/geocode/json"
            params = {
                'address': address,
                'key': self.api_key
            }
            
            response = requests.get(url, params=params)
            data = response.json()
            
            if data['status'] == 'OK' and len(data['results']) > 0:
                result = data['results'][0]
                location = result['geometry']['location']
                
                return {
                    'success': True,
                    'latitude': location['lat'],
                    'longitude': location['lng'],
                    'formatted_address': result['formatted_address'],
                    'place_id': result.get('place_id')
                }
            else:
                return {
                    'success': False,
                    'error': f"Geocoding failed: {data['status']}"
                }
                
        except Exception as e:
            current_app.logger.error(f"Geocoding error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def reverse_geocode(self, lat: float, lng: float) -> Dict:
        """
        Convert coordinates to address
        
        Args:
            lat: Latitude
            lng: Longitude
        
        Returns:
            Dict with address information
        """
        try:
            if not self.api_key:
                return {
                    'success': False,
                    'error': 'Google Maps API key not configured'
                }
            
            url = f"{self.base_url}/geocode/json"
            params = {
                'latlng': f"{lat},{lng}",
                'key': self.api_key
            }
            
            response = requests.get(url, params=params)
            data = response.json()
            
            if data['status'] == 'OK' and len(data['results']) > 0:
                result = data['results'][0]
                
                return {
                    'success': True,
                    'formatted_address': result['formatted_address'],
                    'place_id': result.get('place_id'),
                    'address_components': result.get('address_components', [])
                }
            else:
                return {
                    'success': False,
                    'error': f"Reverse geocoding failed: {data['status']}"
                }
                
        except Exception as e:
            current_app.logger.error(f"Reverse geocoding error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_directions(self, origin: str, destination: str, 
                      waypoints: Optional[List[str]] = None,
                      mode: str = 'driving') -> Dict:
        """
        Get directions between two points
        
        Args:
            origin: Starting point (address or lat,lng)
            destination: End point (address or lat,lng)
            waypoints: Optional list of waypoints
            mode: Travel mode (driving, walking, bicycling, transit)
        
        Returns:
            Dict with route information
        """
        try:
            if not self.api_key:
                return {
                    'success': False,
                    'error': 'Google Maps API key not configured'
                }
            
            url = f"{self.base_url}/directions/json"
            params = {
                'origin': origin,
                'destination': destination,
                'mode': mode,
                'key': self.api_key
            }
            
            if waypoints:
                params['waypoints'] = '|'.join(waypoints)
            
            response = requests.get(url, params=params)
            data = response.json()
            
            if data['status'] == 'OK' and len(data['routes']) > 0:
                route = data['routes'][0]
                leg = route['legs'][0]
                
                return {
                    'success': True,
                    'distance': {
                        'text': leg['distance']['text'],
                        'value': leg['distance']['value']  # in meters
                    },
                    'duration': {
                        'text': leg['duration']['text'],
                        'value': leg['duration']['value']  # in seconds
                    },
                    'start_address': leg['start_address'],
                    'end_address': leg['end_address'],
                    'steps': leg.get('steps', []),
                    'polyline': route['overview_polyline']['points']
                }
            else:
                return {
                    'success': False,
                    'error': f"Directions failed: {data['status']}"
                }
                
        except Exception as e:
            current_app.logger.error(f"Directions error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_distance_matrix(self, origins: List[str], destinations: List[str],
                           mode: str = 'driving') -> Dict:
        """
        Get distance and duration between multiple origins and destinations
        
        Args:
            origins: List of origin addresses
            destinations: List of destination addresses
            mode: Travel mode
        
        Returns:
            Dict with distance matrix
        """
        try:
            if not self.api_key:
                return {
                    'success': False,
                    'error': 'Google Maps API key not configured'
                }
            
            url = f"{self.base_url}/distancematrix/json"
            params = {
                'origins': '|'.join(origins),
                'destinations': '|'.join(destinations),
                'mode': mode,
                'key': self.api_key
            }
            
            response = requests.get(url, params=params)
            data = response.json()
            
            if data['status'] == 'OK':
                return {
                    'success': True,
                    'origins': data['origin_addresses'],
                    'destinations': data['destination_addresses'],
                    'rows': data['rows']
                }
            else:
                return {
                    'success': False,
                    'error': f"Distance matrix failed: {data['status']}"
                }
                
        except Exception as e:
            current_app.logger.error(f"Distance matrix error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def search_nearby(self, lat: float, lng: float, 
                     radius: int = 5000,
                     place_type: Optional[str] = None,
                     keyword: Optional[str] = None) -> Dict:
        """
        Search for nearby places
        
        Args:
            lat: Latitude
            lng: Longitude
            radius: Search radius in meters (max 50000)
            place_type: Type of place (restaurant, hotel, etc.)
            keyword: Search keyword
        
        Returns:
            Dict with nearby places
        """
        try:
            if not self.api_key:
                return {
                    'success': False,
                    'error': 'Google Maps API key not configured'
                }
            
            url = f"{self.base_url}/place/nearbysearch/json"
            params = {
                'location': f"{lat},{lng}",
                'radius': min(radius, 50000),
                'key': self.api_key
            }
            
            if place_type:
                params['type'] = place_type
            if keyword:
                params['keyword'] = keyword
            
            response = requests.get(url, params=params)
            data = response.json()
            
            if data['status'] == 'OK':
                return {
                    'success': True,
                    'places': data['results']
                }
            else:
                return {
                    'success': False,
                    'error': f"Nearby search failed: {data['status']}"
                }
                
        except Exception as e:
            current_app.logger.error(f"Nearby search error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_place_details(self, place_id: str) -> Dict:
        """
        Get detailed information about a place
        
        Args:
            place_id: Google Place ID
        
        Returns:
            Dict with place details
        """
        try:
            if not self.api_key:
                return {
                    'success': False,
                    'error': 'Google Maps API key not configured'
                }
            
            url = f"{self.base_url}/place/details/json"
            params = {
                'place_id': place_id,
                'key': self.api_key,
                'fields': 'name,formatted_address,geometry,rating,photos,opening_hours,website,formatted_phone_number,reviews'
            }
            
            response = requests.get(url, params=params)
            data = response.json()
            
            if data['status'] == 'OK':
                return {
                    'success': True,
                    'place': data['result']
                }
            else:
                return {
                    'success': False,
                    'error': f"Place details failed: {data['status']}"
                }
                
        except Exception as e:
            current_app.logger.error(f"Place details error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def optimize_route(self, origin: str, destination: str, 
                      waypoints: List[str]) -> Dict:
        """
        Optimize route with multiple waypoints
        
        Args:
            origin: Starting point
            destination: End point
            waypoints: List of waypoints to optimize
        
        Returns:
            Dict with optimized route
        """
        try:
            if not self.api_key:
                return {
                    'success': False,
                    'error': 'Google Maps API key not configured'
                }
            
            url = f"{self.base_url}/directions/json"
            params = {
                'origin': origin,
                'destination': destination,
                'waypoints': 'optimize:true|' + '|'.join(waypoints),
                'key': self.api_key
            }
            
            response = requests.get(url, params=params)
            data = response.json()
            
            if data['status'] == 'OK' and len(data['routes']) > 0:
                route = data['routes'][0]
                
                return {
                    'success': True,
                    'waypoint_order': route.get('waypoint_order', []),
                    'route': route
                }
            else:
                return {
                    'success': False,
                    'error': f"Route optimization failed: {data['status']}"
                }
                
        except Exception as e:
            current_app.logger.error(f"Route optimization error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def calculate_travel_time(self, places: List[Dict]) -> Dict:
        """
        Calculate total travel time between places
        
        Args:
            places: List of places with lat, lng
        
        Returns:
            Dict with total time and distances
        """
        try:
            if len(places) < 2:
                return {
                    'success': False,
                    'error': 'Need at least 2 places'
                }
            
            total_distance = 0
            total_duration = 0
            segments = []
            
            for i in range(len(places) - 1):
                origin = f"{places[i]['lat']},{places[i]['lng']}"
                destination = f"{places[i+1]['lat']},{places[i+1]['lng']}"
                
                result = self.get_directions(origin, destination)
                
                if result['success']:
                    total_distance += result['distance']['value']
                    total_duration += result['duration']['value']
                    
                    segments.append({
                        'from': places[i].get('name', f"Place {i+1}"),
                        'to': places[i+1].get('name', f"Place {i+2}"),
                        'distance': result['distance'],
                        'duration': result['duration']
                    })
            
            return {
                'success': True,
                'total_distance': {
                    'meters': total_distance,
                    'km': round(total_distance / 1000, 2)
                },
                'total_duration': {
                    'seconds': total_duration,
                    'minutes': round(total_duration / 60, 2),
                    'hours': round(total_duration / 3600, 2)
                },
                'segments': segments
            }
            
        except Exception as e:
            current_app.logger.error(f"Travel time calculation error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


# Singleton instance
_maps_service = None

def get_maps_service() -> GoogleMapsService:
    """
    Get Google Maps service instance
    
    Returns:
        GoogleMapsService singleton instance
    """
    global _maps_service
    if _maps_service is None:
        _maps_service = GoogleMapsService()
    return _maps_service