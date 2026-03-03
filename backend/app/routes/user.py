from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.services.user_service import get_user_service
from app.services.itinerary_service import get_itinerary_service
from app.models.interaction import Review

bp = Blueprint('user', __name__, url_prefix='/api/user')
user_service = get_user_service()
itinerary_service = get_itinerary_service()

@bp.route('/profile', methods=['GET'])
@login_required
def get_profile():
    """Lấy thông tin profile của user"""
    result, status_code = user_service.get_profile(current_user)
    return jsonify(result), status_code


@bp.route('/profile', methods=['PUT'])
@login_required
def update_profile():
    """Cập nhật thông tin profile"""
    data = request.get_json()
    result, status_code = user_service.update_profile(current_user, data)
    return jsonify(result), status_code


@bp.route('/preferences', methods=['GET'])
@login_required
def get_preferences():
    """Lấy preferences của user"""
    result, status_code = user_service.get_preferences(current_user)
    return jsonify(result), status_code


@bp.route('/preferences', methods=['PUT'])
@login_required
def update_preferences():
    """Cập nhật preferences của user"""
    data = request.get_json()
    result, status_code = user_service.update_preferences(current_user, data)
    return jsonify(result), status_code


@bp.route('/itineraries', methods=['GET'])
@login_required
def get_itineraries():
    """Lấy danh sách lịch trình đã lưu"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    from app.models.interaction import SavedItinerary
    query = SavedItinerary.query.filter_by(user_id=current_user.id)
    pagination = query.order_by(SavedItinerary.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'itineraries': [itinerary.to_dict() for itinerary in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })


@bp.route('/itineraries/<int:itinerary_id>', methods=['GET'])
@login_required
def get_itinerary(itinerary_id):
    """Lấy chi tiết một lịch trình"""
    itinerary = itinerary_service.get_itinerary(itinerary_id, current_user.id)
    if not itinerary:
        return jsonify({'error': 'Không tìm thấy lịch trình'}), 404
    return jsonify(itinerary)


@bp.route('/itineraries/<int:itinerary_id>', methods=['PUT'])
@login_required
def update_itinerary(itinerary_id):
    """Cập nhật lịch trình"""
    data = request.get_json()
    result = itinerary_service.update_itinerary(itinerary_id, current_user.id, data)
    return jsonify(result), 200 if result['success'] else 400


@bp.route('/itineraries/<int:itinerary_id>', methods=['DELETE'])
@login_required
def delete_itinerary(itinerary_id):
    """Xóa lịch trình"""
    result = itinerary_service.delete_itinerary(itinerary_id, current_user.id)
    return jsonify(result), 200 if result['success'] else 400


@bp.route('/reviews', methods=['GET'])
@login_required
def get_reviews():
    """Lấy danh sách reviews của user"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    pagination = Review.query.filter_by(user_id=current_user.id).order_by(
        Review.created_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'reviews': [review.to_dict() for review in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })


@bp.route('/reviews/<int:review_id>', methods=['PUT'])
@login_required
def update_review(review_id):
    """Cập nhật review"""
    review = Review.query.filter_by(id=review_id, user_id=current_user.id).first_or_404()
    data = request.get_json()
    
    if 'rating' in data: review.rating = data['rating']
    if 'content' in data: review.content = data['content']
    if 'comment' in data: review.content = data['comment'] # Support both
    
    import app
    app.db.session.commit()
    return jsonify({'message': 'Cập nhật review thành công', 'review': review.to_dict()})

@bp.route('/reviews/<int:review_id>', methods=['DELETE'])
@login_required
def delete_review(review_id):
    """Xóa review"""
    review = Review.query.filter_by(id=review_id, user_id=current_user.id).first_or_404()
    import app
    app.db.session.delete(review)
    app.db.session.commit()
    return jsonify({'message': 'Xóa review thành công'})

@bp.route('/favorites', methods=['GET'])
@login_required
def get_favorites():
    """Lấy danh sách địa điểm yêu thích"""
    result, status_code = user_service.get_favorites(current_user)
    return jsonify(result), status_code

@bp.route('/favorites/<int:place_id>', methods=['POST'])
@login_required
def add_favorite(place_id):
    """Thêm địa điểm vào danh sách yêu thích"""
    result, status_code = user_service.add_favorite(current_user, place_id)
    return jsonify(result), status_code

@bp.route('/favorites/<int:place_id>', methods=['DELETE'])
@login_required
def remove_favorite(place_id):
    """Xóa địa điểm khỏi danh sách yêu thích"""
    result, status_code = user_service.remove_favorite(current_user, place_id)
    return jsonify(result), status_code

@bp.route('/dashboard', methods=['GET'])
@login_required
def dashboard():
    """Lấy dữ liệu dashboard của user"""
    result, status_code = user_service.get_dashboard_data(current_user)
    return jsonify(result), status_code