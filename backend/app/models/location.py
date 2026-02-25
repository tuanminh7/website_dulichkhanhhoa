from datetime import datetime
from app import db


class Category(db.Model):
    """Category of travel content (e.g., Attraction, Food, Stay)"""
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    icon = db.Column(db.String(255))
    type = db.Column(db.Enum('ATTRACTION', 'FOOD', 'STAY', name='category_types'), nullable=False)
    
    # Relationships
    locations = db.relationship('Location', backref='category', lazy='dynamic')
    user_preferences = db.relationship('UserPreference', backref='category', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'icon': self.icon,
            'type': self.type
        }


class Location(db.Model):
    """Detailed information about a location"""
    __tablename__ = 'locations'
    
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False, index=True)
    description = db.Column(db.Text)
    address = db.Column(db.String(300))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    price_range_min = db.Column(db.Float)
    price_range_max = db.Column(db.Float)
    rating_avg = db.Column(db.Float, default=0.0)
    status = db.Column(db.Enum('ACTIVE', 'INACTIVE', name='location_status'), default='ACTIVE')
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    images = db.relationship('LocationImage', backref='location', lazy='dynamic', cascade='all, delete-orphan')
    opening_hours = db.relationship('OpeningHour', backref='location', lazy='dynamic', cascade='all, delete-orphan')
    reviews = db.relationship('Review', backref='location', lazy='dynamic', cascade='all, delete-orphan')
    favorites = db.relationship('Favorite', backref='location', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'category_id': self.category_id,
            'name': self.name,
            'description': self.description,
            'address': self.address,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'price_range_min': self.price_range_min,
            'price_range_max': self.price_range_max,
            'rating_avg': self.rating_avg,
            'status': self.status
        }


class LocationImage(db.Model):
    """Image gallery for a location"""
    __tablename__ = 'location_images'
    
    id = db.Column(db.Integer, primary_key=True)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=False)
    image_url = db.Column(db.String(255), nullable=False)
    is_primary = db.Column(db.Boolean, default=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'location_id': self.location_id,
            'image_url': self.image_url,
            'is_primary': self.is_primary
        }


class OpeningHour(db.Model):
    """Opening and closing hours for a location"""
    __tablename__ = 'opening_hours'
    
    id = db.Column(db.Integer, primary_key=True)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=False)
    day_of_week = db.Column(db.Integer)  # 0-6 (Mon-Sun)
    open_time = db.Column(db.Time)
    close_time = db.Column(db.Time)
    
    def to_dict(self):
        return {
            'id': self.id,
            'location_id': self.location_id,
            'day_of_week': self.day_of_week,
            'open_time': self.open_time.strftime('%H:%M') if self.open_time else None,
            'close_time': self.close_time.strftime('%H:%M') if self.close_time else None
        }
