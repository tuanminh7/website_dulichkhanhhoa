from datetime import datetime
from app import db


class Review(db.Model):
    """Review and rating for a location"""
    __tablename__ = 'reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-5 stars
    comment = db.Column(db.Text)
    images = db.Column(db.JSON)  # Use JSON for list of image URLs
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'location_id': self.location_id,
            'rating': self.rating,
            'comment': self.comment,
            'images': self.images,
            'created_at': self.created_at.isoformat()
        }


class Favorite(db.Model):
    """User's favorite locations"""
    __tablename__ = 'favorites'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'location_id': self.location_id,
            'created_at': self.created_at.isoformat()
        }


class SavedItinerary(db.Model):
    __tablename__ = 'saved_itineraries'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    total_budget = db.Column(db.Float)
    nodes = db.Column(db.JSON)  # List of location IDs and order
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'total_budget': self.total_budget,
            'nodes': self.nodes,
            'created_at': self.created_at.isoformat()
        }
