from flask import Blueprint, render_template, jsonify
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
########### them route hiện thị địa điểm 
@bp.route('/places/<int:place_id>')
def place_detail(place_id):
    """Trang chi tiết địa điểm"""
    return render_template('place_detail.html')


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

@bp.route('/admin')
def admin():
    """Trang admin"""
    return render_template('admin.html')

@bp.route('/api/stats')
def get_stats():
    """Get system statistics"""
    try:
        from app.models.user import User
        from app.models.interaction import SavedItinerary
        from app.models.location import Location
        
        stats = {
            'total_places': Location.query.filter(Location.status == 'ACTIVE').count(),
            'total_users': User.query.count(),
            'total_itineraries': SavedItinerary.query.count(),
            'categories': {}
        }
        
        # Count by category
        categories = db.session.query(
            Location.category_id,
            func.count(Location.id)
        ).filter(Location.status == 'ACTIVE').group_by(Location.category_id).all()
        
        for category_id, count in categories:
            stats['categories'][str(category_id)] = count
        
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