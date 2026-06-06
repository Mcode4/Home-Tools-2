"""
Database migration script for schema changes.
Apply with: python backend/scripts/migrate_schema.py
"""

import os
import sys
import secrets
import string

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

POSTGRES_URL = os.environ.get("POSTGRES_URL")
if not POSTGRES_URL:
    raise RuntimeError("POSTGRES_URL not set")

engine = create_engine(POSTGRES_URL)

def generate_username():
    chars = string.ascii_letters + string.digits
    existing = set()
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT username FROM users WHERE username IS NOT NULL"))
            existing = {row[0] for row in result}
    except:
        pass

    def _gen():
        return "user_" + "".join(secrets.choice(chars) for _ in range(8))

    username = _gen()
    while username in existing:
        username = _gen()
    return username

migrations = [
    # 1. Property - drop details
    "ALTER TABLE property DROP COLUMN IF EXISTS details",

    # 2. Image - drop size
    "ALTER TABLE images DROP COLUMN IF EXISTS size",

    # 3. Point - rename columns, add unit_id
    "ALTER TABLE points RENAME COLUMN endlng TO end_lng",
    "ALTER TABLE points RENAME COLUMN endlat TO end_lat",
    "ALTER TABLE points ADD COLUMN IF NOT EXISTS unit_id INTEGER REFERENCES property(id) ON DELETE SET NULL",
    "ALTER TABLE points DROP COLUMN IF EXISTS parent_id",

    # 4. Notification - add FK constraints
    "ALTER TABLE notifications ADD CONSTRAINT fk_notifications_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE",
    "ALTER TABLE notifications ADD CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE",

    # 5. Floor - add new columns
    "ALTER TABLE floors ADD COLUMN IF NOT EXISTS bedroom_count INTEGER DEFAULT 0",
    "ALTER TABLE floors ADD COLUMN IF NOT EXISTS bathroom_count INTEGER DEFAULT 0",
    "ALTER TABLE floors ADD COLUMN IF NOT EXISTS length FLOAT",
    "ALTER TABLE floors ADD COLUMN IF NOT EXISTS width FLOAT",
    "ALTER TABLE floors ADD COLUMN IF NOT EXISTS height FLOAT",
    "ALTER TABLE floors ADD COLUMN IF NOT EXISTS position JSON",
    # Migrate old data to new columns
    "UPDATE floors SET bedroom_count = COALESCE(bedrooms, 0) WHERE bedrooms IS NOT NULL",
    "UPDATE floors SET bathroom_count = COALESCE(bathrooms, 0) WHERE bathrooms IS NOT NULL",
    # Drop old columns
    "ALTER TABLE floors DROP COLUMN IF EXISTS bedrooms",
    "ALTER TABLE floors DROP COLUMN IF EXISTS bathrooms",
    "ALTER TABLE floors DROP COLUMN IF EXISTS extra_rooms",

    # 6. User - add new columns
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR UNIQUE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT DEFAULT 'New'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT DEFAULT 'User'",
    "ALTER TABLE users ALTER COLUMN phone_number TYPE VARCHAR USING phone_number::varchar",

    # 7. Rooms - create table
    """
    CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        floor_id INTEGER NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        length FLOAT,
        width FLOAT,
        height FLOAT,
        position JSON
    )
    """,
]

def run():
    print("Running schema migrations...")
    with engine.begin() as conn:
        for i, sql in enumerate(migrations, 1):
            sql_stripped = sql.strip()
            if not sql_stripped:
                continue
            try:
                conn.execute(text(sql_stripped))
                print(f"  ✓ [{i}/{len(migrations)}] {sql_stripped[:60]}...")
            except OperationalError as e:
                if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                    print(f"  ~ [{i}/{len(migrations)}] Skipped (already applied)")
                else:
                    print(f"  ✗ [{i}/{len(migrations)}] Failed: {e}")
                    raise

    # Generate usernames for existing users without one
    with engine.begin() as conn:
        result = conn.execute(text("SELECT id FROM users WHERE username IS NULL"))
        for row in result:
            username = generate_username()
            conn.execute(
                text("UPDATE users SET username = :username WHERE id = :uid"),
                {"username": username, "uid": row[0]}
            )
            print(f"  → Generated username '{username}' for user id {row[0]}")

    print("\nMigration complete!")

if __name__ == "__main__":
    run()
