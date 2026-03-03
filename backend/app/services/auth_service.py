import re, json

from flask import current_app, session
from flask_login import login_user, logout_user
from app.models.user import User
from app import db
from flask_jwt_extended import (create_access_token, create_refresh_token)


def validate_email(email) -> bool:
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password(password) -> tuple[bool, str]:
    if len(password) < 6:
        return False, "Mật khẩu phải có ít nhất 6 ký tự"
    return True, None


class AuthService:
    @staticmethod
    def register_user(email, password):
        try:
            # Validation
            if not email or not password:
                return {'error': 'Vui lòng điền đầy đủ thông tin'}, 400

            if not validate_email(email):
                return {'error': 'Email không hợp lệ'}, 400

            is_valid, error_msg = validate_password(password)
            if not is_valid:
                return {'error': error_msg}, 400

            if User.query.filter_by(email=email).first():
                return {'error': 'Email đã được đăng ký'}, 400

            # Create user
            user = User(email=email)
            user.set_password(password)

            db.session.add(user)
            db.session.commit()

            return {
                'message': 'Đăng ký thành công',
                'user': user.to_dict()
            }, 201

        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

    @staticmethod
    def login_user_by_email(email, password, remember=False):
        try:
            if not email or not password:
                return {'error': 'Vui lòng điền đầy đủ thông tin'}, 400

            user = User.query.filter_by(email=email).first()

            if not user or not user.check_password(password):
                return {'error': 'Tên đăng nhập hoặc mật khẩu không đúng'}, 401

            # Login
            login_user(user, remember=remember)
            # session['user_id'] = user.id

            a_token = create_access_token(identity=email)
            r_token = create_refresh_token(identity=email)

            return {
                'message': 'Đăng nhập thành công',
                "access_token": a_token, 
                "refresh_token": r_token,
                'user': user.to_dict()
            }, 200

        except Exception as e:
            return {'error': str(e)}, 500


    @staticmethod
    def logout_user():
        try:
            logout_user()
            return {'message': 'Đăng xuất thành công'}, 200
        except Exception as e:
            return {'error': str(e)}, 500


    @staticmethod
    def change_password(user, old_password, new_password):
        """Change user password"""
        try:
            if not old_password or not new_password:
                return {'error': 'Vui lòng điền đầy đủ thông tin'}, 400

            if not user.check_password(old_password):
                return {'error': 'Mật khẩu cũ không đúng'}, 400

            is_valid, error_msg = validate_password(new_password)
            if not is_valid:
                return {'error': error_msg}, 400

            user.set_password(new_password)
            db.session.commit()

            return {'message': 'Đổi mật khẩu thành công'}, 200

        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

    @staticmethod
    def update_profile(user, data):
        try:
            if 'preferences' in data:
                user.preferences = json.dumps(data['preferences'], ensure_ascii=False)

            db.session.commit()

            return {
                'message': 'Cập nhật thành công',
                'user': user.to_dict()
            }, 200

        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

        


def get_auth_service():
    return AuthService()
