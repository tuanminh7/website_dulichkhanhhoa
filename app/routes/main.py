from flask import Blueprint, render_template, jsonify
from app.models.place import Place
from app import db
from sqlalchemy import func

bp = Blueprint('main', __name__)


@bp.route('/')
def index():
    """Trang chủ"""
    return render_template('index.html')


@bp.route('/places')
def places():
    """Trang danh sách địa điểm"""
    return render_template('places.html')


@bp.route('/chat')
def chat():
    """Trang chat AI"""
    return render_template('chat.html')


@bp.route('/about')
def about():
    """Trang giới thiệu"""
    return render_template('about.html')


@bp.route('/login')
def login():
    """Trang đăng nhập"""
    return render_template('login.html')


@bp.route('/register')
def register():
    """Trang đăng ký"""
    return render_template('register.html')


@bp.route('/api/stats')
def get_stats():
    """Get system statistics"""
    try:
        from app.models.user import User
        from app.models.itinerary import Itinerary
        
        stats = {
            'total_places': Place.query.filter_by(is_active=True).count(),
            'total_users': User.query.count(),
            'total_itineraries': Itinerary.query.count(),
            'featured_places': Place.query.filter_by(is_featured=True, is_active=True).count(),
            'categories': {}
        }
        
        # Count by category
        categories = db.session.query(
            Place.category,
            func.count(Place.id)
        ).filter_by(is_active=True).group_by(Place.category).all()
        
        for category, count in categories:
            stats['categories'][category] = count
        
        return jsonify(stats)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Tourism API',
        'version': '1.0.0'
    })