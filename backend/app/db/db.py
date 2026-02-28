import sqlite3

DB_NAME = "home-tools"

def get_db():
    conn = sqlite3.connect(DB_NAME, check_same_thread=True)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript("""
        # --USERS TABLE--------------------------------------
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT,
            phone_number INTEGER
        );
                    
        # --PROPERTY TABLE-----------------------------------
        CREATE TABLE IF NOT EXISTS property (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            address TEXT NOT NULL,
            city TEXT NOT NULL,
            state TEXT NOT NULL,
            country TEXT NOT NULL,
            zip INTEGER NOT NULL,
            owner_id INTEGER NOT NULL,
            details TEXT,
            pinned INTEGER DEFAULT 0,
            FOREIGN KEY (owner_id) REFERENCES users(id)
                ON DELETE CASCADE
                ON UPDATE CASCADE
        );
        
        # --IMAGES TABLE-------------------------------------
        CREATE TABLE IF NOT EXISTS images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id INTEGER,
            property_id INTEGER,
            default_filename TEXT NOT NULL,
            filename TEXT NOT NULL,
            filepath TEXT NOT NULL,
            content_type TEXT,
            size INTEGER,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (property_id) REFERENCES property(id)
                ON DELETE CASCADE
                ON UPDATE CASCADE,
            FOREIGN KEY (owner_id) REFERENCES users(id)
                ON DELETE CASCADE
                ON UPDATE CASCADE
        );
        
        # --FLOORS TABLE--------------------------------------
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

        # --SAVED TYPES--------------------------------------           
        CREATE TABLE IF NOT EXISTS saved_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL;
            type TEXT NOT NULL;
            extra_info TEXT
        );
    """)

    conn.commit()
    conn.close()