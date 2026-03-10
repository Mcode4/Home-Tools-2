import sqlite3

DB_NAME = "home_tools.db"

def get_db():
    conn = sqlite3.connect(DB_NAME, check_same_thread=True)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript("""       
        CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            rules TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
                         
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT,
            phone_number INTEGER,
            bio TEXT,
            profile_icon TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
                         
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            recipient_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            pinned INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
                         
        CREATE TABLE IF NOT EXISTS property (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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
            details TEXT,
            pinned INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES users(id)
                ON DELETE CASCADE
                ON UPDATE CASCADE,
            FOREIGN KEY (group_id) REFERENCES home_groups(id)
                ON DELETE CASCADE
                ON UPDATE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id INTEGER INTEGER NOT NULL,
            property_id INTEGER,
            default_filename TEXT NOT NULL,
            filename TEXT NOT NULL,
            filepath TEXT NOT NULL,
            content_type TEXT,
            size INTEGER,
            type TEXT NOT NULL,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (property_id) REFERENCES property(id)
                ON DELETE CASCADE
                ON UPDATE CASCADE,
            FOREIGN KEY (owner_id) REFERENCES users(id)
                ON DELETE CASCADE
                ON UPDATE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS floors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            extra_info TEXT
        );

        CREATE TABLE IF NOT EXISTS points (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            name TEXT NOT NULL,
            icon TEXT,
            lng REAL NOT NULL,
            lat REAL NOT NULL,
            endLng REAL,
            endLat REAL,
            radius REAL
        )
    """)

    conn.commit()
    conn.close()