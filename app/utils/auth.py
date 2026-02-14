from functools import wraps
from flask import jsonify
from flask_login import current_user


def admin_required(f):
    """Decorator to require admin access"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({'error': 'Vui lòng đăng nhập'}), 401
        
        if not current_user.is_admin:
            return jsonify({'error': 'Không có quyền truy cập'}), 403
        
        return f(*args, **kwargs)
    
    return decorated_function


def optional_login(f):
    """Decorator for endpoints that work with or without login"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Add user info to kwargs if authenticated
        kwargs['user'] = current_user if current_user.is_authenticated else None
        return f(*args, **kwargs)
    
    return decorated_function