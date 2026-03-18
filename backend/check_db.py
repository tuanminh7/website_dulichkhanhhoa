import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'instance', 'tourism.db')
print(f"Checking DB at: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT id, business_name, status FROM business_registrations;")
    rows = c.fetchall()
    print(f"Found {len(rows)} businesses:")
    for row in rows:
        print(f"ID: {row[0]}, Name: {row[1]}, Status: {row[2]}")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
