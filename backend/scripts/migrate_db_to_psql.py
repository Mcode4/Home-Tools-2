from dotenv import load_dotenv
from pathlib import Path
from app.db.db import get_db
from app.utils.postgres_utils import get_pg_db

# env_path = Path(__file__).resolve().parents[2] / ".env"

# load_dotenv(env_path)

# SQLITE_DB = "home_tools.db"
# POSTGRES_URL = os.environ["POSTGRES_URL"]
# SCHEMA = os.environ.get("SCHEMA", "public")

# sqlite3.conn = sqlite3.connect()

def run_migration():
    sql_conn = get_db()
    sql_cursor = sql_conn.cursor()

    pg_conn = get_pg_db()
    pq_cursor = pg_conn.cursor()

    try:
        pq_cursor.execute(
        """
            CREATE TABLE IF NOT EXISTS teams (
                id SERIAL PRIMARY KEY,
                name TEXT,
                rules TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """
        )
        pq_cursor.execute(
        """
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT,
                phone_number INTEGER,
                bio TEXT,
                profile_icon TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """
        )
        pq_cursor.execute(
        """
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                sender_id INTEGER NOT NULL,
                recipient_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                read INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """
        )
        pq_cursor.execute(
        """
            CREATE TABLE IF NOT EXISTS user_teams (
                user_id INTEGER NOT NULL,
                team_id INTEGER NOT NULL,
                roles TEXT NOT NULL,
                PRIMARY KEY (user_id, team_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
            ); 
        """
        )
        pq_cursor.execute(
        """
            CREATE TABLE IF NOT EXISTS home_groups (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                pinned INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """
        )
        pq_cursor.execute(
        """
            CREATE TABLE IF NOT EXISTS property (
                id SERIAL PRIMARY KEY,
                owner_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                address TEXT,
                city TEXT,
                county TEXT,
                state TEXT,
                country TEXT,
                zip INTEGER,
                lat REAL NOT NULL,
                lng REAL NOT NULL,
                group_id INTEGER,
                details jsonb,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (owner_id) REFERENCES users(id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE,
                FOREIGN KEY (group_id) REFERENCES home_groups(id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE
            );
        """
        )
        pq_cursor.execute(
        """
            CREATE TABLE IF NOT EXISTS images (
                id SERIAL PRIMARY KEY,
                owner_id INTEGER NOT NULL,
                property_id INTEGER,
                default_filename TEXT NOT NULL,
                filename TEXT NOT NULL,
                filepath TEXT NOT NULL,
                content_type TEXT,
                size INTEGER,
                type TEXT NOT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (property_id) REFERENCES property(id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE,
                FOREIGN KEY (owner_id) REFERENCES users(id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE
            );
        """
        )
        pq_cursor.execute(
        """
            CREATE TABLE IF NOT EXISTS floors (
                id SERIAL PRIMARY KEY,
                owner_id INTEGER NOT NULL,
                property_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                bedrooms INT,
                bathrooms INT,
                extra_rooms TEXT,
                FOREIGN KEY (property_id) REFERENCES property(id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE,
                FOREIGN KEY (owner_id) REFERENCES users(id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE
            );
        """
        )
        pq_cursor.execute(
        """
            CREATE TABLE IF NOT EXISTS saved_types (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                extra_info jsonb
            );
        """
        )
        pq_cursor.execute(
        """
            CREATE TABLE IF NOT EXISTS points (
                id SERIAL PRIMARY KEY,
                owner_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                name TEXT NOT NULL,
                icon TEXT,
                lng REAL NOT NULL,
                lat REAL NOT NULL,
                endLng REAL,
                endLat REAL,
                radius REAL
            );
        """
        )
        pg_conn.commit()

        # sql_cursor.execute("SELECT * FROM teams")
        # sql_cursor.execute("SELECT * FROM users")
        # sql_cursor.execute("SELECT * FROM notifications")
        # sql_cursor.execute("SELECT * FROM user_teams")
        # sql_cursor.execute("SELECT * FROM home_groups")
        # sql_cursor.execute("SELECT * FROM property")
        # sql_cursor.execute("SELECT * FROM images")
        # sql_cursor.execute("SELECT * FROM floors")
        # sql_cursor.execute("SELECT * FROM saved_types")
        # sql_cursor.execute("SELECT * FROM points")

    except Exception as e:
        pg_conn.rollback()
        print("Migration failed", e)
        raise

    finally:
        sql_conn.close()
        pg_conn.close()