import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

def get_db():
    url = os.environ.get("POSTGRES_URL")
    if not url:
        raise RuntimeError("POSTGRES_URL not set")
    
    conn = psycopg2.connect(
        url,
        cursor_factory=RealDictCursor
    )
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""       
        CREATE TABLE IF NOT EXISTS teams (
            id SERIAL PRIMARY KEY,
            name TEXT,
            rules TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
                         
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT,
            phone_number BIGINT,
            bio TEXT,
            profile_icon TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
                         
        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            sender_id INTEGER NOT NULL,
            recipient_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            read INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS user_teams (
            user_id INTEGER NOT NULL,
            team_id INTEGER NOT NULL,
            roles TEXT NOT NULL,
            PRIMARY KEY (user_id, team_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
        );     
                             
        CREATE TABLE IF NOT EXISTS home_groups (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            pinned INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
                         
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
        
        CREATE TABLE IF NOT EXISTS saved_types (
            id SERIAL PRIMARY KEY,
            owner_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            extra_info jsonb,
            FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
        );

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
            radius REAL,
            parent_id INTEGER,
            extra_info jsonb
        );

        CREATE TABLE IF NOT EXISTS settings (
            user_id INTEGER PRIMARY KEY,
            theme TEXT DEFAULT 'dark',
            map_layer TEXT DEFAULT 'osm-layer',
            icon_size INTEGER DEFAULT 24,
            text_size INTEGER DEFAULT 12,
            text_color TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- Migration: Ensure property table has type, icon, and zip is TEXT
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='property' AND column_name='type') THEN
                ALTER TABLE property ADD COLUMN type TEXT DEFAULT 'home';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='property' AND column_name='icon') THEN
                ALTER TABLE property ADD COLUMN icon TEXT;
            END IF;
            IF (SELECT data_type FROM information_schema.columns WHERE table_name='property' AND column_name='zip') = 'integer' THEN
                ALTER TABLE property ALTER COLUMN zip TYPE TEXT USING zip::text;
            END IF;
        END $$;
    """)

    conn.commit()
    conn.close()