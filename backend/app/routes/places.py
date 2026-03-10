from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.services.places_service import PlacesService

bp = Blueprint('places', __name__, url_prefix='/api/locations')


@bp.route('', methods=['GET'])
def get_places():
    """Lấy danh sách địa điểm"""
    params = request.args.to_dict()
    if 'page' in params: params['page'] = int(params['page'])
    if 'per_page' in params: params['per_page'] = int(params['per_page'])
    if 'featured' in params: params['featured'] = params['featured'].lower() == 'true'
    
    result, status_code = PlacesService.get_places(params)
    return jsonify(result), status_code



@bp.route('/<int:place_id>', methods=['GET'])
def get_place(place_id):
    """Lấy chi tiết địa điểm"""
    result, status_code = PlacesService.get_place(place_id)
    return jsonify(result), status_code



@bp.route('', methods=['POST'])
@login_required
def create_place():
    """Tạo địa điểm mới (Admin only)"""
    if current_user.role != 'ADMIN':
        return jsonify({'error': 'Không có quyền truy cập'}), 403
        
    data = request.form.to_dict() if not request.is_json else request.get_json()
    files = request.files
    
    result, status_code = PlacesService.create_place(data, files)
    return jsonify(result), status_code



@bp.route('/<int:place_id>', methods=['PUT'])
@login_required
def update_place(place_id):
    """Cập nhật địa điểm (Admin only)"""
    if current_user.role != 'ADMIN':
        return jsonify({'error': 'Không có quyền truy cập'}), 403
    
    data = request.form.to_dict() if not request.is_json else request.get_json()
    files = request.files
    
    result, status_code = PlacesService.update_place(place_id, data, files)
    return jsonify(result), status_code



@bp.route('/<int:place_id>', methods=['DELETE'])
@login_required
def delete_place(place_id):
    """Xóa địa điểm (Admin only)"""
    if current_user.role != 'ADMIN':
        return jsonify({'error': 'Không có quyền truy cập'}), 403
    
    result, status_code = PlacesService.delete_place(place_id)
    return jsonify(result), status_code



@bp.route('/<int:place_id>/reviews', methods=['POST'])
@login_required
def add_review(place_id):
    """Thêm đánh giá"""
    data = request.get_json()
    result, status_code = PlacesService.add_review(place_id, current_user.id, data)
    return jsonify(result), status_code



@bp.route('/categories', methods=['GET'])
def get_categories():
    """Lấy danh sách categories"""
    result, status_code = PlacesService.get_categories()
    return jsonify(result), status_code


@bp.route('/categories', methods=['POST'])
@login_required
def create_category():
    """Tạo category mới (Admin only)"""
    if current_user.role != 'ADMIN':
        return jsonify({'error': 'Không có quyền truy cập'}), 403
    
    data = request.get_json()
    result, status_code = PlacesService.create_category(data)
    return jsonify(result), status_code


@bp.route('/categories/<int:category_id>', methods=['PUT'])
@login_required
def update_category(category_id):
    """Cập nhật category (Admin only)"""
    if current_user.role != 'ADMIN':
        return jsonify({'error': 'Không có quyền truy cập'}), 403
    
    data = request.get_json()
    result, status_code = PlacesService.update_category(category_id, data)
    return jsonify(result), status_code


@bp.route('/categories/<int:category_id>', methods=['DELETE'])
@login_required
def delete_category(category_id):
    """Xóa category (Admin only)"""
    if current_user.role != 'ADMIN':
        return jsonify({'error': 'Không có quyền truy cập'}), 403
    
    result, status_code = PlacesService.delete_category(category_id)
    return jsonify(result), status_code


@bp.route('/dishes', methods=['GET'])
def get_dishes():
    """Lấy danh sách món ăn"""
    result, status_code = PlacesService.get_dishes()
    return jsonify(result), status_code