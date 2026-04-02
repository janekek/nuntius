import sqlite3
import os

os.makedirs("database", exist_ok=True)

# check_same_thread=False erlaubt FastAPI (welches Threadpools nutzt), die gleiche DB-Verbindung zu verwenden (analog zu better-sqlite3)
db = sqlite3.connect("database/chat.db", check_same_thread=False)
db.row_factory = sqlite3.Row # Damit Ergebnisse wie Dictionaries ansprechbar sind

cursor = db.cursor()
cursor.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL,
        public_key TEXT NOT NULL,
        encrypted_private_key TEXT NOT NULL, -- NEU
        iv_private_key TEXT NOT NULL         -- NEU
    );

    CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_name TEXT
    );

    CREATE TABLE IF NOT EXISTS chat_participants (
        chat_id INTEGER,
        username TEXT,
        send_read_receipts BOOLEAN DEFAULT 1,
        last_read_message_id INTEGER DEFAULT 0,
        PRIMARY KEY (chat_id, username),
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id INTEGER,
        sender_username TEXT,
        encrypted_content TEXT NOT NULL,
        iv TEXT NOT NULL,        
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_username) REFERENCES users(username)
    );
                     
    CREATE TABLE IF NOT EXISTS message_keys (
        message_id INTEGER,
        username TEXT,
        encrypted_sym_key TEXT NOT NULL, -- Der AES-Key, verschlüsselt mit dem Public Key des jeweiligen Users
        PRIMARY KEY (message_id, username),
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
    );
""")
db.commit()