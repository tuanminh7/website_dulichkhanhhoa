from flask import Blueprint, request, jsonify, session
from flask_login import login_user, logout_user, login_required, current_user
from app.models.user import User
from app import db
import re

bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password(password):
    """Validate password strength"""
    if len(password) < 6:
        return False, "Mật khẩu phải có ít nhất 6 ký tự"
    return True, None


@bp.route('/register', methods=['POST'])
def register():
    """Đăng ký tài khoản"""
    try:
        data = request.get_json()
        
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        # Validation
        if not username or not email or not password:
            return jsonify({'error': 'Vui lòng điền đầy đủ thông tin'}), 400
        
        if len(username) < 3:
            return jsonify({'error': 'Tên đăng nhập phải có ít nhất 3 ký tự'}), 400
        
        if not validate_email(email):
            return jsonify({'error': 'Email không hợp lệ'}), 400
        
        is_valid, error_msg = validate_password(password)
        if not is_valid:
            return jsonify({'error': error_msg}), 400
        
        # Check if user exists
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Tên đăng nhập đã tồn tại'}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email đã được đăng ký'}), 400
        
        # Create user
        user = User(username=username, email=email)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # Auto login
        login_user(user, remember=True)
        
        return jsonify({
            'message': 'Đăng ký thành công',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/login', methods=['POST'])
def login():
    """Đăng nhập"""
    try:
        data = request.get_json()
        
        username_or_email = data.get('username', '').strip().lower()
        password = data.get('password', '')
        remember = data.get('remember', False)
        
        if not username_or_email or not password:
            return jsonify({'error': 'Vui lòng điền đầy đủ thông tin'}), 400
        
        # Find user by username or email
        user = User.query.filter(
            (User.username == username_or_email) | (User.email == username_or_email)
        ).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Tên đăng nhập hoặc mật khẩu không đúng'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Tài khoản đã bị khóa'}), 403
        
        # Login
        login_user(user, remember=remember)
        
        return jsonify({
            'message': 'Đăng nhập thành công',
            'user': user.to_dict()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/logout', methods=['POST'])
@login_required
def logout():
    """Đăng xuất"""
    try:
        logout_user()
        return jsonify({'message': 'Đăng xuất thành công'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    """Lấy thông tin user hiện tại"""
    return jsonify(current_user.to_dict())


@bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    """Đổi mật khẩu"""
    try:
        data = request.get_json()
        
        old_password = data.get('old_password', '')
        new_password = data.get('new_password', '')
        
        if not old_password or not new_password:
            return jsonify({'error': 'Vui lòng điền đầy đủ thông tin'}), 400
        
        if not current_user.check_password(old_password):
            return jsonify({'error': 'Mật khẩu cũ không đúng'}), 400
        
        is_valid, error_msg = validate_password(new_password)
        if not is_valid:
            return jsonify({'error': error_msg}), 400
        
        current_user.set_password(new_password)
        db.session.commit()
        
        return jsonify({'message': 'Đổi mật khẩu thành công'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/update-profile', methods=['PUT'])
@login_required
def update_profile():
    """Cập nhật thông tin cá nhân"""
    try:
        data = request.get_json()
        
        # Update allowed fields
        if 'preferences' in data:
            import json
            current_user.preferences = json.dumps(data['preferences'], ensure_ascii=False)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Cập nhật thành công',
            'user': current_user.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/check-auth', methods=['GET'])
def check_auth():
    """Check authentication status"""
    if current_user.is_authenticated:
        return jsonify({
            'authenticated': True,
            'user': current_user.to_dict()
        })
    return jsonify({'authenticated': False})