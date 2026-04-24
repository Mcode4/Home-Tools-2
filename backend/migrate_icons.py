import os
import sys
from app.db.db import get_db

def migrate():
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE points SET type='icon' WHERE type='point'")
        conn.commit()
        print(f"MIGRATION: Updated {cursor.rowcount} rows in points table.")
    except Exception as e:
        print(f"MIGRATION ERROR: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
