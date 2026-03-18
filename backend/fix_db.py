import sqlite3
import os

for db_path in ['tourism.db', 'instance/tourism.db']:
    if os.path.exists(db_path):
        con = sqlite3.connect(db_path)
        try:
            con.execute('DROP TABLE IF EXISTS _alembic_tmp_post_comments')
            con.commit()
            print(f"Dropped from {db_path}")
        except Exception as e:
            print(e)
        finally:
            con.close()
