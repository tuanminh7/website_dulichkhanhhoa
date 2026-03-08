from flask import current_app
from app.models.user import User
from app.models.location import Location
from app.models.interaction import SavedItinerary, Review
from app.models.ai import ChatSession
from app import db
from sqlalchemy import func
from datetime import datetime, timedelta

class AdminService:

    @staticmethod
    def get_dashboard_stats():
        try:
            total_users = User.query.count()
            total_places = Location.query.count()
            active_places = Location.query.filter(Location.status == 'ACTIVE').count()
            total_itineraries = SavedItinerary.query.count()
            total_chat_sessions = ChatSession.query.count()
            
            recent_users = User.query.order_by(User.created_at.desc()).limit(5).all()
            recent_places = Location.query.order_by(Location.created_at.desc()).limit(5).all()
            
            popular_places = Location.query.order_by(Location.rating_avg.desc()).limit(10).all()
            
            # Categories stats
            categories = db.session.query(
                Location.category_id,
                func.count(Location.id)
            ).filter(Location.status == 'ACTIVE').group_by(Location.category_id).all()
            
            category_stats = {cat or 'Uncategorized': count for cat, count in categories}
            
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            new_users_count = User.query.filter(User.created_at >= thirty_days_ago).count()
            
            return {
                'stats': {
                    'total_users': total_users,
                    'total_places': total_places,
                    'active_places': active_places,
                    'total_itineraries': total_itineraries,
                    'total_chat_sessions': total_chat_sessions,
                    'new_users_30_days': new_users_count,
                    'category_stats': category_stats
                },
                'recent_users': [user.to_dict() for user in recent_users],
                'recent_places': [place.to_dict() for place in recent_places],
                'popular_places': [place.to_dict() for place in popular_places]
            }, 200
        except Exception as e:
            return {'error': str(e)}, 500

    @staticmethod
    def get_users(params):
        try:
            page = params.get('page', 1)
            per_page = params.get('per_page', 20)
            search = params.get('search')
            
            query = User.query
            if search:
                search_term = f"%{search}%"
                query = query.filter(
                    or_(
                        User.fullname.ilike(search_term),
                        User.email.ilike(search_term)
                    )
                )
            
            pagination = query.order_by(User.created_at.desc()).paginate(
                page=page, per_page=per_page, error_out=False
            )
            
            return {
                'users': [user.to_dict() for user in pagination.items],
                'total': pagination.total,
                'pages': pagination.pages,
                'current_page': page
            }, 200
        except Exception as e:
            return {'error': str(e)}, 500

    @staticmethod
    def toggle_user_active(user_id, admin_user):
        try:
            user = User.query.get_or_404(user_id)
            if user.role == 'ADMIN':
                 return {'error': 'Không thể thay đổi trạng thái của admin'}, 400
            
            user.is_active = not user.is_active
            db.session.commit()
            
            status = 'kích hoạt' if user.is_active else 'vô hiệu hóa'
            return {
                'message': f'Đã {status} người dùng thành công',
                'user': user.to_dict()
            }, 200
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

    @staticmethod
    def make_admin(user_id):
        try:
            user = User.query.get_or_404(user_id)
            user.role = 'ADMIN'
            db.session.commit()
            return {
                'message': 'Đã cấp quyền admin thành công',
                'user': user.to_dict()
            }, 200
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

    @staticmethod
    def get_analytics():
        try:
            # Simple month-to-month count
            def get_growth_last_year(model):
                growth = []
                for i in range(12, 0, -1):
                    date = datetime.utcnow() - timedelta(days=30 * i)
                    count = model.query.filter(model.created_at <= date).count()
                    growth.append({
                        'month': date.strftime('%Y-%m'),
                        'count': count
                    })
                return growth

            seven_days_ago = datetime.utcnow() - timedelta(days=7)
            active_users = db.session.query(
                User.id, User.fullname, User.email, func.max(ChatSession.updated_at).label('last_active')
            ).join(ChatSession).filter(ChatSession.updated_at >= seven_days_ago).group_by(User.id).all()

            return {
                'user_growth': get_growth_last_year(User),
                'places_growth': get_growth_last_year(Location),
                'active_users': [
                    {
                        'id': u.id,
                        'fullname': u.fullname,
                        'email': u.email,
                        'last_active': u.last_active.isoformat()
                    } for u in active_users
                ]
            }, 200
        except Exception as e:
            return {'error': str(e)}, 500

def get_admin_service():
    return AdminService()
