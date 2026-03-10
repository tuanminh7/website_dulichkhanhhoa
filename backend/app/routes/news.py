from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.services.news_service import NewsService

bp = Blueprint('news', __name__, url_prefix='/api/news')


@bp.route('', methods=['GET'])
def get_posts():
    """Lấy danh sách bài viết/tin tức"""
    params = request.args.to_dict()
    if 'page' in params: params['page'] = int(params['page'])
    if 'per_page' in params: params['per_page'] = int(params['per_page'])
    
    result, status_code = NewsService.get_posts(params)
    return jsonify(result), status_code


@bp.route('/<string:post_id>', methods=['GET'])
def get_post(post_id):
    """Lấy chi tiết bài viết"""
    result, status_code = NewsService.get_post(post_id)
    return jsonify(result), status_code


@bp.route('', methods=['POST'])
@login_required
def create_post():
    """Tạo bài viết mới"""
    data = request.get_json()
    result, status_code = NewsService.create_post(current_user.id, data)
    return jsonify(result), status_code


@bp.route('/<string:post_id>/comment', methods=['POST'])
@login_required
def add_comment(post_id):
    """Thêm bình luận vào bài viết"""
    data = request.get_json()
    result, status_code = NewsService.add_comment(post_id, current_user.id, data)
    return jsonify(result), status_code

@bp.route('/<string:post_id>/like', methods=['POST'])
@login_required
def toggle_like(post_id):
    """Thích/Bỏ thích bài viết"""
    result, status_code = NewsService.toggle_like(post_id, current_user.id)
    return jsonify(result), status_code
