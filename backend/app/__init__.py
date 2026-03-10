import os
import socket
import time

from flask import Flask
from flask_jwt_extended import JWTManager
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from redis import Redis
from redis.exceptions import RedisError
from sqlalchemy import inspect, text

from config import config


db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()
jwt = JWTManager()


class ResilientCache:
    def __init__(self):
        self.redis_host = os.environ.get('REDIS_HOST', 'localhost')
        self.redis_port = int(os.environ.get('REDIS_PORT', 6379))
        self.redis_probe_timeout = float(os.environ.get('REDIS_PROBE_TIMEOUT', 0.1))
        self.redis = Redis(
            host=self.redis_host,
            port=self.redis_port,
            decode_responses=True,
            db=int(os.environ.get('REDIS_DB', 0)),
            password=os.environ.get('REDIS_PASSWORD', ''),
            socket_connect_timeout=float(os.environ.get('REDIS_CONNECT_TIMEOUT', 0.2)),
            socket_timeout=float(os.environ.get('REDIS_SOCKET_TIMEOUT', 0.2)),
        )
        self.local_store = {}
        self.local_expiry = {}
        self.redis_retry_cooldown = float(os.environ.get('REDIS_RETRY_COOLDOWN', 30))
        self.redis_retry_at = 0.0
        if not self._redis_reachable():
            self._mark_redis_unavailable()

    def _cleanup(self, key=None):
        now = time.time()
        if key is not None:
            expires_at = self.local_expiry.get(key)
            if expires_at and expires_at <= now:
                self.local_store.pop(key, None)
                self.local_expiry.pop(key, None)
            return
        for cache_key, expires_at in list(self.local_expiry.items()):
            if expires_at <= now:
                self.local_store.pop(cache_key, None)
                self.local_expiry.pop(cache_key, None)

    def _use_local(self):
        return time.time() < self.redis_retry_at

    def _redis_reachable(self):
        try:
            with socket.create_connection((self.redis_host, self.redis_port), timeout=self.redis_probe_timeout):
                return True
        except OSError:
            return False

    def _mark_redis_unavailable(self):
        self.redis_retry_at = time.time() + self.redis_retry_cooldown

    def _redis_call(self, operation, fallback):
        if self._use_local() or not self._redis_reachable():
            self._mark_redis_unavailable()
            return fallback()
        try:
            result = operation()
            self.redis_retry_at = 0.0
            return result
        except RedisError:
            self._mark_redis_unavailable()
            return fallback()

    def get(self, key):
        def fallback():
            self._cleanup(key)
            return self.local_store.get(key)

        return self._redis_call(lambda: self.redis.get(key), fallback)

    def set(self, key, value, ex=None):
        def fallback():
            self.local_store[key] = str(value)
            if ex:
                self.local_expiry[key] = time.time() + ex
            else:
                self.local_expiry.pop(key, None)
            return True

        return self._redis_call(lambda: self.redis.set(key, value, ex=ex), fallback)

    def incr(self, key):
        def fallback():
            self._cleanup(key)
            value = int(self.local_store.get(key, '0')) + 1
            self.local_store[key] = str(value)
            return value

        return self._redis_call(lambda: self.redis.incr(key), fallback)

    def expire(self, key, seconds):
        def fallback():
            if key in self.local_store:
                self.local_expiry[key] = time.time() + seconds
                return True
            return False

        return self._redis_call(lambda: self.redis.expire(key, seconds), fallback)

    def delete(self, key):
        def fallback():
            existed = key in self.local_store
            self.local_store.pop(key, None)
            self.local_expiry.pop(key, None)
            return 1 if existed else 0

        return self._redis_call(lambda: self.redis.delete(key), fallback)


cache = ResilientCache()


def ensure_schema_compatibility():
    engine = db.engine
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())

    with engine.begin() as connection:
        if 'users' in table_names:
            user_columns = {column['name'] for column in inspect(engine).get_columns('users')}
            if 'is_active' not in user_columns:
                connection.execute(text('ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1'))
                connection.execute(text('UPDATE users SET is_active = 1 WHERE is_active IS NULL'))

        if 'chat_sessions' in table_names:
            chat_columns = {column['name'] for column in inspect(engine).get_columns('chat_sessions')}
            if 'updated_at' not in chat_columns:
                connection.execute(text('ALTER TABLE chat_sessions ADD COLUMN updated_at DATETIME'))
                connection.execute(text('UPDATE chat_sessions SET updated_at = started_at WHERE updated_at IS NULL'))

        if 'saved_itineraries' in table_names:
            itinerary_columns = {column['name'] for column in inspect(engine).get_columns('saved_itineraries')}
            if 'updated_at' not in itinerary_columns:
                connection.execute(text('ALTER TABLE saved_itineraries ADD COLUMN updated_at DATETIME'))
                connection.execute(text('UPDATE saved_itineraries SET updated_at = created_at WHERE updated_at IS NULL'))


def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    app = Flask(__name__)

    from flask_cors import CORS
    CORS(app, supports_credentials=True)
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)

    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    from app import models  # noqa: F401
    from app.routes import main, auth, places, ai, maps, admin, user, interactions, dishes, news

    app.register_blueprint(main.bp)
    app.register_blueprint(auth.bp)
    app.register_blueprint(places.bp)
    app.register_blueprint(ai.bp)
    app.register_blueprint(maps.bp)
    app.register_blueprint(admin.bp)
    app.register_blueprint(user.bp)
    app.register_blueprint(news.bp)
    app.register_blueprint(interactions.bp)
    app.register_blueprint(dishes.bp)
    
    with app.app_context():
        ensure_schema_compatibility()
        db.create_all()
        from app.models.user import User
        admin = User.query.filter_by(email=app.config['ADMIN_EMAIL']).first()
        if not admin:
            admin = User(fullname='System Admin', email=app.config['ADMIN_EMAIL'], role='ADMIN')
            admin.set_password(app.config['ADMIN_PASSWORD'])
            db.session.add(admin)
            db.session.commit()
    
    return app