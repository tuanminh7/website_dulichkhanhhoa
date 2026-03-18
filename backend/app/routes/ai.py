import hashlib
import json
import secrets
import time

from flask import Blueprint, Response, current_app, has_request_context, jsonify, request, send_file, stream_with_context
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


def _request_ip() -> str:
    return request.remote_addr or 'unknown'


def _guest_token_hash(raw_token: str) -> str:
    return hashlib.sha256((raw_token or '').encode('utf-8')).hexdigest()


def _new_guest_token() -> str:
    return secrets.token_urlsafe(24)


def _log_chat_event(event: str, **fields):
    if 'path' not in fields and has_request_context():
        fields['path'] = request.path
    payload = {'event': event, **fields}
    current_app.logger.info(f"CHAT_EVT {json.dumps(payload, ensure_ascii=False, sort_keys=True, default=str)}")


def _build_chat_cache_key(chat_session, message: str, chat_history, context) -> str:
    cache_payload = {
        'session_id': chat_session.id if chat_session else None,
        'user_id': getattr(chat_session, 'user_id', None),
        'message': message,
        'history': chat_history or [],
        'context': context or {},
    }
    serialized = json.dumps(cache_payload, ensure_ascii=False, sort_keys=True)
    digest = hashlib.sha256(serialized.encode('utf-8')).hexdigest()
    return f'ai_cache:v3_chat:{digest}'


@bp.route('/img/<slug>', methods=['GET'])
def serve_image(slug):
    try:
        image = resolve_chatbot_image(slug)
        if image:
            _log_chat_event(
                'image_served',
                slug=slug,
                filename=image.get('filename'),
                path='/api/ai/img/' + slug,
            )
            return send_file(str(image['path']))
        _log_chat_event('image_missing', slug=slug, path='/api/ai/img/' + slug)
        return jsonify({'error': 'Image not found'}), 404
    except Exception as e:
        current_app.logger.error(f'Error serving chatbot image {slug}: {str(e)}')
        _log_chat_event('image_serve_error', slug=slug, error=str(e))
        return jsonify({'error': str(e)}), 500


@bp.route('/telemetry', methods=['POST'])
@jwt_required(optional=True)
def chatbot_telemetry():
    try:
        data = request.get_json(silent=True) or {}
        event_type = (data.get('event_type') or '').strip()
        allowed_events = {'client_image_loaded', 'client_image_error', 'client_stream_missing_done'}
        if event_type not in allowed_events:
            return jsonify({'error': 'Unsupported telemetry event'}), 400

        _log_chat_event(
            event_type,
            session_id=data.get('session_id'),
            message_id=data.get('message_id'),
            image_slug=data.get('image_slug'),
            image_url=data.get('image_url'),
            user_type='user' if hasattr(current_user, 'id') else 'guest',
            ip=_request_ip(),
        )
        return jsonify({'ok': True}), 202
    except Exception as e:
        current_app.logger.error(f'Error receiving chatbot telemetry: {str(e)}')
        _log_chat_event('client_telemetry_error', error=str(e))
        return jsonify({'error': str(e)}), 500


