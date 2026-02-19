#!/usr/bin/env python
"""
Tourism Website Backend
Entry point for the application
"""

import os
from app import create_app, db
from app.models import User, Place, Review, Itinerary, ChatSession

# Create app instance
app = create_app(os.getenv('FLASK_ENV', 'development'))


@app.shell_context_processor
def make_shell_context():
    """Make database models available in shell"""
    return {
        'db': db,
        'User': User,
        'Place': Place,
        'Review': Review,
        'Itinerary': Itinerary,
        'ChatSession': ChatSession
    }


@app.cli.command()
def init_db():
    """Initialize the database"""
    db.create_all()
    print("Database initialized successfully!")


@app.cli.command()
def seed_db():
    """Seed the database with sample data"""
    from datetime import datetime
    import json
    
    print("Seeding database...")
    
    # Create admin user if not exists
    admin = User.query.filter_by(email=app.config['ADMIN_EMAIL']).first()
    if not admin:
        admin = User(
            username='admin',
            email=app.config['ADMIN_EMAIL'],
            is_admin=True
        )
        admin.set_password(app.config['ADMIN_PASSWORD'])
        db.session.add(admin)
        print("✓ Admin user created")
    
    # Create sample user
    user = User.query.filter_by(email='user@example.com').first()
    if not user:
        user = User(
            username='testuser',
            email='user@example.com'
        )
        user.set_password('password123')
        db.session.add(user)
        print("✓ Sample user created")
    
    db.session.commit()
    
    # Create sample places
    sample_places = [
        {
            'name': 'Vịnh Hạ Long',
            'slug': 'vinh-ha-long',
            'category': 'tourist_spot',
            'description': 'Di sản thiên nhiên thế giới với hàng nghìn hòn đảo đá vôi nổi trên mặt nước trong xanh.',
            'short_description': 'Di sản thiên nhiên thế giới UNESCO',
            'address': 'Quảng Ninh, Việt Nam',
            'latitude': 20.9101,
            'longitude': 107.1839,
            'price_range': '$$$',
            'estimated_cost': 1500000,
            'is_featured': True,
            'tags': json.dumps(['thiên nhiên', 'biển', 'du thuyền'], ensure_ascii=False),
            'features': json.dumps(['du thuyền', 'lặn biển', 'kayaking'], ensure_ascii=False)
        },
        {
            'name': 'Phố Cổ Hà Nội',
            'slug': 'pho-co-ha-noi',
            'category': 'tourist_spot',
            'description': 'Khu phố cổ với kiến trúc truyền thống, văn hóa lâu đời và ẩm thực phong phú.',
            'short_description': 'Trung tâm văn hóa lịch sử Hà Nội',
            'address': 'Hoàn Kiếm, Hà Nội',
            'latitude': 21.0358,
            'longitude': 105.8493,
            'price_range': '$',
            'estimated_cost': 200000,
            'is_featured': True,
            'tags': json.dumps(['văn hóa', 'lịch sử', 'ẩm thực'], ensure_ascii=False)
        },
        {
            'name': 'Nhà Hàng Phở Gia Truyền',
            'slug': 'nha-hang-pho-gia-truyen',
            'category': 'restaurant',
            'description': 'Phở Hà Nội truyền thống với công thức gia truyền hơn 50 năm.',
            'short_description': 'Phở Hà Nội chính gốc',
            'address': 'Đống Đa, Hà Nội',
            'latitude': 21.0278,
            'longitude': 105.8342,
            'price_range': '$',
            'estimated_cost': 70000,
            'tags': json.dumps(['phở', 'ẩm thực', 'bình dân'], ensure_ascii=False)
        },
        {
            'name': 'Khách Sạn Paradise',
            'slug': 'khach-san-paradise',
            'category': 'accommodation',
            'description': 'Khách sạn 4 sao với đầy đủ tiện nghi hiện đại và dịch vụ chu đáo.',
            'short_description': 'Khách sạn 4 sao trung tâm thành phố',
            'address': 'Ba Đình, Hà Nội',
            'latitude': 21.0285,
            'longitude': 105.8542,
            'price_range': '$$$',
            'estimated_cost': 1200000,
            'tags': json.dumps(['khách sạn', '4 sao', 'cao cấp'], ensure_ascii=False)
        },
        {
            'name': 'Tour Trekking Sapa',
            'slug': 'tour-trekking-sapa',
            'category': 'activity',
            'description': 'Tour leo núi và khám phá văn hóa các dân tộc thiểu số tại Sapa.',
            'short_description': 'Trải nghiệm trekking và văn hóa miền núi',
            'address': 'Sapa, Lào Cai',
            'latitude': 22.3364,
            'longitude': 103.8438,
            'price_range': '$$',
            'estimated_cost': 800000,
            'is_featured': True,
            'tags': json.dumps(['trekking', 'thiên nhiên', 'văn hóa'], ensure_ascii=False)
        }
    ]
    
    for place_data in sample_places:
        existing = Place.query.filter_by(slug=place_data['slug']).first()
        if not existing:
            place = Place(**place_data)
            db.session.add(place)
            print(f"✓ Created place: {place_data['name']}")
    
    db.session.commit()
    print("\n✅ Database seeded successfully!")


@app.cli.command()
def create_admin():
    """Create a new admin user"""
    username = input("Username: ")
    email = input("Email: ")
    password = input("Password: ")
    
    if User.query.filter_by(email=email).first():
        print("Error: Email already exists!")
        return
    
    if User.query.filter_by(username=username).first():
        print("Error: Username already exists!")
        return
    
    admin = User(username=username, email=email, is_admin=True)
    admin.set_password(password)
    db.session.add(admin)
    db.session.commit()
    
    print(f"✅ Admin user '{username}' created successfully!")


if __name__ == '__main__':
    # Run the application
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"""
    ╔═══════════════════════════════════════════════╗
    ║   Tourism Website Backend API                 ║
    ║   Starting server...                          ║
    ║   URL: http://localhost:{port}                   ║
    ║   Environment: {os.environ.get('FLASK_ENV', 'development')}           ║
    ╚═══════════════════════════════════════════════╝
    """)
    
    app.run(host='0.0.0.0', port=port, debug=debug)