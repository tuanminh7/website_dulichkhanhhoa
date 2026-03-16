from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.business_service import get_business_service

bp = Blueprint('business', __name__, url_prefix='/api/business')
business_service = get_business_service()

@bp.route('/register', methods=['POST'])
@jwt_required()
def register_business():
    user_id = get_jwt_identity()
    data = request.form.to_dict()
    files = request.files
    
    result, status_code = business_service.register_business(user_id, data, files)
    return jsonify(result), status_code

@bp.route('/my-registrations', methods=['GET'])
@jwt_required()
def get_my_registrations():
    user_id = get_jwt_identity()
    # For now, let's just reuse the get_registrations but filtered by user_id
    # We might want to add a specific method for this in BusinessService
    # But for a quick MVP, we'll do:
    from app.models.business_registration import BusinessRegistration
    registrations = BusinessRegistration.query.filter_by(user_id=user_id).order_by(BusinessRegistration.created_at.desc()).all()
    return jsonify([r.to_dict() for r in registrations]), 200
