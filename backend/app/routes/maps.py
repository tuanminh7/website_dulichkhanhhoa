from flask import Blueprint, request, jsonify
from app.services.maps_service import get_maps_service

bp = Blueprint('maps', __name__, url_prefix='/api/maps')


@bp.route('/geocode', methods=['POST'])
def geocode():
    """Convert address to coordinates"""
    try:
        data = request.get_json()
        address = data.get('address')
        
        if not address:
            return jsonify({'error': 'Thiếu địa chỉ'}), 400
        
        maps_service = get_maps_service()
        result = maps_service.geocode(address)
        
        if not result:
            return jsonify({'error': 'Không tìm thấy tọa độ'}), 404
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/reverse-geocode', methods=['POST'])
def reverse_geocode():
    """Convert coordinates to address"""
    try:
        data = request.get_json()
        lat = data.get('latitude')
        lng = data.get('longitude')
        
        if lat is None or lng is None:
            return jsonify({'error': 'Thiếu tọa độ'}), 400
        
        maps_service = get_maps_service()
        result = maps_service.reverse_geocode(lat, lng)
        
        if not result:
            return jsonify({'error': 'Không tìm thấy địa chỉ'}), 404
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/directions', methods=['POST'])
def get_directions():
    """Get directions between locations"""
    try:
        data = request.get_json()
        
        origin = data.get('origin')
        destination = data.get('destination')
        waypoints = data.get('waypoints', [])
        mode = data.get('mode', 'driving')
        
        if not origin or not destination:
            return jsonify({'error': 'Thiếu điểm đi hoặc điểm đến'}), 400
        
        maps_service = get_maps_service()
        result = maps_service.get_directions(origin, destination, waypoints, mode)
        
        if not result:
            return jsonify({'error': 'Không tìm thấy tuyến đường'}), 404
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/distance-matrix', methods=['POST'])
def get_distance_matrix():
    """Get distance matrix between multiple locations"""
    try:
        data = request.get_json()
        
        origins = data.get('origins', [])
        destinations = data.get('destinations', [])
        mode = data.get('mode', 'driving')
        
        if not origins or not destinations:
            return jsonify({'error': 'Thiếu danh sách địa điểm'}), 400
        
        maps_service = get_maps_service()
        result = maps_service.get_distance_matrix(origins, destinations, mode)
        
        if not result:
            return jsonify({'error': 'Không thể tính toán khoảng cách'}), 404
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/nearby', methods=['POST'])
def search_nearby():
    """Search for places nearby"""
    try:
        data = request.get_json()
        
        location = data.get('location')
        radius = data.get('radius', 5000)
        place_type = data.get('type')
        
        if not location:
            return jsonify({'error': 'Thiếu vị trí'}), 400
        
        maps_service = get_maps_service()
        results = maps_service.search_nearby(location, radius, place_type)
        
        return jsonify({'places': results})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/place-details/<place_id>', methods=['GET'])
def get_place_details(place_id):
    """Get Google Place details"""
    try:
        maps_service = get_maps_service()
        result = maps_service.get_place_details(place_id)
        
        if not result:
            return jsonify({'error': 'Không tìm thấy thông tin địa điểm'}), 404
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/route-cost', methods=['POST'])
def calculate_route_cost():
    """Calculate estimated transportation cost"""
    try:
        data = request.get_json()
        
        distance_km = data.get('distance_km')
        mode = data.get('mode', 'driving')
        
        if distance_km is None:
            return jsonify({'error': 'Thiếu khoảng cách'}), 400
        
        maps_service = get_maps_service()
        result = maps_service.calculate_route_cost(distance_km, mode)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/optimize-route', methods=['POST'])
def optimize_route():
    """Optimize route for multiple destinations"""
    try:
        data = request.get_json()
        place_ids = data.get('place_ids', [])
        start_location = data.get('start_location')
        
        if not place_ids:
            return jsonify({'error': 'Thiếu danh sách địa điểm'}), 400
        
        from app.services.itinerary_service import get_itinerary_service
        itinerary_service = get_itinerary_service()
        
        result = itinerary_service.optimize_route(place_ids, start_location)
        
        if not result['success']:
            return jsonify({'error': result.get('error')}), 500
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500