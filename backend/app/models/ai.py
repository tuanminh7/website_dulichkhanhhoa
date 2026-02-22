from datetime import datetime
from app import db


class ChatSession(db.Model):
    """Chat session with the AI chatbot"""
    __tablename__ = 'chat_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    title = db.Column(db.String(200))
    
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    messages = db.relationship('ChatMessage', backref='session', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'started_at': self.started_at.isoformat()
        }


class ChatMessage(db.Model):
    """Message history in a chat session"""
    __tablename__ = 'chat_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('chat_sessions.id'), nullable=False)
    sender_type = db.Column(db.Enum('USER', 'AI', name='sender_types'), nullable=False)
    message_content = db.Column(db.Text, nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'sender_type': self.sender_type,
            'message_content': self.message_content,
            'created_at': self.created_at.isoformat()
        }


class CostReference(db.Model):
    """Reference data for travel costs for AI consultant"""
    __tablename__ = 'cost_references'
    
    id = db.Column(db.Integer, primary_key=True)
    item_name = db.Column(db.String(200), nullable=False)
    average_price = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(50))
    
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'item_name': self.item_name,
            'average_price': self.average_price,
            'unit': self.unit,
            'updated_at': self.updated_at.isoformat()
        }
