import hashlib
import json

from flask import Blueprint, Response, current_app, jsonify, request, send_file, stream_with_context
from flask_jwt_extended import current_user, jwt_required

from app import cache, db
from app.models.ai import ChatSession
from app.models.location import Location
from app.services.ai_service import get_ai_service
from app.services.itinerary_service import get_itinerary_service
from app.utils.chatbot_images import resolve_chatbot_image

bp = Blueprint('ai', __name__, url_prefix='/api/ai')


def _user_preference_context(user):
    if not user or not getattr(user, 'id', None):
        return None
    try:
        preferences = getattr(user, 'preferences', None)
        if hasattr(preferences, 'all'):
            return [preference.to_dict() for preference in preferences.all()]
    except Exception:
        return None
    return None


@bp.route('/img/<slug>', methods=['GET'])
def serve_image(slug):
    try:
        image = resolve_chatbot_image(slug)
        if image:
            return send_file(str(image['path']))
        return jsonify({'error': 'Image not found'}), 404
    except Exception as e:
        current_app.logger.error(f'Error serving chatbot image {slug}: {str(e)}')
        return jsonify({'error': str(e)}), 500


@bp.route('/chat', methods=['POST'])
@jwt_required(optional=True)
def chat():
    try:
        data = request.get_json() or {}
        message = (data.get('message') or '').strip()
        session_id = data.get('session_id')
        if not message:
            return jsonify({'error': 'Tin nhắn không được để trống'}), 400

        user_id = current_user.id if hasattr(current_user, 'id') else request.remote_addr
        if not hasattr(current_user, 'id'):
            guest_limit_key = f'guest_chat_limit:{user_id}'
            guest_count = cache.get(guest_limit_key)
            if guest_count and int(guest_count) >= 3:
                return jsonify({
                    'error': 'GUEST_LIMIT_REACHED',
                    'message': 'Bạn đã hết lượt chat thử. Vui lòng đăng nhập để lưu lịch sử và tiếp tục trò chuyện!'
                }), 403

        rate_limit_key = f'rate_limit:{user_id}'
        count = cache.incr(rate_limit_key)
        if count == 1:
            cache.expire(rate_limit_key, 60)
        if count > 5:
            return jsonify({'error': 'Bạn đang chat quá nhanh. Vui lòng đợi 1 phút.'}), 429

        cache_key = f'ai_cache:v2_image_attach:{hashlib.md5(message.lower().encode()).hexdigest()}'
        cached_response = cache.get(cache_key)

        from app.models.ai import ChatMessage, ChatSession

        chat_session = None
        if session_id:
            chat_session = ChatSession.query.get(session_id)
            if chat_session and chat_session.user_id:
                if not current_user or not hasattr(current_user, 'id') or current_user.id != chat_session.user_id:
                    return jsonify({'error': 'Không có quyền truy cập đoạn chat này'}), 403
            elif chat_session and current_user and hasattr(current_user, 'id') and chat_session.user_id is None:
                chat_session = None

        if not chat_session:
            chat_session = ChatSession(user_id=current_user.id if hasattr(current_user, 'id') else None, title=message[:100])
            db.session.add(chat_session)
            db.session.commit()

        history_msgs = ChatMessage.query.filter_by(session_id=chat_session.id).order_by(ChatMessage.created_at.asc()).all()
        chat_history = [{'role': 'user' if message.sender_type == 'USER' else 'assistant', 'content': message.message_content} for message in history_msgs[-10:]]
        context = {'user_preferences': _user_preference_context(current_user)} if hasattr(current_user, 'id') else {}

        try:
            ai_service = get_ai_service()
        except Exception as e:
            return jsonify({'error': str(e)}), 503

        def generate():
            full_response = ''
            yield f"data: {json.dumps({'session_id': chat_session.id})}\n\n"

            if cached_response:
                yield f"data: {json.dumps({'text': cached_response})}\n\n"
                full_response = str(cached_response)
            else:
                for chunk in ai_service.chat_stream(message, context=context, chat_history=chat_history):
                    full_response += chunk
                    yield f"data: {json.dumps({'text': chunk})}\n\n"

            full_response_with_images = ai_service.append_relevant_images(
                full_response,
                f"{message}\n{full_response}",
            )
            if full_response_with_images != full_response:
                appended_chunk = full_response_with_images[len(full_response):]
                if appended_chunk:
                    current_app.logger.info(
                        'Appended chatbot images to response',
                        extra={'session_id': chat_session.id, 'message': message[:80]}
                    )
                    yield f"data: {json.dumps({'text': appended_chunk})}\n\n"
                full_response = full_response_with_images

            should_cache_response = full_response and not full_response.lstrip().startswith('Xin lỗi, đã có lỗi:')
            if should_cache_response:
                cache.set(cache_key, full_response, ex=3600)

            try:
                user_msg = ChatMessage(session_id=chat_session.id, sender_type='USER', message_content=message)
                ai_msg = ChatMessage(session_id=chat_session.id, sender_type='AI', message_content=full_response)
                db.session.add(user_msg)
                db.session.add(ai_msg)
                chat_session.updated_at = db.func.now()
                db.session.commit()

                if not hasattr(current_user, 'id'):
                    guest_limit_key = f'guest_chat_limit:{request.remote_addr}'
                    cache.incr(guest_limit_key)
                    cache.expire(guest_limit_key, 86400)

                yield f"data: {json.dumps({'done': True, 'ai_message': ai_msg.to_dict()})}\n\n"
            except Exception as e:
                current_app.logger.error(f'Error saving chat history: {str(e)}')

        response = Response(stream_with_context(generate()), mimetype='text/event-stream')
        response.headers['Cache-Control'] = 'no-cache'
        response.headers['X-Accel-Buffering'] = 'no'
        return response
    except Exception as e:
        if db.session.is_active:
            db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/generate-itinerary', methods=['POST'])
