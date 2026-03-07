from app.services.auth_service import AuthService
from flask import Blueprint, request, jsonify, make_response, current_app
from flask_jwt_extended import jwt_required, current_user, get_jwt, create_access_token, get_jwt_identity
from app.models.user import User
from app import jwt, cache

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@jwt.token_in_blocklist_loader
def check_if_token_is_revoked(jwt_header, jwt_payload) -> bool:
    jti = jwt_payload["jti"]
    # cache = blacklist
    token_in_redis = cache.get(jti)
    return token_in_redis is not None

@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data) -> User:
    identity = jwt_data["sub"]
    return User.query.get(identity)

# ------

@bp.route('/register', methods=['POST'])
def register():
    data: dict = request.get_json()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '')
    fullname = data.get('fullname', '')
    password = data.get('password', '')
    
    result, status_code = AuthService.register_user(email, password, fullname, phone)
    return jsonify(result), status_code


@bp.route('/login', methods=['POST'])
def login():
    print(request.cookies)
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    result, status_code = AuthService.login_user_by_email(email, password)    

    response = make_response(jsonify(result), status_code)

    response.set_cookie(
        "access_token_cookie",       
        result['access_token'],         
        httponly=True,         
        # secure=True,           
        samesite='Strict',     
        max_age=current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES', 900)
    )

    response.set_cookie(
        "refresh_token_cookie",       
        result['refresh_token'],         
        httponly=True,         
        # secure=True,           
        samesite='Strict',     
        max_age=current_app.config.get('JWT_REFRESH_TOKEN_EXPIRES', 259200)
    )

    return response


@bp.route('/logout', methods=['POST'])
@jwt_required(verify_type=False)
def logout():
    token_data = get_jwt()
    result, status_code = AuthService.logout_user(token_data)
    resp = make_response(jsonify(result), status_code)

    resp.set_cookie("access_token", "", httponly=True, expires=0)
    resp.set_cookie("refresh_token", "", httponly=True, expires=0)
    return resp, 200


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
    if current_user:
        return jsonify({
            'authenticated': True,
            'user': current_user.to_dict()
        })
    return jsonify({'authenticated': False}), 401


@bp.route("/refresh", methods=['POST'])
@jwt_required(refresh=True)
def refesh_token():
    print(get_jwt_identity())
    access_token = create_access_token(identity=get_jwt_identity())
    response = make_response({
        "access_token" : access_token,
    })
    response.set_cookie(
        "access_token_cookie",       
        access_token,         
        httponly=True,         
        # secure=True,           
        samesite='Strict',     
        max_age=current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES', 900)
    )

    return response, 201