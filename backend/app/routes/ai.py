import json, os, pathlib, unicodedata, urllib.parse

from flask import Blueprint, request, jsonify, Response, stream_with_context, send_file, current_app
from flask_jwt_extended import jwt_required, current_user
from app.services.ai_service import get_ai_service
from app.services.itinerary_service import get_itinerary_service
from app.models.ai import ChatSession
from app.models.location import Location
from app import db, cache


bp = Blueprint('ai', __name__, url_prefix='/api/ai')


def get_image_dir() -> pathlib.Path | None:
    base = pathlib.Path(current_app.root_path)
    candidates = [
        base / 'static' / 'uploads' / 'images' / 'anh',
        base.parent / 'static' / 'uploads' / 'images' / 'anh',
        pathlib.Path(os.environ.get('IMAGE_DIR', '')) if os.environ.get('IMAGE_DIR') else None,
    ]
    for d in candidates:
        if d and d.exists():
            return d
    return None


def normalize_for_match(s: str) -> str:
    """
    Chuan hoa de so sanh ten file co dau vs slug khong dau.
    Vi du: 'Vinh Van Phong' == 'Vinh Van Phong'
           'Diep Son'       == 'Diep Son'
           'Dao Robinson'   == 'Dao Robinson'
    """
    # B1: Tach dau (NFD)
    s = unicodedata.normalize('NFD', s)
    # B2: Bo dau thanh dieu (category Mn = Mark, Nonspacing)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    # B3: Xu ly chu 'd with stroke' (d -> d)
    s = s.replace('\u0111', 'd').replace('\u0110', 'd')
    # B4: Lowercase + strip
    return s.lower().strip()


