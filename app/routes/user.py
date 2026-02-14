from flask import Blueprint, request, jsonify, render_template
from flask_login import login_required, current_user
from app.services.itinerary_service import get_itinerary_service
from app.models.itinerary import Itinerary, ChatSession
from app.models.place import Place, Review
from app.models.user import User
from app import db
import json

bp = Blueprint('user', __name__, url_prefix='/api/user')


@bp.route('/profile', methods=['GET'])
@login_required
def get_profile():
    """Lấy thông tin profile của user"""
    try:
        user_data = {
            'id': current_user.id,
            'username': current_user.username,
            'email': current_user.email,
            'full_name': current_user.full_name,
            'phone': current_user.phone,
            'avatar_url': current_user.avatar_url,
            'bio': current_user.bio,
            'preferences': json.loads(current_user.preferences) if current_user.preferences else {},
            'created_at': current_user.created_at.isoformat(),
            'stats': {
                'itineraries': Itinerary.query.filter_by(user_id=current_user.id).count(),
                'reviews': Review.query.filter_by(user_id=current_user.id).count(),
                'chat_sessions': ChatSession.query.filter_by(user_id=current_user.id).count()
            }
        }
        
        return jsonify(user_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/profile', methods=['PUT'])
@login_required
def update_profile():
    """Cập nhật thông tin profile"""
    try:
        data = request.get_json()
        
        # Update allowed fields
        if 'full_name' in data:
            current_user.full_name = data['full_name']
        if 'phone' in data:
            current_user.phone = data['phone']
        if 'bio' in data:
            current_user.bio = data['bio']
        if 'avatar_url' in data:
            current_user.avatar_url = data['avatar_url']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Cập nhật profile thành công',
            'user': {
                'id': current_user.id,
                'username': current_user.username,
                'email': current_user.email,
                'full_name': current_user.full_name,
                'phone': current_user.phone,
                'bio': current_user.bio,
                'avatar_url': current_user.avatar_url
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/preferences', methods=['GET'])
@login_required
def get_preferences():
    """Lấy preferences của user"""
    try:
        preferences = {}
        if current_user.preferences:
            preferences = json.loads(current_user.preferences)
        
        return jsonify(preferences)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/preferences', methods=['PUT'])
@login_required
def update_preferences():
    """Cập nhật preferences của user"""
    try:
        data = request.get_json()
        
        # Merge with existing preferences
        existing_prefs = {}
        if current_user.preferences:
            existing_prefs = json.loads(current_user.preferences)
        
        existing_prefs.update(data)
        current_user.preferences = json.dumps(existing_prefs, ensure_ascii=False)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Cập nhật preferences thành công',
            'preferences': existing_prefs
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/itineraries', methods=['GET'])
@login_required
def get_itineraries():
    """Lấy danh sách lịch trình đã lưu"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status = request.args.get('status')
        
        query = Itinerary.query.filter_by(user_id=current_user.id)
        
        if status:
            query = query.filter_by(status=status)
        
        pagination = query.order_by(Itinerary.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        itineraries = [itinerary.to_dict() for itinerary in pagination.items]
        
        return jsonify({
            'itineraries': itineraries,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/itineraries/<int:itinerary_id>', methods=['GET'])
@login_required
def get_itinerary(itinerary_id):
    """Lấy chi tiết một lịch trình"""
    try:
        itinerary_service = get_itinerary_service()
        itinerary = itinerary_service.get_itinerary(itinerary_id, current_user.id)
        
        if not itinerary:
            return jsonify({'error': 'Không tìm thấy lịch trình'}), 404
        
        return jsonify(itinerary)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/itineraries/<int:itinerary_id>', methods=['PUT'])
@login_required
def update_itinerary(itinerary_id):
    """Cập nhật lịch trình"""
    try:
        data = request.get_json()
        
        itinerary_service = get_itinerary_service()
        result = itinerary_service.update_itinerary(itinerary_id, current_user.id, data)
        
        if not result['success']:
            return jsonify({'error': result['error']}), 400
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/itineraries/<int:itinerary_id>', methods=['DELETE'])
@login_required
def delete_itinerary(itinerary_id):
    """Xóa lịch trình"""
    try:
        itinerary_service = get_itinerary_service()
        result = itinerary_service.delete_itinerary(itinerary_id, current_user.id)
        
        if not result['success']:
            return jsonify({'error': result['error']}), 400
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/reviews', methods=['GET'])
@login_required
def get_reviews():
    """Lấy danh sách reviews của user"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        pagination = Review.query.filter_by(user_id=current_user.id).order_by(
            Review.created_at.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        reviews = [review.to_dict() for review in pagination.items]
        
        return jsonify({
            'reviews': reviews,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/reviews/<int:review_id>', methods=['PUT'])
@login_required
def update_review(review_id):
    """Cập nhật review"""
    try:
        review = Review.query.filter_by(
            id=review_id,
            user_id=current_user.id
        ).first_or_404()
        
        data = request.get_json()
        
        if 'rating' in data:
            review.rating = data['rating']
        if 'comment' in data:
            review.comment = data['comment']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Cập nhật review thành công',
            'review': review.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/reviews/<int:review_id>', methods=['DELETE'])
@login_required
def delete_review(review_id):
    """Xóa review"""
    try:
        review = Review.query.filter_by(
            id=review_id,
            user_id=current_user.id
        ).first_or_404()
        
        db.session.delete(review)
        db.session.commit()
        
        return jsonify({'message': 'Xóa review thành công'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/favorites', methods=['GET'])
@login_required
def get_favorites():
    """Lấy danh sách địa điểm yêu thích"""
    try:
        # Get favorite place IDs from user preferences
        favorites = []
        if current_user.preferences:
            prefs = json.loads(current_user.preferences)
            favorite_ids = prefs.get('favorite_places', [])
            
            if favorite_ids:
                places = Place.query.filter(Place.id.in_(favorite_ids)).all()
                favorites = [place.to_dict() for place in places]
        
        return jsonify({
            'favorites': favorites,
            'total': len(favorites)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/favorites/<int:place_id>', methods=['POST'])
@login_required
def add_favorite(place_id):
    """Thêm địa điểm vào danh sách yêu thích"""
    try:
        # Check if place exists
        place = Place.query.get_or_404(place_id)
        
        # Get current favorites
        prefs = {}
        if current_user.preferences:
            prefs = json.loads(current_user.preferences)
        
        favorite_ids = prefs.get('favorite_places', [])
        
        if place_id not in favorite_ids:
            favorite_ids.append(place_id)
            prefs['favorite_places'] = favorite_ids
            current_user.preferences = json.dumps(prefs, ensure_ascii=False)
            db.session.commit()
        
        return jsonify({
            'message': 'Đã thêm vào yêu thích',
            'place': place.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/favorites/<int:place_id>', methods=['DELETE'])
@login_required
def remove_favorite(place_id):
    """Xóa địa điểm khỏi danh sách yêu thích"""
    try:
        # Get current favorites
        prefs = {}
        if current_user.preferences:
            prefs = json.loads(current_user.preferences)
        
        favorite_ids = prefs.get('favorite_places', [])
        
        if place_id in favorite_ids:
            favorite_ids.remove(place_id)
            prefs['favorite_places'] = favorite_ids
            current_user.preferences = json.dumps(prefs, ensure_ascii=False)
            db.session.commit()
        
        return jsonify({'message': 'Đã xóa khỏi yêu thích'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/stats', methods=['GET'])
@login_required
def get_stats():
    """Lấy thống kê hoạt động của user"""
    try:
        stats = {
            'itineraries': {
                'total': Itinerary.query.filter_by(user_id=current_user.id).count(),
                'draft': Itinerary.query.filter_by(user_id=current_user.id, status='draft').count(),
                'planned': Itinerary.query.filter_by(user_id=current_user.id, status='planned').count(),
                'completed': Itinerary.query.filter_by(user_id=current_user.id, status='completed').count()
            },
            'reviews': {
                'total': Review.query.filter_by(user_id=current_user.id).count()
            },
            'chat_sessions': {
                'total': ChatSession.query.filter_by(user_id=current_user.id).count()
            },
            'favorites': {
                'total': len(json.loads(current_user.preferences).get('favorite_places', [])) if current_user.preferences else 0
            }
        }
        
        return jsonify(stats)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/dashboard', methods=['GET'])
@login_required
def dashboard():
    """Lấy dữ liệu dashboard của user"""
    try:
        # Get recent itineraries
        recent_itineraries = Itinerary.query.filter_by(
            user_id=current_user.id
        ).order_by(Itinerary.updated_at.desc()).limit(5).all()
        
        # Get recent reviews
        recent_reviews = Review.query.filter_by(
            user_id=current_user.id
        ).order_by(Review.created_at.desc()).limit(5).all()
        
        # Get recent chat sessions
        recent_chats = ChatSession.query.filter_by(
            user_id=current_user.id
        ).order_by(ChatSession.updated_at.desc()).limit(5).all()
        
        # Get stats
        stats = {
            'itineraries_count': Itinerary.query.filter_by(user_id=current_user.id).count(),
            'reviews_count': Review.query.filter_by(user_id=current_user.id).count(),
            'chat_sessions_count': ChatSession.query.filter_by(user_id=current_user.id).count()
        }
        
        return jsonify({
            'stats': stats,
            'recent_itineraries': [i.to_dict() for i in recent_itineraries],
            'recent_reviews': [r.to_dict() for r in recent_reviews],
            'recent_chats': [c.to_dict() for c in recent_chats]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500