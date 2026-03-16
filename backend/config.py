import os
from datetime import timedelta

from dotenv import dotenv_values

basedir = os.path.abspath(os.path.dirname(__file__))
project_root = os.path.abspath(os.path.join(basedir, '..'))

project_env = dotenv_values(os.path.join(project_root, '.env'))
backend_env = dotenv_values(os.path.join(basedir, '.env'))


def env_value(key, default=None, include_project=True, include_backend=True):
    value = os.environ.get(key)
    if value not in (None, ''):
        return value

    if include_backend:
        value = backend_env.get(key)
        if value not in (None, ''):
            return value

    if include_project:
        value = project_env.get(key)
        if value not in (None, ''):
            return value

    return default


class Config:
    # Flask
    SECRET_KEY = env_value('SECRET_KEY', 'dev-secret-key-please-change')
    FLASK_ENV = env_value('FLASK_ENV', 'development')

    # Google Gemini API
    GEMINI_API_KEY = env_value('GEMINI_API_KEY')
    GEMINI_API_KEYS = env_value('GEMINI_API_KEYS')
    GEMINI_MODEL = env_value('GEMINI_MODEL')

    # File Upload
    UPLOAD_FOLDER = os.path.join(basedir, 'static', 'uploads')
    MAX_CONTENT_LENGTH = int(env_value('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

    # Session
    PERMANENT_SESSION_LIFETIME = timedelta(
        seconds=int(env_value('PERMANENT_SESSION_LIFETIME', 86400))
    )
    SESSION_COOKIE_SECURE = env_value('SESSION_COOKIE_SECURE', 'False') == 'True'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'

    # Authentication
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=3)
    JWT_COOKIE_CSRF_PROTECT = False
    JWT_TOKEN_LOCATION = ['headers', 'cookies']
    JWT_ACCESS_COOKIE_NAME = 'access_token_cookie'
    JWT_REFRESH_COOKIE_NAME = 'refresh_token_cookie'

    # Admin
    ADMIN_EMAIL = env_value('ADMIN_EMAIL', 'admin@tourism.com')
    ADMIN_PASSWORD = env_value('ADMIN_PASSWORD', 'Admin@123456')

    # Redis
    REDIS_PASSWORD = env_value('REDIS_PASSWORD', '')

    # Pagination
    ITEMS_PER_PAGE = 10

    # AI Settings
    AI_MAX_TOKENS = 2048
    AI_TEMPERATURE = 0.7

    @staticmethod
    def init_app(app):
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = (
        os.environ.get('DATABASE_URL')
        or backend_env.get('DATABASE_URL')
        or 'sqlite:///' + os.path.join(basedir, 'tourism.db')
    )


class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_ECHO = False
    SESSION_COOKIE_SECURE = True
    SQLALCHEMY_DATABASE_URI = (
        os.environ.get('DATABASE_URL')
        or project_env.get('DATABASE_URL')
        or backend_env.get('DATABASE_URL')
    )


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig,
}
