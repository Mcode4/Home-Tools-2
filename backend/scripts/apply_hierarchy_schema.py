import os
from sqlalchemy import text
from app.db.session import engine

def apply_schema():
    with engine.connect() as conn:
        print("Adding hierarchy column...")
        conn.execute(text("ALTER TABLE property ADD COLUMN IF NOT EXISTS hierarchy JSONB"))
        conn.commit()
        print("Success.")

if __name__ == "__main__":
    apply_schema()
