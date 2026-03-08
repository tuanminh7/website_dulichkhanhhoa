from app import create_app, db
from app.models.user import User
from app.services.auth_service import AuthService
import os

app = create_app('development')

with app.app_context():
    with app.test_request_context():
        print('Searching for test user...')
        user = User.query.filter_by(email='test@example.com').first()
        if user:
            db.session.delete(user)
            db.session.commit()
            print('Cleaned up old test user.')
        
        print('Testing registration...')
        res, code = AuthService.register_user('Test User', 'test@example.com', 'password123')
        # Skip printing Vietnamese characters to avoid CP1252 errors
        print(f'Registration Result Code: {code}')
        
        if code == 201:
            print('Testing login...')
            res, code = AuthService.login_user_by_email('test@example.com', 'password123')
            print(f'Login Result Code: {code}')
            
            if code == 200:
                print('Authentication test PASSED!')
            else:
                print(f'Authentication test FAILED at login. Error: {res}')
        elif code == 400 and res.get('error') == 'Email đã được đăng ký':
             print('Email already registered, testing login directly...')
             res, code = AuthService.login_user_by_email('test@example.com', 'password123')
             print(f'Login Result Code: {code}')
             if code == 200:
                print('Authentication test PASSED (Login with existing user)!')
             else:
                 print(f'Authentication test FAILED at login. Error: {res}')
        else:
            print(f'Authentication test FAILED at registration. Error: {res}')
