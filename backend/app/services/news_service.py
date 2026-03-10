from app.models.post import Post, Comment, Like, CommentLike
from app import db
from datetime import datetime
import os
from werkzeug.utils import secure_filename
from flask import current_app

class NewsService:
    @staticmethod
    def allowed_file(filename):
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in current_app.config.get('ALLOWED_EXTENSIONS', set({'png', 'jpg', 'jpeg', 'gif', 'webp'}))
    @staticmethod
    def get_posts(params):
        query = Post.query
        
        # Simple pagination
        page = params.get('page', 1)
        per_page = params.get('per_page', 10)
        
        posts_pagination = query.order_by(Post.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False)
        
        return {
            'posts': [post.to_dict() for post in posts_pagination.items],
            'total': posts_pagination.total,
            'pages': posts_pagination.pages,
            'current_page': posts_pagination.page
        }, 200

    @staticmethod
    def get_post(post_id):
        post = Post.query.get(post_id)
        if not post:
            return {'error': 'Không tìm thấy bài viết'}, 404
            
        post_data = post.to_dict()
        
        # Get top-level comments and nest their replies
        top_level_comments = post.comments.filter_by(parent_id=None).order_by(Comment.created_at.asc()).all()
        
        def serialize_comment(c):
            cdict = c.to_dict()
            cdict['replies'] = [serialize_comment(r) for r in c.replies.order_by(Comment.created_at.asc()).all()]
            return cdict
            
        post_data['comments'] = [serialize_comment(c) for c in top_level_comments]
        
        return post_data, 200

    @staticmethod
    def create_post(user_id, data, files):
        title = data.get('title')
        content = data.get('content')
        image_url = data.get('image_url')

        if not title or not content:
            return {'error': 'Tiêu đề và nội dung là bắt buộc'}, 400

        # Handle file upload if present
        file = files.get('image')
        if file and getattr(file, 'filename', ''):
            if not NewsService.allowed_file(file.filename):
                return {'error': 'Định dạng ảnh không hợp lệ'}, 400
            filename = secure_filename(file.filename)
            upload_folder = current_app.config.get('UPLOAD_FOLDER', os.path.join('app', 'static', 'uploads'))
            os.makedirs(upload_folder, exist_ok=True)
            upload_path = os.path.join(upload_folder, filename)
            file.save(upload_path)
            image_url = f'/uploads/{filename}'

        post = Post(
            title=title,
            content=content,
            image_url=image_url,
            author_id=user_id
        )
        
        db.session.add(post)
        db.session.commit()
        
        return post.to_dict(), 201

    @staticmethod
    def add_comment(post_id, user_id, data):
        content = data.get('content')
        parent_id = data.get('parent_id')
        
        if not content:
            return {'error': 'Nội dung bình luận là bắt buộc'}, 400
            
        post = Post.query.get(post_id)
        if not post:
            return {'error': 'Không tìm thấy bài viết'}, 404
            
        comment = Comment(
            post_id=post_id,
            user_id=user_id,
            content=content,
            parent_id=parent_id
        )
        
        db.session.add(comment)
        db.session.commit()
        
        # Return serialized comment with empty replies array to match expected frontend structure
        comment_dict = comment.to_dict()
        comment_dict['replies'] = []
        return comment_dict, 201
        
        return comment.to_dict(), 201

    @staticmethod
    def toggle_comment_like(comment_id, user_id):
        comment = Comment.query.get(comment_id)
        if not comment:
            return {'error': 'Không tìm thấy bình luận'}, 404
            
        like = CommentLike.query.filter_by(comment_id=comment_id, user_id=user_id).first()
        if like:
            db.session.delete(like)
            db.session.commit()
            return {'message': 'Đã bỏ thích bình luận', 'liked': False}, 200
        else:
            like = CommentLike(comment_id=comment_id, user_id=user_id)
            db.session.add(like)
            db.session.commit()
            return {'message': 'Đã thích bình luận', 'liked': True}, 201

    @staticmethod
    def toggle_like(post_id, user_id):
        post = Post.query.get(post_id)
        if not post:
            return {'error': 'Không tìm thấy bài viết'}, 404
            
        like = Like.query.filter_by(post_id=post_id, user_id=user_id).first()
        if like:
            db.session.delete(like)
            db.session.commit()
            return {'message': 'Đã bỏ thích', 'liked': False}, 200
        else:
            like = Like(post_id=post_id, user_id=user_id)
            db.session.add(like)
            db.session.commit()
            return {'message': 'Đã thích', 'liked': True}, 201
