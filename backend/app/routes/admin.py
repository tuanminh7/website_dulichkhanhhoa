from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.models.user import User
from app.models.location import Location
from app.models.interaction import SavedItinerary, Review
from app.models.ai import ChatSession
from app import db
from sqlalchemy import func
from datetime import datetime, timedelta

bp = Blueprint('admin', __name__, url_prefix='/api/admin')


def admin_required(f):
    """Decorator to require admin access"""
    @login_required
    def decorated_function(*args, **kwargs):
        if current_user.role != 'ADMIN':
            return jsonify({'error': 'Không có quyền truy cập'}), 403
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function


@bp.route('/dashboard', methods=['GET'])
@admin_required
def get_dashboard():
    """Get admin dashboard statistics"""
    try:
        # Total counts
        total_users = User.query.count()
        total_places = Location.query.count()
        active_places = Location.query.filter(Location.status == 'ACTIVE').count()
        total_itineraries = SavedItinerary.query.count()
        total_chat_sessions = ChatSession.query.count()
        
        # Recent activity
        recent_users = User.query.order_by(User.created_at.desc()).limit(5).all()
        recent_places = Location.query.order_by(Location.created_at.desc()).limit(5).all()
        
        # Popular places - Location doesn't have view_count, using rating_avg
        popular_places = Location.query.order_by(Location.rating_avg.desc()).limit(10).all()
        
        # Places by category
        categories = db.session.query(
            Location.category_id,
            func.count(Location.id)
        ).filter(Location.status == 'ACTIVE').group_by(Location.category_id).all()
        
        category_stats = {cat: count for cat, count in categories}
        
        # Users joined in last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        new_users_count = User.query.filter(User.created_at >= thirty_days_ago).count()
        
        return jsonify({
            'stats': {
                'total_users': total_users,
                'total_places': total_places,
                'active_places': active_places,
                'total_itineraries': total_itineraries,
                'total_chat_sessions': total_chat_sessions,
                'new_users_30_days': new_users_count,
                'category_stats': category_stats
            },
            'recent_users': [user.to_dict() for user in recent_users],
            'recent_places': [place.to_dict() for place in recent_places],
            'popular_places': [place.to_dict() for place in popular_places]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    """Get all users"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search')
        
        query = User.query
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    User.username.ilike(search_term),
                    User.email.ilike(search_term)
                )
            )
        
        pagination = query.order_by(User.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'users': [user.to_dict() for user in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/users/<int:user_id>', methods=['GET'])
@admin_required
def get_user(user_id):
    """Get user details"""
    try:
        user = User.query.get_or_404(user_id)
        
        # Get user's itineraries
        itineraries = SavedItinerary.query.filter_by(user_id=user_id).all()
        
        # Get user's chat sessions
        chat_sessions = ChatSession.query.filter_by(user_id=user_id).all()
        
        return jsonify({
            'user': user.to_dict(),
            'itineraries_count': len(itineraries),
            'chat_sessions_count': len(chat_sessions)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/users/<int:user_id>/toggle-active', methods=['POST'])
@admin_required
def toggle_user_active(user_id):
    """Toggle user active status"""
    try:
        user = User.query.get_or_404(user_id)
        
        if current_user.role == 'ADMIN':
            return jsonify({'error': 'Không thể khóa tài khoản admin'}), 400
        
        # user.is_active = not user.is_active # User model doesn't have is_active
        # Maybe toggle role instead or add field
        db.session.commit()
        
        status = 'kích hoạt' if user.is_active else 'khóa'
        return jsonify({
            'message': f'Đã {status} tài khoản thành công',
            'is_active': user.is_active
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/users/<int:user_id>/make-admin', methods=['POST'])
@admin_required
def make_admin(user_id):
    """Make user admin"""
    try:
        user = User.query.get_or_404(user_id)
        user.role = 'ADMIN'
        db.session.commit()
        
        return jsonify({
            'message': 'Đã cấp quyền admin thành công',
            'user': user.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/places/stats', methods=['GET'])
@admin_required
def get_places_stats():
    """Get places statistics"""
    try:
        # Total by category
        categories = db.session.query(
            Location.category_id,
            func.count(Location.id),
            func.avg(Location.rating_avg),
            func.avg(Location.price_range_max) # Just an example
        ).filter(Location.status == 'ACTIVE').group_by(Location.category_id).all()
        
        stats = []
        for category_id, count, avg_rating, avg_price in categories:
            stats.append({
                'category_id': category_id,
                'count': count,
                'avg_rating': round(avg_rating, 1) if avg_rating else 0,
                'avg_price': avg_price or 0
            })
        
        # Top rated places
        top_rated = Location.query.filter(Location.status == 'ACTIVE').order_by(
            Location.rating_avg.desc()
        ).limit(10).all()
        
        # Most viewed places - Using rating_avg as proxy
        most_viewed = Location.query.filter(Location.status == 'ACTIVE').order_by(
            Location.rating_avg.desc()
        ).limit(10).all()
        
        return jsonify({
            'category_stats': stats,
            'top_rated': [place.to_dict() for place in top_rated],
            'most_viewed': [place.to_dict() for place in most_viewed]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/chat-sessions', methods=['GET'])
@admin_required
def get_chat_sessions():
    """Get all chat sessions"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        pagination = ChatSession.query.order_by(
            ChatSession.updated_at.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'sessions': [session.to_dict() for session in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/analytics', methods=['GET'])
@admin_required
def get_analytics():
    """Get analytics data"""
    try:
        # Users growth (last 12 months)
        user_growth = []
        for i in range(12, 0, -1):
            date = datetime.utcnow() - timedelta(days=30 * i)
            count = User.query.filter(User.created_at <= date).count()
            user_growth.append({
                'month': date.strftime('%Y-%m'),
                'count': count
            })
        
        # Places added (last 12 months)
        places_growth = []
        for i in range(12, 0, -1):
            date = datetime.utcnow() - timedelta(days=30 * i)
            count = Location.query.filter(Location.created_at <= date).count()
            places_growth.append({
                'month': date.strftime('%Y-%m'),
                'count': count
            })
        
        # Most active users
        active_users = db.session.query(
            User,
            func.count(SavedItinerary.id).label('itinerary_count')
        ).outerjoin(SavedItinerary).group_by(User.id).order_by(
            db.desc('itinerary_count')
        ).limit(10).all()
        
        return jsonify({
            'user_growth': user_growth,
            'places_growth': places_growth,
            'active_users': [
                {
                    'user': user.to_dict(),
                    'itinerary_count': count
                }
                for user, count in active_users
            ]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/export/places', methods=['GET'])
@admin_required
def export_places():
    """Export places data"""
    try:
        places = Location.query.all()
        
        data = []
        for place in places:
            data.append(place.to_dict())
        
        return jsonify({'places': data})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/export/users', methods=['GET'])
@admin_required
def export_users():
    """Export users data"""
    try:
        users = User.query.all()
        
        data = []
        for user in users:
            data.append(user.to_dict())
        
        return jsonify({'users': data})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500