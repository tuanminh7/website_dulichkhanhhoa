from flask import Blueprint, render_template, jsonify
from app import db
from sqlalchemy import func

bp = Blueprint('main', __name__)

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


@bp.route('/')
def index():
    """Root index - provide quick info or redirect to health endpoint"""
    # Simple JSON response so visiting the root doesn't return 404
    return jsonify({
        'message': 'Tourism API running',
        'health': '/api/health'
    })