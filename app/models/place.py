from datetime import datetime
from app import db


class Place(db.Model):
    """Place/Attraction model"""
    
    __tablename__ = 'places'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, index=True)
    slug = db.Column(db.String(250), unique=True, index=True)
    category = db.Column(db.String(50), nullable=False, index=True)
    # Categories: tourist_spot, restaurant, accommodation, activity
    
    description = db.Column(db.Text)
    short_description = db.Column(db.String(500))
    
    # Location
    address = db.Column(db.String(300))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    
    # Contact
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    website = db.Column(db.String(300))
    
    # Pricing
    price_range = db.Column(db.String(20))  # $, $$, $$$, $$$$
    estimated_cost = db.Column(db.Float)  # VND
    
    # Media
    main_image = db.Column(db.String(300))
    images = db.Column(db.Text)  # JSON array of image URLs
    
    # Ratings
    rating = db.Column(db.Float, default=0.0)
    review_count = db.Column(db.Integer, default=0)
    
    # Tags and features
    tags = db.Column(db.Text)  # JSON array
    features = db.Column(db.Text)  # JSON array
    
    # Opening hours
    opening_hours = db.Column(db.Text)  # JSON object
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    is_featured = db.Column(db.Boolean, default=False)
    
    # Metadata
    view_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    reviews = db.relationship('Review', backref='place', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self, include_reviews=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'category': self.category,
            'description': self.description,
            'short_description': self.short_description,
            'address': self.address,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'phone': self.phone,
            'email': self.email,
            'website': self.website,
            'price_range': self.price_range,
            'estimated_cost': self.estimated_cost,
            'main_image': self.main_image,
            'images': self.images,
            'rating': self.rating,
            'review_count': self.review_count,
            'tags': self.tags,
            'features': self.features,
            'opening_hours': self.opening_hours,
            'is_featured': self.is_featured,
            'view_count': self.view_count,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_reviews:
            data['reviews'] = [review.to_dict() for review in self.reviews.limit(10)]
        
        return data
    
    def __repr__(self):
        return f'<Place {self.name}>'


class Review(db.Model):
    """Review model"""
    
    __tablename__ = 'reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    place_id = db.Column(db.Integer, db.ForeignKey('places.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    title = db.Column(db.String(200))
    content = db.Column(db.Text)
    
    # Helpful votes
    helpful_count = db.Column(db.Integer, default=0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'place_id': self.place_id,
            'user': {
                'id': self.user.id,
                'username': self.user.username
            },
            'rating': self.rating,
            'title': self.title,
            'content': self.content,
            'helpful_count': self.helpful_count,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Review {self.id} for Place {self.place_id}>'