@bp.route('/img/<path:slug>', methods=['GET'])
def serve_image(slug):
    try:
        image_dir = get_image_dir()
        current_app.logger.info(f"DEBUG image_dir={image_dir}")
        current_app.logger.info(f"DEBUG slug_decoded={urllib.parse.unquote(slug)}")
        if image_dir:
            files = os.listdir(image_dir)[:3]
            current_app.logger.info(f"DEBUG files={files}")

        if image_dir is None:
            return jsonify({'error': 'Image directory not found'}), 404

        slug_decoded = urllib.parse.unquote(slug)
        slug_norm    = normalize_for_match(slug_decoded)

        EXTENSIONS = ('.jpg', '.jpeg', '.png', '.webp')
        images = sorted([f for f in os.listdir(image_dir) if f.lower().endswith(EXTENSIONS)])

        for filename in images:
            stem = pathlib.Path(filename).stem
            if normalize_for_match(stem) == slug_norm:
                return send_file(str(image_dir / filename))

        if slug_decoded.strip().isdigit():
            idx = int(slug_decoded.strip()) - 1
            if 0 <= idx < len(images):
                current_app.logger.warning(f"serve_image: dung index so '{slug_decoded}' (deprecated)")
                return send_file(str(image_dir / images[idx]))

        current_app.logger.warning(f"serve_image: khong tim thay '{slug_decoded}'")
        return jsonify({'error': f"Image not found: {slug_decoded}"}), 404

    except Exception as e:
        current_app.logger.error(f"serve_image error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/chat', methods=['POST'])
@jwt_required(optional=True)
def chat():
    try:
        data       = request.get_json()
        message    = data.get('message', '').strip()
        session_id = data.get('session_id')

        if not message:
            return jsonify({'error': 'Tin nhan khong duoc de trong'}), 400

        is_guest = not hasattr(current_user, 'id')
        user_id  = request.remote_addr if is_guest else current_user.id

        if is_guest:
            key   = f"guest_chat_limit:{request.remote_addr}"
            count = int(cache.get(key) or 0)
            if count >= 3:
                return jsonify({'error': 'GUEST_LIMIT_REACHED', 'message': 'Ban da het luot chat thu. Vui long dang nhap!'}), 403
            cache.incr(key)
            cache.expire(key, 86400)

        rl_key = f"rate_limit:{user_id}"
        rl     = cache.incr(rl_key)
        if rl == 1:
            cache.expire(rl_key, 60)
        if rl > 5:
            return jsonify({'error': 'Ban dang chat qua nhanh. Vui long doi 1 phut.'}), 429

        from app.models.ai import ChatMessage

        chat_session = None
        if session_id:
            chat_session = ChatSession.query.get(session_id)
            if chat_session:
                if chat_session.user_id:
                    if is_guest or current_user.id != chat_session.user_id:
                        return jsonify({'error': 'Khong co quyen truy cap'}), 403
                elif not is_guest:
                    chat_session = None

        if not chat_session:
            chat_session = ChatSession(
                user_id=None if is_guest else current_user.id,
                title=message[:100]
            )
            db.session.add(chat_session)
            db.session.commit()

        history_msgs = (ChatMessage.query
                        .filter_by(session_id=chat_session.id)
                        .order_by(ChatMessage.created_at.asc()).all())
        chat_history = [
            {'role': 'user' if h.sender_type == 'USER' else 'assistant', 'content': h.message_content}
            for h in history_msgs[-10:]
        ]

        context = {}
        if not is_guest and current_user.preferences:
            try:
                context['user_preferences'] = json.loads(current_user.preferences)
            except Exception:
                pass

        ai_service = get_ai_service()

        def generate():
            full_response = ""
            yield f"data: {json.dumps({'session_id': chat_session.id})}\n\n"
            for chunk in ai_service.chat_stream(message, context=context, chat_history=chat_history):
                full_response += chunk
                yield f"data: {json.dumps({'text': chunk})}\n\n"
            try:
                db.session.add(ChatMessage(session_id=chat_session.id, sender_type='USER', message_content=message))
                ai_msg = ChatMessage(session_id=chat_session.id, sender_type='AI', message_content=full_response)
                db.session.add(ai_msg)
                db.session.commit()
                yield f"data: {json.dumps({'done': True, 'ai_message': ai_msg.to_dict()})}\n\n"
            except Exception as e:
                current_app.logger.error(f"Error saving chat: {str(e)}")
                db.session.rollback()

        resp = Response(stream_with_context(generate()), mimetype='text/event-stream')
        resp.headers['Cache-Control']     = 'no-cache'
        resp.headers['X-Accel-Buffering'] = 'no'
        return resp

    except Exception as e:
        if db.session.is_active:
            db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/generate-itinerary', methods=['POST'])
def generate_itinerary():
    try:
        data = request.get_json()
        preferences = {
            'duration': data.get('duration', 3), 'budget': data.get('budget', 'medium'),
            'interests': data.get('interests', []), 'location': data.get('location', 'Viet Nam'),
            'start_date': data.get('start_date')
        }
        result = get_itinerary_service().generate_smart_itinerary(
            preferences, selected_places=data.get('place_ids', []))
        if not result['success']:
            return jsonify({'error': result.get('error')}), 500
        if current_user.is_authenticated:
            save = get_itinerary_service().save_itinerary(current_user.id, result['itinerary'])
            result['itinerary']['saved'] = save['success']
            if save['success']:
                result['itinerary']['itinerary_id'] = save['itinerary_id']
        return jsonify(result['itinerary'])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/suggest-places', methods=['POST'])
def suggest_places():
    try:
        data     = request.get_json()
        criteria = {'category': data.get('category', 'all'), 'budget': data.get('budget', 'medium'),
                    'interests': data.get('interests', []), 'duration': data.get('duration')}
        places   = [l.to_dict() for l in Location.query.filter(Location.status == 'ACTIVE').limit(50).all()]
        result   = get_ai_service().suggest_places(criteria, places)
        if not result['success']:
            return jsonify({'error': result.get('error')}), 500
        return jsonify(result['suggestions'])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/estimate-cost', methods=['POST'])
def estimate_cost():
    try:
        data           = request.get_json()
        itinerary_data = data.get('itinerary')
        if not itinerary_data:
            return jsonify({'error': 'Thieu thong tin lich trinh'}), 400
        result = get_ai_service().estimate_cost(itinerary_data)
        if not result['success']:
            return jsonify({'error': result.get('error')}), 500
        return jsonify(result['cost'])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/sessions', methods=['POST'])
@jwt_required(optional=True)
def create_session():
    try:
        data         = request.get_json()
        chat_session = ChatSession(
            user_id=current_user.id if hasattr(current_user, 'id') else None,
            title=data.get('title', 'Cuoc hoi thoai moi')
        )
        db.session.add(chat_session)
        db.session.commit()
        return jsonify(chat_session.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_chat_sessions():
    try:
        sessions = (ChatSession.query.filter_by(user_id=current_user.id)
                    .order_by(ChatSession.started_at.desc()).limit(20).all()) if current_user else []
        return jsonify([s.to_dict() for s in sessions])
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
        messages = ChatMessage.query.filter_by(session_id=session_id).order_by(ChatMessage.created_at.asc()).all()
        return jsonify([m.to_dict() for m in messages])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/chat-sessions/<session_id>', methods=['GET'])
@jwt_required()
def get_chat_session(session_id):
    try:
        chat_session = ChatSession.query.filter_by(session_id=session_id).first_or_404()
        if chat_session.user_id and (not current_user or current_user.id != chat_session.user_id):
            return jsonify({'error': 'Khong co quyen truy cap'}), 403
        return jsonify(chat_session.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/chat-sessions/<session_id>', methods=['DELETE'])
@jwt_required()
def delete_chat_session(session_id):
    if not current_user:
        return jsonify({'error': 'Vui long dang nhap'}), 401
    try:
        chat_session = ChatSession.query.filter_by(
            session_id=session_id, user_id=current_user.id).first_or_404()
        db.session.delete(chat_session)
        db.session.commit()
        return jsonify({'message': 'Xoa thanh cong'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500