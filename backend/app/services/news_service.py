from app.models.post import Post, Comment, Like
from app import db
from datetime import datetime

class NewsService:
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
        post_data['comments'] = [c.to_dict() for c in post.comments.order_by(Comment.created_at.asc()).all()]
        
        return post_data, 200

    @staticmethod
    def create_post(user_id, data):
        title = data.get('title')
        content = data.get('content')
        image_url = data.get('image_url')

        if not title or not content:
            return {'error': 'Tiêu đề và nội dung là bắt buộc'}, 400

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
        if not content:
            return {'error': 'Nội dung bình luận là bắt buộc'}, 400
            
        post = Post.query.get(post_id)
        if not post:
            return {'error': 'Không tìm thấy bài viết'}, 404
            
        comment = Comment(
            post_id=post_id,
            user_id=user_id,
            content=content
        )
        
        db.session.add(comment)
        db.session.commit()
        
        return comment.to_dict(), 201

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
