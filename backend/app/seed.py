from app import db
from app.models.location import Category
from app.models.user import User

DEFAULT_CATEGORIES = [
    {'name': 'Địa điểm du lịch', 'type': 'ATTRACTION', 'icon': 'map-pin'},
    {'name': 'Ẩm thực', 'type': 'FOOD', 'icon': 'utensils'},
    {'name': 'Lưu trú', 'type': 'STAY', 'icon': 'hotel'},
]


def seed_reference_data(app, sync_admin_password=False):
    summary = {
        'categories_created': 0,
        'admin_created': False,
        'admin_password_synced': False,
    }

    with app.app_context():
        for category_data in DEFAULT_CATEGORIES:
            exists = Category.query.filter_by(name=category_data['name']).first()
            if exists:
                continue
            db.session.add(Category(**category_data))
            summary['categories_created'] += 1

        admin = User.query.filter_by(email=app.config['ADMIN_EMAIL']).first()
        if not admin:
            admin = User(
                fullname='System Admin',
                email=app.config['ADMIN_EMAIL'],
                role='ADMIN',
                is_active=True,
            )
            admin.set_password(app.config['ADMIN_PASSWORD'])
            db.session.add(admin)
            summary['admin_created'] = True
        elif sync_admin_password:
            admin.fullname = admin.fullname or 'System Admin'
            admin.role = 'ADMIN'
            admin.is_active = True
            admin.set_password(app.config['ADMIN_PASSWORD'])
            summary['admin_password_synced'] = True

        db.session.commit()

    return summary
