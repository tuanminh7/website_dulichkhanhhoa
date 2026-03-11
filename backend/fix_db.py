import sys
import os
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app import create_app, db
from sqlalchemy import text

app = create_app()
with app.app_context():
    print(db.engine.url)
    try:
        db.session.execute(text('ALTER TABLE post_comments ADD COLUMN parent_id VARCHAR(36);'))
        db.session.commit()
        print("parent_id added to post_comments")
    except Exception as e:
        print("Error adding parent_id:", e)
        db.session.rollback()

    try:
        db.session.execute(text('''
        CREATE TABLE IF NOT EXISTS comment_likes (
            id INTEGER PRIMARY KEY, 
            comment_id VARCHAR(36) NOT NULL, 
            user_id VARCHAR(36) NOT NULL, 
            created_at DATETIME,
            UNIQUE(comment_id, user_id),
            FOREIGN KEY(comment_id) REFERENCES post_comments(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
        '''))
        db.session.commit()
        print("comment_likes created")
    except Exception as e:
        print("Error creating comment_likes:", e)
        db.session.rollback()

    try:
        db.session.execute(text('''
        CREATE TABLE IF NOT EXISTS post_likes (
            id INTEGER PRIMARY KEY, 
            post_id VARCHAR(36) NOT NULL, 
            user_id VARCHAR(36) NOT NULL, 
            created_at DATETIME,
            UNIQUE(post_id, user_id),
            FOREIGN KEY(post_id) REFERENCES posts(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
        '''))
        db.session.commit()
        print("post_likes created")
    except Exception as e:
        print("Error creating post_likes:", e)
        db.session.rollback()