@bp.route('/chat', methods=['POST'])
@jwt_required(optional=True)
def chat():
    try:
        started_at = time.perf_counter()
        data = request.get_json() or {}
        message = (data.get('message') or '').strip()
        session_id = data.get('session_id')
        guest_token = (data.get('guest_token') or '').strip()
        if not message:
            return jsonify({'error': 'Tin nhan khong duoc de trong'}), 400

        is_authenticated = bool(hasattr(current_user, 'id'))
        requester_id = current_user.id if is_authenticated else _request_ip()
        _log_chat_event(
            'chat_request_received',
            session_id=session_id,
            user_type='user' if is_authenticated else 'guest',
            ip=_request_ip(),
            has_guest_token=bool(guest_token),
            message_preview=message[:120],
        )

        if not is_authenticated:
            guest_limit_key = f'guest_chat_limit:{requester_id}'
            guest_count = cache.get(guest_limit_key)
            if guest_count and int(guest_count) >= 3:
                _log_chat_event('guest_limit_blocked', ip=_request_ip(), session_id=session_id)
                return jsonify({
                    'error': 'GUEST_LIMIT_REACHED',
                    'message': 'Ban da het luot chat thu. Vui long dang nhap de luu lich su va tiep tuc tro chuyen!'
                }), 403

        rate_limit_key = f'rate_limit:{requester_id}'
        count = cache.incr(rate_limit_key)
        if count == 1:
            cache.expire(rate_limit_key, 60)
        if count > 5:
            _log_chat_event('chat_rate_limited', requester_id=requester_id, session_id=session_id)
            return jsonify({'error': 'Ban dang chat qua nhanh. Vui long doi 1 phut.'}), 429

        from app.models.ai import ChatMessage, ChatSession

        chat_session = None
        session_guest_token = None
        if session_id:
            chat_session = ChatSession.query.get(session_id)
            if chat_session and chat_session.user_id:
                if not is_authenticated or current_user.id != chat_session.user_id:
                    return jsonify({'error': 'Khong co quyen truy cap doan chat nay'}), 403
            elif chat_session and is_authenticated and chat_session.user_id is None:
                chat_session = None
            elif chat_session and not is_authenticated:
                if chat_session.user_id is not None:
                    return jsonify({'error': 'Khong co quyen truy cap doan chat nay'}), 403
                if not guest_token or chat_session.guest_token_hash != _guest_token_hash(guest_token):
                    return jsonify({'error': 'Khong co quyen truy cap doan chat nay'}), 403

        if not chat_session:
            session_guest_token = _new_guest_token() if not is_authenticated else None
            chat_session = ChatSession(
                user_id=current_user.id if is_authenticated else None,
                guest_token_hash=_guest_token_hash(session_guest_token) if session_guest_token else None,
                title=message[:100],
            )
            db.session.add(chat_session)
            db.session.commit()
            _log_chat_event(
                'chat_session_created',
                session_id=chat_session.id,
                user_type='user' if is_authenticated else 'guest',
            )

        history_msgs = (
            ChatMessage.query.filter_by(session_id=chat_session.id)
            .order_by(ChatMessage.created_at.asc())
            .all()
        )
        chat_history = [
            {'role': 'user' if entry.sender_type == 'USER' else 'assistant', 'content': entry.message_content}
            for entry in history_msgs[-10:]
        ]
        context = {'user_preferences': _user_preference_context(current_user)} if is_authenticated else {}
        cache_key = _build_chat_cache_key(chat_session, message, chat_history, context)
        cached_response = cache.get(cache_key)

        try:
            ai_service = get_ai_service()
        except Exception as e:
            return jsonify({'error': str(e)}), 503

        def generate():
            full_response = ''
            chunk_count = 0
            cache_hit = bool(cached_response)
            images_injected = False
            completed = False
            session_payload = {'session_id': chat_session.id}
            if session_guest_token:
                session_payload['guest_token'] = session_guest_token
            yield f"data: {json.dumps(session_payload)}\n\n"

            if cached_response:
                _log_chat_event('chat_cache_hit', session_id=chat_session.id, cache_key=cache_key)
                yield f"data: {json.dumps({'text': cached_response})}\n\n"
                full_response = str(cached_response)
            else:
                _log_chat_event('chat_stream_started', session_id=chat_session.id, cache_key=cache_key)
                for chunk in ai_service.chat_stream(message, context=context, chat_history=chat_history):
                    chunk_count += 1
                    full_response += chunk
                    yield f"data: {json.dumps({'text': chunk})}\n\n"

            full_response_with_images = ai_service.append_relevant_images(
                full_response,
                f"{message}\n{full_response}",
            )
            if full_response_with_images != full_response:
                images_injected = True
                image_count = full_response_with_images.count('![')
                _log_chat_event(
                    'chat_images_injected',
                    session_id=chat_session.id,
                    image_count=image_count,
                    user_message_preview=message[:80],
                )
                full_response = full_response_with_images
                yield f"data: {json.dumps({'replace_text': full_response})}\n\n"

            normalized_response = full_response.lstrip().lower()
            should_cache_response = full_response and not normalized_response.startswith(('xin loi', 'xin lá'))
            if should_cache_response:
                cache.set(cache_key, full_response, ex=3600)

            try:
                user_msg = ChatMessage(session_id=chat_session.id, sender_type='USER', message_content=message)
                ai_msg = ChatMessage(session_id=chat_session.id, sender_type='AI', message_content=full_response)
                db.session.add(user_msg)
                db.session.add(ai_msg)
                chat_session.updated_at = db.func.now()
                db.session.commit()

                if not is_authenticated:
                    guest_limit_key = f'guest_chat_limit:{_request_ip()}'
                    cache.incr(guest_limit_key)
                    cache.expire(guest_limit_key, 86400)

                _log_chat_event(
                    'chat_completed',
                    session_id=chat_session.id,
                    cache_hit=cache_hit,
                    chunk_count=chunk_count,
                    response_chars=len(full_response),
                    image_count=full_response.count('!['),
                    images_injected=images_injected,
                    duration_ms=round((time.perf_counter() - started_at) * 1000, 2),
                )
                yield f"data: {json.dumps({'done': True, 'ai_message': ai_msg.to_dict()})}\n\n"
            except Exception as e:
                current_app.logger.error(f'Error saving chat history: {str(e)}')
                _log_chat_event(
                    'chat_save_failed',
                    session_id=chat_session.id,
                    error=str(e),
                    response_chars=len(full_response),
                )
                if db.session.is_active:
                    db.session.rollback()

        response = Response(stream_with_context(generate()), mimetype='text/event-stream')
        response.headers['Cache-Control'] = 'no-cache'
        response.headers['X-Accel-Buffering'] = 'no'
        return response
    except Exception as e:
        if db.session.is_active:
            db.session.rollback()
        _log_chat_event('chat_route_error', error=str(e))
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
            'location': data.get('location', 'Viet Nam'),
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
            return jsonify({'error': 'Thieu thong tin lich trinh'}), 400
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
        title = data.get('title', 'Cuoc hoi thoai moi')
        is_authenticated = bool(hasattr(current_user, 'id'))
        session_guest_token = _new_guest_token() if not is_authenticated else None
        chat_session = ChatSession(
            user_id=current_user.id if is_authenticated else None,
            guest_token_hash=_guest_token_hash(session_guest_token) if session_guest_token else None,
            title=title,
        )
        db.session.add(chat_session)
        db.session.commit()
        return jsonify(chat_session.to_dict(guest_token=session_guest_token)), 201
    except Exception as e:
        current_app.logger.error(f'AI route error: {str(e)}')
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_chat_sessions():
    try:
        sessions = (
            ChatSession.query.filter_by(user_id=current_user.id)
            .order_by(ChatSession.updated_at.desc())
            .limit(20)
            .all()
        )
        return jsonify([session.to_dict() for session in sessions])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/sessions/<int:session_id>/messages', methods=['GET'])
@jwt_required(optional=True)
def get_chat_session_messages(session_id):
    try:
        from app.models.ai import ChatMessage

        chat_session = ChatSession.query.get_or_404(session_id)
        if chat_session.user_id:
            if not hasattr(current_user, 'id') or current_user.id != chat_session.user_id:
                return jsonify({'error': 'Khong co quyen truy cap'}), 403
        else:
            guest_token = (request.args.get('guest_token') or '').strip()
            if not guest_token or chat_session.guest_token_hash != _guest_token_hash(guest_token):
                return jsonify({'error': 'Khong co quyen truy cap'}), 403

        messages = ChatMessage.query.filter_by(session_id=session_id).order_by(ChatMessage.created_at.asc()).all()
        return jsonify([message.to_dict() for message in messages])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/chat-sessions/<int:session_id>', methods=['GET'])
@jwt_required()
def get_chat_session(session_id):
    try:
        chat_session = ChatSession.query.get_or_404(session_id)
        if chat_session.user_id != current_user.id:
            return jsonify({'error': 'Khong co quyen truy cap'}), 403
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
        return jsonify({'message': 'Xoa thanh cong'})
    except Exception as e:
        current_app.logger.error(f'AI route error: {str(e)}')
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
