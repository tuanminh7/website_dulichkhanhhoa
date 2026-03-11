import sys
import os
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app import create_app, db
from app.models.user import User
from flask_jwt_extended import create_access_token

app = create_app()
with app.app_context():
    user = User.query.first()
    if not user:
        print("No users in db")
        sys.exit(1)
        
    token = create_access_token(identity=user.id)
    print("Token generated")
    
    with app.test_client() as client:
        # Test post to news
        headers = {"Authorization": f"Bearer {token}"}
        # Simulate formData
        data = {
            "title": "Test Title from Python",
            "content": "Test Content from Python"
        }
        res = client.post('/api/news', data=data, headers=headers)
        print("Response status:", res.status_code)
        print("Response data:", res.data.decode('utf-8'))