@jwt_required(optional=True)
def generate_itinerary():
    try:
        data = request.get_json() or {}
        preferences = {
            'duration': data.get('duration', 3),
            'budget': data.get('budget', 'medium'),
            'interests': data.get('interests', []),
            'location': data.get('location', 'Việt Nam'),
            'start_date': data.get('start_date'),
        }
        selected_places = data.get('place_ids', [])
        try:
            itinerary_service = get_itinerary_service()
            result = itinerary_service.generate_smart_itinerary(preferences, selected_places=selected_places)
        except Exception as e:
            return jsonify({'error': str(e)}), 503
        if not result['success']:
            return jsonify({'error': result.get('error')}), 500

        if hasattr(current_user, 'id'):
            save_result = itinerary_service.save_itinerary(current_user.id, result['itinerary'])
            result['itinerary']['saved'] = save_result['success']
            if save_result['success']:
                result['itinerary']['itinerary_id'] = save_result['itinerary_id']
        return jsonify(result['itinerary'])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/suggest-places', methods=['POST'])
def suggest_places():
    try:
        data = request.get_json() or {}
        criteria = {
            'category': data.get('category', 'all'),
            'budget': data.get('budget', 'medium'),
            'interests': data.get('interests', []),
            'duration': data.get('duration'),
        }
        locations = Location.query.filter(Location.status == 'ACTIVE').limit(50).all()
        places_data = [location.to_dict() for location in locations]
        try:
            ai_service = get_ai_service()
        except Exception as e:
            return jsonify({'error': str(e)}), 503
        result = ai_service.suggest_places(criteria, places_data)
        if not result['success']:
            return jsonify({'error': result.get('error')}), 500
        return jsonify(result['suggestions'])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/estimate-cost', methods=['POST'])
def estimate_cost():
    try:
        data = request.get_json() or {}
        itinerary_data = data.get('itinerary')
        if not itinerary_data:
            return jsonify({'error': 'Thiếu thông tin lịch trình'}), 400
        try:
            ai_service = get_ai_service()
        except Exception as e:
            return jsonify({'error': str(e)}), 503
        result = ai_service.estimate_cost(itinerary_data)
        if not result['success']:
            return jsonify({'error': result.get('error')}), 500
        return jsonify(result['cost'])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/sessions', methods=['POST'])
@jwt_required(optional=True)
def create_session():
    try:
        data = request.get_json() or {}
        title = data.get('title', 'Cuộc hội thoại mới')
        chat_session = ChatSession(user_id=current_user.id if hasattr(current_user, 'id') else None, title=title)
        db.session.add(chat_session)
        db.session.commit()
        return jsonify(chat_session.to_dict()), 201
    except Exception as e:
        current_app.logger.error(f'AI route error: {str(e)}')
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_chat_sessions():
    try:
        sessions = ChatSession.query.filter_by(user_id=current_user.id).order_by(ChatSession.updated_at.desc()).limit(20).all()
        return jsonify([session.to_dict() for session in sessions])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/sessions/<int:session_id>/messages', methods=['GET'])
@jwt_required(optional=True)
def get_chat_session_messages(session_id):
    try:
        from app.models.ai import ChatMessage
        chat_session = ChatSession.query.get_or_404(session_id)
        if chat_session.user_id and (not current_user or not hasattr(current_user, 'id') or current_user.id != chat_session.user_id):
            return jsonify({'error': 'Không có quyền truy cập'}), 403
        messages = ChatMessage.query.filter_by(session_id=session_id).order_by(ChatMessage.created_at.asc()).all()
        return jsonify([message.to_dict() for message in messages])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/chat-sessions/<int:session_id>', methods=['GET'])
@jwt_required()
def get_chat_session(session_id):
    try:
        chat_session = ChatSession.query.get_or_404(session_id)
        if chat_session.user_id and current_user.id != chat_session.user_id:
            return jsonify({'error': 'Không có quyền truy cập'}), 403
        return jsonify(chat_session.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/chat-sessions/<int:session_id>', methods=['DELETE'])
@jwt_required()
def delete_chat_session(session_id):
    try:
        chat_session = ChatSession.query.filter_by(id=session_id, user_id=current_user.id).first_or_404()
        db.session.delete(chat_session)
        db.session.commit()
        return jsonify({'message': 'Xóa thành công'})
    except Exception as e:
        current_app.logger.error(f'AI route error: {str(e)}')
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
