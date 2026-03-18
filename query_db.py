import sqlite3

conn = sqlite3.connect('backend/instance/app.db')
c = conn.cursor()
c.execute("SELECT id, user_id FROM chat_sessions WHERE id=15")
print(c.fetchall())
conn.close()
