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
    
    app = Flask(__name__)
    # from flask_cors import CORS
    # CORS(app, supports_credentials=True)
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)
    
    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
    
    from app.routes import main, auth, places, ai, maps, admin, user

    app.register_blueprint(main.bp)
    app.register_blueprint(auth.bp)
    app.register_blueprint(places.bp)
    app.register_blueprint(ai.bp)
    app.register_blueprint(maps.bp)
    app.register_blueprint(admin.bp)
    app.register_blueprint(user.bp)
    
    with app.app_context():
        db.create_all()
        from app.models.user import User
        admin = User.query.filter_by(email=app.config['ADMIN_EMAIL']).first()
        if not admin:
            admin = User(fullname='System Admin', email=app.config['ADMIN_EMAIL'], role='ADMIN')
            admin.set_password(app.config['ADMIN_PASSWORD'])
            db.session.add(admin)
            db.session.commit()
    
    return app