from datetime import datetime
from app import db
import json


class ChatSession(db.Model):
    """Chat session model for AI conversations"""
    
    __tablename__ = 'chat_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Session info
    title = db.Column(db.String(200))
    messages = db.Column(db.Text)  # JSON array of messages
    message_count = db.Column(db.Integer, default=0)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'session_id': self.session_id,
            'user_id': self.user_id,
            'title': self.title,
            'messages': json.loads(self.messages) if self.messages else [],
            'message_count': self.message_count,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def get_messages(self):
        """Get messages as list"""
        if not self.messages:
            return []
        try:
            return json.loads(self.messages)
        except:
            return []
    
    def add_message(self, role, content):
        """Add a message to the session"""
        messages = self.get_messages()
        messages.append({
            'role': role,
            'content': content,
            'timestamp': datetime.utcnow().isoformat()
        })
        self.messages = json.dumps(messages, ensure_ascii=False)
        self.message_count = len(messages)
        self.updated_at = datetime.utcnow()
    
    def __repr__(self):
        return f'<ChatSession {self.session_id}>'


class Itinerary(db.Model):
    """Itinerary (lịch trình) model"""
    
    __tablename__ = 'itineraries'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    
    # Trip details
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    duration_days = db.Column(db.Integer)
    
    # Itinerary data (JSON)
    places = db.Column(db.Text)  # JSON array of place IDs and details
    schedule = db.Column(db.Text)  # JSON: day-by-day schedule
    itinerary_data = db.Column(db.Text)  # Full itinerary data from AI
    
    # Budget
    estimated_cost = db.Column(db.Float)
    actual_cost = db.Column(db.Float)
    
    # Status
    status = db.Column(db.String(20), default='draft')  # draft, planned, completed
    is_public = db.Column(db.Boolean, default=False)
    
    # Metadata
    view_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        result = {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'description': self.description,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'duration_days': self.duration_days,
            'places': self.places,
            'schedule': self.schedule,
            'estimated_cost': self.estimated_cost,
            'actual_cost': self.actual_cost,
            'status': self.status,
            'is_public': self.is_public,
            'view_count': self.view_count,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        # Add full itinerary data if available
        if self.itinerary_data:
            try:
                result['itinerary_data'] = json.loads(self.itinerary_data)
            except:
                pass
        
        return result
    
    def get_places_list(self):
        """Get places as list"""
        if not self.places:
            return []
        try:
            return json.loads(self.places)
        except:
            return []
    
    def set_places_list(self, places_list):
        """Set places from list"""
        self.places = json.dumps(places_list, ensure_ascii=False)
    
    def get_schedule(self):
        """Get schedule as dictionary"""
        if not self.schedule:
            return {}
        try:
            return json.loads(self.schedule)
        except:
            return {}
    
    def set_schedule(self, schedule_dict):
        """Set schedule from dictionary"""
        self.schedule = json.dumps(schedule_dict, ensure_ascii=False)
    
    def get_itinerary_data(self):
        """Get full itinerary data as dictionary"""
        if not self.itinerary_data:
            return {}
        try:
            return json.loads(self.itinerary_data)
        except:
            return {}
    
    def set_itinerary_data(self, data_dict):
        """Set full itinerary data from dictionary"""
        self.itinerary_data = json.dumps(data_dict, ensure_ascii=False)
    
    def __repr__(self):
        return f'<Itinerary {self.title}>'