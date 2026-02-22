from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.services.admin_service import get_admin_service

bp = Blueprint('admin', __name__, url_prefix='/api/admin')
admin_service = get_admin_service()

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
    result, status_code = admin_service.get_dashboard_stats()
    return jsonify(result), status_code

@bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    """Get all users"""
    params = request.args.to_dict()
    if 'page' in params: params['page'] = int(params['page'])
    if 'per_page' in params: params['per_page'] = int(params['per_page'])
    
    result, status_code = admin_service.get_users(params)
    return jsonify(result), status_code

@bp.route('/users/<int:user_id>/toggle-active', methods=['POST'])
@admin_required
def toggle_user_active(user_id):
    """Toggle user active status"""
    result, status_code = admin_service.toggle_user_active(user_id, current_user)
    return jsonify(result), status_code

@bp.route('/users/<int:user_id>/make-admin', methods=['POST'])
@admin_required
def make_admin(user_id):
    """Make user admin"""
    result, status_code = admin_service.make_admin(user_id)
    return jsonify(result), status_code

@bp.route('/analytics', methods=['GET'])
@admin_required
def get_analytics():
    """Get analytics data"""
    result, status_code = admin_service.get_analytics()
    return jsonify(result), status_code