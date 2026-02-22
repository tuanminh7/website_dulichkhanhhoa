from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.services.places_service import get_places_service

bp = Blueprint('places', __name__, url_prefix='/api/places')
places_service = get_places_service()

@bp.route('', methods=['GET'])
def get_places():
    """Lấy danh sách địa điểm"""
    params = request.args.to_dict()
    # Pagination params conversion
    if 'page' in params: params['page'] = int(params['page'])
    if 'per_page' in params: params['per_page'] = int(params['per_page'])
    if 'featured' in params: params['featured'] = params['featured'].lower() == 'true'
    
    result, status_code = places_service.get_places(params)
    return jsonify(result), status_code

@bp.route('/<int:place_id>', methods=['GET'])
def get_place(place_id):
    """Lấy chi tiết địa điểm"""
    result, status_code = places_service.get_place(place_id)
    return jsonify(result), status_code

@bp.route('', methods=['POST'])
@login_required
def create_place():
    """Tạo địa điểm mới (Admin only)"""
    # Check for admin role if needed
    # if current_user.role != 'ADMIN':
    #     return jsonify({'error': 'Không có quyền truy cập'}), 403
        
    data = request.form.to_dict() if not request.is_json else request.get_json()
    files = request.files
    
    result, status_code = places_service.create_place(data, files)
    return jsonify(result), status_code

@bp.route('/<int:place_id>', methods=['PUT'])
@login_required
def update_place(place_id):
    """Cập nhật địa điểm (Admin only)"""
    if current_user.role != 'ADMIN':
        return jsonify({'error': 'Không có quyền truy cập'}), 403
    
    data = request.form.to_dict() if not request.is_json else request.get_json()
    files = request.files
    
    result, status_code = places_service.update_place(place_id, data, files)
    return jsonify(result), status_code



@bp.route('/<int:place_id>', methods=['DELETE'])
@login_required
def delete_place(place_id):
    """Xóa địa điểm (Admin only)"""
    if current_user.role != 'ADMIN':
        return jsonify({'error': 'Không có quyền truy cập'}), 403
    
    result, status_code = places_service.delete_place(place_id)
    return jsonify(result), status_code



@bp.route('/<int:place_id>/reviews', methods=['POST'])
@login_required
def add_review(place_id):
    """Thêm đánh giá"""
    data = request.get_json()
    result, status_code = places_service.add_review(place_id, current_user.id, data)
    return jsonify(result), status_code

@bp.route('/categories', methods=['GET'])
def get_categories():
    """Lấy danh sách categories"""
    categories = {
        'tourist_spot': 'Điểm du lịch',
        'restaurant': 'Nhà hàng',
        'accommodation': 'Lưu trú',
        'activity': 'Hoạt động'
    }
    return jsonify(categories)