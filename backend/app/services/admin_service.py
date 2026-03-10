import json
from datetime import datetime, timedelta

from sqlalchemy import func, or_

from app import cache, db
from app.models.ai import ChatSession
from app.models.interaction import Review, SavedItinerary
from app.models.location import Location
from app.models.user import User
from app.services.places_service import PlacesService


class AdminService:
    DASHBOARD_CACHE_KEY = 'admin:dashboard'

    @staticmethod
    def get_dashboard_stats():
        try:
            cached_payload = cache.get(AdminService.DASHBOARD_CACHE_KEY)
            if cached_payload:
                try:
                    return json.loads(cached_payload), 200
                except (TypeError, json.JSONDecodeError):
                    pass

            total_users = User.query.count()
            total_places = Location.query.count()
            active_places = Location.query.filter(Location.status == 'ACTIVE').count()
            total_itineraries = SavedItinerary.query.count()
            total_chat_sessions = ChatSession.query.count()

            recent_users = User.query.order_by(User.created_at.desc()).limit(5).all()
            recent_places = Location.query.order_by(Location.created_at.desc()).limit(5).all()
            popular_places = Location.query.order_by(Location.rating_avg.desc()).limit(10).all()

            categories = db.session.query(Location.category_id, func.count(Location.id)).filter(
                Location.status == 'ACTIVE'
            ).group_by(Location.category_id).all()
            category_stats = {str(category_id or 'uncategorized'): count for category_id, count in categories}

            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            new_users_count = User.query.filter(User.created_at >= thirty_days_ago).count()

            payload = {
                'stats': {
                    'total_users': total_users,
                    'total_places': total_places,
                    'active_places': active_places,
                    'total_itineraries': total_itineraries,
                    'total_chat_sessions': total_chat_sessions,
                    'new_users_30_days': new_users_count,
                    'category_stats': category_stats,
                },
                'recent_users': [user.to_dict() for user in recent_users],
                'recent_places': PlacesService.serialize_places_summary(recent_places),
                'popular_places': PlacesService.serialize_places_summary(popular_places),
            }
            cache.set(AdminService.DASHBOARD_CACHE_KEY, json.dumps(payload, ensure_ascii=False), ex=120)
            return payload, 200
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
                search_term = f'%{search}%'
                query = query.filter(or_(User.fullname.ilike(search_term), User.email.ilike(search_term)))

            pagination = query.order_by(User.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
            return {
                'users': [user.to_dict() for user in pagination.items],
                'total': pagination.total,
                'pages': pagination.pages,
                'current_page': page,
            }, 200
        except Exception as e:
            return {'error': str(e)}, 500

    @staticmethod
    def toggle_user_active(user_id, admin_user):
        try:
            user = User.query.get_or_404(user_id)
            if user.role == 'ADMIN':
                return {'error': 'Không thể thay đổi trạng thái của admin'}, 400
            if user.id == admin_user.id:
                return {'error': 'Không thể tự vô hiệu hóa tài khoản của chính mình'}, 400

            user.is_active = not bool(user.is_active)
            db.session.commit()

            status = 'kích hoạt' if user.is_active else 'vô hiệu hóa'
            cache.delete(AdminService.DASHBOARD_CACHE_KEY)
            return {'message': f'Đã {status} người dùng thành công', 'user': user.to_dict()}, 200
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

    @staticmethod
    def make_admin(user_id):
        try:
            user = User.query.get_or_404(user_id)
            user.role = 'ADMIN'
            db.session.commit()
            cache.delete(AdminService.DASHBOARD_CACHE_KEY)
            return {'message': 'Đã cấp quyền admin thành công', 'user': user.to_dict()}, 200
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

    @staticmethod
    def get_analytics():
        try:
            def get_growth_last_year(model):
                growth = []
                for months_back in range(12, 0, -1):
                    date = datetime.utcnow() - timedelta(days=30 * months_back)
                    count = model.query.filter(model.created_at <= date).count()
                    growth.append({'month': date.strftime('%Y-%m'), 'count': count})
                return growth

            seven_days_ago = datetime.utcnow() - timedelta(days=7)
            active_users = db.session.query(
                User.id,
                User.fullname,
                User.email,
                func.max(ChatSession.updated_at).label('last_active'),
            ).join(ChatSession).filter(ChatSession.updated_at >= seven_days_ago).group_by(User.id).all()

            return {
                'user_growth': get_growth_last_year(User),
                'places_growth': get_growth_last_year(Location),
                'active_users': [
                    {
                        'id': user.id,
                        'fullname': user.fullname,
                        'email': user.email,
                        'last_active': user.last_active.isoformat() if user.last_active else None,
                    }
                    for user in active_users
                ],
            }, 200
        except Exception as e:
            return {'error': str(e)}, 500



def get_admin_service():
    return AdminService()
