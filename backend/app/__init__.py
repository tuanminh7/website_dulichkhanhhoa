import os

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from config import config
from redis import Redis
from werkzeug.middleware.proxy_fix import ProxyFix

db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()
jwt = JWTManager()
cache = Redis(
    host="localhost",
    port=6379,
    decode_responses=True,
    db=0,
    password=os.environ.get('REDIS_PASSWORD', '')
)

def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
<<<<<<< HEAD
    app = Flask(__name__)
    # from flask_cors import CORS
    # CORS(app, supports_credentials=True)
=======
    import pathlib
    # Go up from app/ to backend/ to find static folder
    backend_dir = pathlib.Path(__file__).parent.parent
    static_folder = str(backend_dir / 'static')
    app = Flask(__name__, static_folder=static_folder, static_url_path='/static')
>>>>>>> Tuan
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)
    
    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)
<<<<<<< HEAD
    jwt.init_app(app)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
=======
    cor.init_app(app=app, resources={
        "/api/*": {"origins": "http://localhost:5173", "supports_credentials": True},
        "/static/*": {"origins": "http://localhost:5173"},
        "/api/ai/img/*": {"origins": "http://localhost:5173"}
    })
    
    # allow authentication via Bearer JWT in addition to session cookie
    from app.models.user import User
    import jwt
    from flask import request

    @login_manager.request_loader
    def load_user_from_request(request):
        # check Authorization header for Bearer token
        auth_header = request.headers.get('Authorization')
        if auth_header:
            parts = auth_header.split()
            if parts[0].lower() == 'bearer' and len(parts) == 2:
                token = parts[1]
                try:
                    data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
                    return User.query.get(data.get('user_id'))
                except Exception:
                    return None
        # fallback to default session-based loader (handled elsewhere)
        return None

    login_manager.login_view = 'auth.login'
>>>>>>> Tuan
    
    from app.routes import main, auth, places, ai, maps, admin, user

    app.register_blueprint(main.bp)
    app.register_blueprint(auth.bp)
    app.register_blueprint(places.bp)
    app.register_blueprint(ai.bp)
    app.register_blueprint(maps.bp)
    app.register_blueprint(admin.bp)
    app.register_blueprint(user.bp)

    # @jwt.token_in_blocklist_loader
    # def check_if_token_is_revoked(jwt_header, jwt_payload):
    #     jti = jwt_payload["jti"]
    #     try:
    #         token_in_redis = cache.get(jti)
    #         return token_in_redis is not None
    #     except Exception:
    #         return False

    
    
    with app.app_context():
        db.create_all()
        from app.models.user import User
        admin = User.query.filter_by(email=app.config['ADMIN_EMAIL']).first()
<<<<<<< HEAD
        # if not admin:
        #     admin = User(email=app.config['ADMIN_EMAIL'])
        #     admin.set_password(app.config['ADMIN_PASSWORD'])
        #     admin.role = 'ADMIN'
        #     db.session.add(admin)
        #     db.session.commit()
=======
        if not admin:
            admin = User(fullname='System Admin', email=app.config['ADMIN_EMAIL'], role='ADMIN')
            admin.set_password(app.config['ADMIN_PASSWORD'])
            db.session.add(admin)
            db.session.commit()
>>>>>>> Tuan
    
    return app