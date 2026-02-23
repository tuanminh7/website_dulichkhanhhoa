import os
from app import create_app, db
from app.models import *


app = create_app(os.getenv('FLASK_ENV', 'development'))


def controller(filename, prompt_command) -> None:
    exec(f"{prompt_command}()")

    # if prompt_command == "run":
    #     run()


def execute_query():
    with app.app_context():
        print(Location.query.filter_by(name="Phố Cổ Hà Nội").first_or_404().to_dict())


def make_shell_context():
    """Make database models available in shell"""
    return {
        'db': db,
        'User': User,
        'UserPreference': UserPreference,
        'Category': Category,
        'Location': Location,
        'LocationImage': LocationImage,
        'OpeningHour': OpeningHour,
        'Review': Review,
        'Favorite': Favorite,
        'SavedItinerary': SavedItinerary,
        'ChatSession': ChatSession,
        'ChatMessage': ChatMessage,
        'CostReference': CostReference,
        'SystemStatistic': SystemStatistic,
        'Dish': Dish,
        'LocationDish': LocationDish,
        'Amenity': Amenity,
        'LocationAmenity': LocationAmenity
    }


def init_db():
    """Initialize the database"""
    with app.app_context():
        db.create_all()
    print("Database initialized successfully!")


def seed_db():
    
    print("Seeding database...")
    
    # 1. Create Categories
    categories_data = [
        {'name': 'Địa điểm du lịch', 'type': 'ATTRACTION', 'icon': 'map-pin'},
        {'name': 'Ẩm thực', 'type': 'FOOD', 'icon': 'utensils'},
        {'name': 'Lưu trú', 'type': 'STAY', 'icon': 'hotel'},
        {'name': 'Hoạt động', 'type': 'ATTRACTION', 'icon': 'activity'}
    ]
    
    categories = {}
    with app.app_context():
        for cat_data in categories_data:
            existing = Category.query.filter_by(name=cat_data['name']).first()
            if not existing:
                    cat = Category(**cat_data)
                    db.session.add(cat)
                    db.session.commit()
                    categories[cat_data['name']] = cat
                    print(f"✓ Created category: {cat_data['name']}")
            else:
                categories[cat_data['name']] = existing

        # 2. Create Users
        admin = User.query.filter_by(email=app.config['ADMIN_EMAIL']).first()
        print(admin)
        if not admin:
            admin = User(
                fullname='Administrator',
                email=app.config['ADMIN_EMAIL'],
                role='ADMIN'
            )
            admin.set_password(app.config['ADMIN_PASSWORD'])
            db.session.add(admin)
            print("✓ Admin user created")
    
        # Create sample user
        user = User.query.filter_by(email='user@example.com').first()
        if not user:
            user = User(
                fullname='Test User',
                email='user@example.com',
                role='USER'
            )
            user.set_password('password123')
            db.session.add(user)
            print("✓ Sample user created")
    
        db.session.commit()
        
        # 3. Create Locations
        sample_locations = [
            {
                'category_id': categories['Địa điểm du lịch'].id,
                'name': 'Vịnh Hạ Long',
                'description': 'Di sản thiên nhiên thế giới với hàng nghìn hòn đảo đá vôi nổi trên mặt nước trong xanh.',
                'address': 'Quảng Ninh, Việt Nam',
                'price_range_min': 500000,
                'price_range_max': 5000000,
                'status': 'ACTIVE'
            },
            {
                'category_id': categories['Địa điểm du lịch'].id,
                'name': 'Phố Cổ Hà Nội',
                'description': 'Khu phố cổ với kiến trúc truyền thống, văn hóa lâu đời và ẩm thực phong phú.',
                'address': 'Hoàn Kiếm, Hà Nội',
                'price_range_min': 0,
                'price_range_max': 1000000,
                'status': 'ACTIVE'
            },
            {
                'category_id': categories['Ẩm thực'].id,
                'name': 'Nhà Hàng Phở Gia Truyền',
                'description': 'Phở Hà Nội truyền thống với công thức gia truyền hơn 50 năm.',
                'address': '49 Bát Đàn, Hoàn Kiếm, Hà Nội',
                'price_range_min': 50000,
                'price_range_max': 150000,
                'status': 'ACTIVE'
            },
            {
                'category_id': categories['Lưu trú'].id,
                'name': 'Khách Sạn Paradise',
                'description': 'Khách sạn 4 sao với đầy đủ tiện nghi hiện đại và dịch vụ chu đáo.',
                'address': 'Ba Đình, Hà Nội',
                'price_range_min': 1000000,
                'price_range_max': 3000000,
                'status': 'ACTIVE'
            },
            {
                'category_id': categories['Hoạt động'].id,
                'name': 'Tour Trekking Sapa',
                'description': 'Tour leo núi và khám phá văn hóa các dân tộc thiểu số tại Sapa.',
                'address': 'Sapa, Lào Cai',
                'price_range_min': 500000,
                'price_range_max': 2000000,
                'status': 'ACTIVE'
            }
        ]
        
        for loc_data in sample_locations:
            existing = Location.query.filter_by(name=loc_data['name']).first()
            if not existing:
                location = Location(**loc_data)
                db.session.add(location)
                print(f"✓ Created location: {loc_data['name']}")
        
        db.session.commit()
    print("\n[INFO] Database seeded successfully!")


def create_admin():
    """Create a new admin user"""
    fullname = input("Full Name: ")
    email = input("Email: ")
    password = input("Password: ")
    
    if User.query.filter_by(email=email).first():
        print("Error: Email already exists!")
        return
    
    admin = User(fullname=fullname, email=email, role='ADMIN')
    admin.set_password(password)
    db.session.add(admin)
    db.session.commit()
    
    print(f"[INFO] Admin user '{fullname}' created successfully!")


def run():
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)

if __name__ == '__main__':

    pass