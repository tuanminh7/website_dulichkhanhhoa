from app.services.auth_service import AuthService
from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token


bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    result, status_code = AuthService.register_user(email, password)
    return jsonify(result), status_code


@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    remember = data.get('remember', False)

    result, status_code = AuthService.login_user_by_email(email, password, remember)    
    return jsonify(result), status_code


@bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    result, status_code = AuthService.logout_user()
    return jsonify(result), status_code


@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    return jsonify(current_user.to_dict())


@bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    data = request.get_json()
    old_password = data.get('old_password', '')
    new_password = data.get('new_password', '')
    
    result, status_code = AuthService.change_password(current_user, old_password, new_password)
    return jsonify(result), status_code

@bp.route('/update-profile', methods=['PUT'])
@jwt_required()
def update_profile():
    data = request.get_json()
    result, status_code = AuthService.update_profile(current_user, data)
    return jsonify(result), status_code

@bp.route('/check-auth', methods=['GET'])
@jwt_required()
def check_auth():
    if current_user.is_authenticated:
        return jsonify({
            'authenticated': True,
            'user': current_user.to_dict()
        })
    return jsonify({'authenticated': False})


# @bp.route("/refresh", mothods=['POST'])
# @jwt_required(refresh=True)
# def refesh_token():        
#     return {
#         "access_token" : create_access_token(identity=get_jwt_identity()),
#     }, 201