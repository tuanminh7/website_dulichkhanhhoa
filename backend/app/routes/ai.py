import json, uuid, os
import pathlib

from flask import Blueprint, request, jsonify, session, Response, stream_with_context, send_file, current_app
from flask_login import current_user, login_required
from app.services.ai_service import get_ai_service
from app.services.itinerary_service import get_itinerary_service
from app.models.ai import ChatSession
from app.models.location import Location
from app import db
from datetime import datetime


bp = Blueprint('ai', __name__, url_prefix='/api/ai')


@bp.route('/img/<slug>', methods=['GET'])
def serve_image(slug):
    """Serve images by short numeric slug ID to avoid long Vietnamese URLs in SSE stream."""
    try:
        backend_dir = pathlib.Path(current_app.root_path).parent
        image_dir = backend_dir / 'static' / 'images' / 'anh'
        if not image_dir.exists():
            image_dir = pathlib.Path(current_app.root_path) / 'static' / 'images' / 'anh'
        
        images = sorted([f for f in os.listdir(image_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))])
        idx = int(slug) - 1
        if 0 <= idx < len(images):
            filepath = image_dir / images[idx]
            return send_file(str(filepath))
        return jsonify({'error': 'Image not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/chat', methods=['POST'])
def chat():
    """Chat với AI (Streaming)"""
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        session_id = data.get('session_id')
        
        if not message:
            return jsonify({'error': 'Tin nhắn không được để trống'}), 400
        
        # Get or create session
        from app.models.ai import ChatSession, ChatMessage
        
<<<<<<< HEAD
        # Get chat history
        chat_session = ChatSession.query.filter_by(id=session_id).first()
        chat_history = []
        
        if chat_session:
            if chat_session.messages:
                chat_history = json.loads(chat_session.messages)
=======
        if session_id:
            chat_session = ChatSession.query.get(session_id)
>>>>>>> Tuan
        else:
            chat_session = None

        if not chat_session:
            chat_session = ChatSession(
<<<<<<< HEAD
                id=session_id,
=======
>>>>>>> Tuan
                user_id=current_user.id if current_user.is_authenticated else None,
                title=message[:100]
            )
            db.session.add(chat_session)
            db.session.commit()
        
        # Get history
        history_msgs = ChatMessage.query.filter_by(session_id=chat_session.id).order_by(ChatMessage.created_at.asc()).all()
        chat_history = []
        for h in history_msgs[-10:]:
            chat_history.append({
                'role': 'user' if h.sender_type == 'USER' else 'assistant',
                'content': h.message_content
            })
        
<<<<<<< HEAD
        
        # Build context
=======
>>>>>>> Tuan
        context = {}
        if current_user.is_authenticated and current_user.preferences:
            try:
                context['user_preferences'] = json.loads(current_user.preferences)
            except: pass

        ai_service = get_ai_service()

        def generate():
            full_response = ""
            # Yield session info first
            yield f"data: {json.dumps({'session_id': chat_session.id})}\n\n"
            
            for chunk in ai_service.chat_stream(message, context=context, chat_history=chat_history):
                full_response += chunk
                yield f"data: {json.dumps({'text': chunk})}\n\n"
            
            # Save messages when done
            try:
                user_msg = ChatMessage(
                    session_id=chat_session.id,
                    sender_type='USER',
                    message_content=message
                )
                ai_msg = ChatMessage(
                    session_id=chat_session.id,
                    sender_type='AI',
                    message_content=full_response
                )
                db.session.add(user_msg)
                db.session.add(ai_msg)
                db.session.commit()
                # Final signal
                yield f"data: {json.dumps({'done': True, 'ai_message': ai_msg.to_dict()})}\n\n"
            except Exception as e:
                current_app.logger.error(f"Error saving chat history: {str(e)}")
            
        resp = Response(stream_with_context(generate()), mimetype='text/event-stream')
        resp.headers['Cache-Control'] = 'no-cache'
        resp.headers['X-Accel-Buffering'] = 'no'
        resp.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        resp.headers['Access-Control-Allow-Credentials'] = 'true'
        return resp
        
    except Exception as e:
        if db.session.is_active:
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
        query = Location.query.filter(Location.status == 'ACTIVE')
        
        if criteria['category'] != 'all':
            # This might need a join or check if category matches something in Location
            pass
        
        locations = query.limit(50).all()
        places_data = [l.to_dict() for l in locations]
        
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


@bp.route('/sessions', methods=['POST'])
def create_session():
    """Tạo cuộc hội thoại mới"""
    try:
        data = request.get_json()
        title = data.get('title', 'Cuộc hội thoại mới')
        
        from app.models.ai import ChatSession
        chat_session = ChatSession(
            user_id=current_user.id if current_user.is_authenticated else None,
            title=title
        )
        db.session.add(chat_session)
        db.session.commit()
        
        return jsonify(chat_session.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/sessions', methods=['GET'])
def get_chat_sessions():
    """Lấy danh sách chat sessions"""
    try:
        if current_user.is_authenticated:
            sessions = ChatSession.query.filter_by(
                user_id=current_user.id
            ).order_by(ChatSession.started_at.desc()).limit(20).all()
        else:
            # For guests, we could return sessions from current flask session if tracked,
            # but for now let's just return empty or recent public ones if any. 
            # Usually guests don't have a history unless stored in localstorage.
            sessions = []
        
        return jsonify([session.to_dict() for session in sessions])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/sessions/<int:session_id>/messages', methods=['GET'])
def get_chat_session_messages(session_id):
    """Lấy danh sách tin nhắn của session"""
    try:
        from app.models.ai import ChatMessage
        messages = ChatMessage.query.filter_by(session_id=session_id).order_by(ChatMessage.created_at.asc()).all()
        return jsonify([m.to_dict() for m in messages])
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

