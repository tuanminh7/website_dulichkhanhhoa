from flask import Blueprint, request, jsonify, session
from flask_login import current_user
from app.services.ai_service import get_ai_service
from app.services.itinerary_service import get_itinerary_service
from app.models.itinerary import ChatSession
from app.models.place import Place
from app import db
import json
import uuid

bp = Blueprint('ai', __name__, url_prefix='/api/ai')


@bp.route('/chat', methods=['POST'])
def chat():
    """Chat với AI"""
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        
        if not message:
            return jsonify({'error': 'Tin nhắn không được để trống'}), 400
        
        # Get or create session
        session_id = data.get('session_id') or str(uuid.uuid4())
        
        # Get chat history
        chat_session = ChatSession.query.filter_by(session_id=session_id).first()
        chat_history = []
        
        if chat_session:
            if chat_session.messages:
                chat_history = json.loads(chat_session.messages)
        else:
            # Create new session
            chat_session = ChatSession(
                session_id=session_id,
                user_id=current_user.id if current_user.is_authenticated else None,
                title=message[:100]
            )
            db.session.add(chat_session)
        
        # Build context
        context = {}
        
        # Add user preferences if authenticated
        if current_user.is_authenticated and current_user.preferences:
            context['user_preferences'] = json.loads(current_user.preferences)
        
        # Add selected places if provided
        if 'place_ids' in data:
            places = Place.query.filter(Place.id.in_(data['place_ids'])).all()
            context['selected_places'] = [p.to_dict() for p in places]
        
        # Call AI service
        ai_service = get_ai_service()
        result = ai_service.chat(message, context=context, chat_history=chat_history)
        
        if not result['success']:
            return jsonify({'error': result.get('error')}), 500
        
        # Update chat history
        chat_history.append({
            'role': 'user',
            'content': message,
            'timestamp': str(datetime.utcnow())
        })
        chat_history.append({
            'role': 'assistant',
            'content': result['response'],
            'timestamp': str(datetime.utcnow())
        })
        
        # Save to database
        chat_session.messages = json.dumps(chat_history, ensure_ascii=False)
        chat_session.message_count = len(chat_history)
        db.session.commit()
        
        return jsonify({
            'response': result['response'],
            'session_id': session_id,
            'model': result.get('model')
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/generate-itinerary', methods=['POST'])
def generate_itinerary():
    """Tạo lịch trình tự động"""
    try:
        data = request.get_json()
        
        # Validate preferences
        preferences = {
            'duration': data.get('duration', 3),
            'budget': data.get('budget', 'medium'),
            'interests': data.get('interests', []),
            'location': data.get('location', 'Việt Nam'),
            'start_date': data.get('start_date')
        }
        
        # Get selected places if provided
        selected_places = data.get('place_ids', [])
        
        # Generate itinerary
        itinerary_service = get_itinerary_service()
        result = itinerary_service.generate_smart_itinerary(
            preferences,
            selected_places=selected_places
        )
        
        if not result['success']:
            return jsonify({'error': result.get('error')}), 500
        
        # Save to user's itineraries if authenticated
        if current_user.is_authenticated:
            save_result = itinerary_service.save_itinerary(
                current_user.id,
                result['itinerary']
            )
            result['itinerary']['saved'] = save_result['success']
            if save_result['success']:
                result['itinerary']['itinerary_id'] = save_result['itinerary_id']
        
        return jsonify(result['itinerary'])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/suggest-places', methods=['POST'])
def suggest_places():
    """Gợi ý địa điểm phù hợp"""
    try:
        data = request.get_json()
        
        criteria = {
            'category': data.get('category', 'all'),
            'budget': data.get('budget', 'medium'),
            'interests': data.get('interests', []),
            'duration': data.get('duration')
        }
        
        # Get available places
        query = Place.query.filter_by(is_active=True)
        
        if criteria['category'] != 'all':
            query = query.filter_by(category=criteria['category'])
        
        places = query.limit(50).all()
        places_data = [p.to_dict() for p in places]
        
        # Get AI suggestions
        ai_service = get_ai_service()
        result = ai_service.suggest_places(criteria, places_data)
        
        if not result['success']:
            return jsonify({'error': result.get('error')}), 500
        
        return jsonify(result['suggestions'])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/estimate-cost', methods=['POST'])
def estimate_cost():
    """Ước tính chi phí"""
    try:
        data = request.get_json()
        
        # Get itinerary data
        itinerary_data = data.get('itinerary')
        if not itinerary_data:
            return jsonify({'error': 'Thiếu thông tin lịch trình'}), 400
        
        # Use AI to estimate cost
        ai_service = get_ai_service()
        result = ai_service.estimate_cost(itinerary_data)
        
        if not result['success']:
            return jsonify({'error': result.get('error')}), 500
        
        return jsonify(result['cost'])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/chat-sessions', methods=['GET'])
def get_chat_sessions():
    """Lấy danh sách chat sessions (cho user đã đăng nhập)"""
    if not current_user.is_authenticated:
        return jsonify({'error': 'Vui lòng đăng nhập'}), 401
    
    try:
        sessions = ChatSession.query.filter_by(
            user_id=current_user.id
        ).order_by(ChatSession.updated_at.desc()).limit(20).all()
        
        return jsonify({
            'sessions': [session.to_dict() for session in sessions]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/chat-sessions/<session_id>', methods=['GET'])
def get_chat_session(session_id):
    """Lấy chi tiết chat session"""
    try:
        chat_session = ChatSession.query.filter_by(session_id=session_id).first_or_404()
        
        # Check permission
        if chat_session.user_id and (not current_user.is_authenticated or 
                                     current_user.id != chat_session.user_id):
            return jsonify({'error': 'Không có quyền truy cập'}), 403
        
        return jsonify(chat_session.to_dict())
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/chat-sessions/<session_id>', methods=['DELETE'])
def delete_chat_session(session_id):
    """Xóa chat session"""
    if not current_user.is_authenticated:
        return jsonify({'error': 'Vui lòng đăng nhập'}), 401
    
    try:
        chat_session = ChatSession.query.filter_by(
            session_id=session_id,
            user_id=current_user.id
        ).first_or_404()
        
        db.session.delete(chat_session)
        db.session.commit()
        
        return jsonify({'message': 'Xóa thành công'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


from datetime import datetime