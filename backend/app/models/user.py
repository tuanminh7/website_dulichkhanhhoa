from datetime import datetime
from flask_bcrypt import generate_password_hash, check_password_hash
from uuid import uuid4
from app import db, login_manager
from flask_login import UserMixin


def generateUUID():
    return uuid4().hex


class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=generateUUID)
    fullname = db.Column(db.String(100))
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(9))
    avatar = db.Column(db.String(255))
    role = db.Column(db.Enum('GUEST', 'USER', 'ADMIN', name='user_roles'), default='USER')
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    # is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    preferences = db.relationship(
        'UserPreference', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    itineraries = db.relationship(
        'SavedItinerary', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    chat_sessions = db.relationship(
        'ChatSession', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    reviews = db.relationship('Review', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    favorites = db.relationship('Favorite', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'fullname': self.fullname,
            'email': self.email,
            'phone': self.phone,
            'avatar': self.avatar,
            'role': self.role,
            # 'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<User {self.email}>'


class UserPreference(db.Model):
    __tablename__ = 'user_preferences'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    preference_level = db.Column(db.Integer, default=1)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'category_id': self.category_id,
            'preference_level': self.preference_level
        }


    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(user_id)


if __name__ == "__main__" :
    print(generateUUID())