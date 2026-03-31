from src.database.database import db
from src.utils.status import Status
from src.utils.myTypes import EnhancedUser, FullChat, Message
from typing import List, Optional

# login-functions
def check_credentials(username: str, password_hash: str) -> bool:
    cursor = db.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    if not user:
        return False
    return user["password_hash"] == password_hash

# signup-functions
def is_username_taken(username: str) -> bool:
    cursor = db.execute("SELECT 1 FROM users WHERE username = ?", (username,))
    return bool(cursor.fetchone())

def create_user(user: EnhancedUser) -> Status:
    db.execute(
        "INSERT INTO users (username, password_hash, public_key) VALUES (?, ?, ?)",
        (user.username, user.password_hash, user.public_key)
    )
    db.commit()
    return Status.OK

# chat-functions
def create_chat_without_users(chat_name: str) -> int:
    cursor = db.execute("INSERT INTO chats DEFAULT VALUES")
    db.commit()
    return cursor.lastrowid

def create_chat_with_users(chat_name: str, users: List[str]) -> int:
    new_chat_id = create_chat_without_users(chat_name)
    for user in users:
        add_user_to_chat(new_chat_id, user)
    return new_chat_id

def add_user_to_chat(chat_id: int, user: str) -> None:
    db.execute(
        "INSERT INTO chat_participants (chat_id, username) VALUES (?, ?)",
        (chat_id, user)
    )
    db.commit()

def add_message_to_chat(chat_id: int, sender_username: str, content: str) -> None:
    db.execute(
        "INSERT INTO messages (chat_id, sender_username, content) VALUES (?, ?, ?)",
        (chat_id, sender_username, content)
    )
    db.commit()

def search_users_by_prefix(prefix: str) -> List[str]:
    cursor = db.execute("SELECT username FROM users WHERE username LIKE ?", (prefix + "%",))
    return [row["username"] for row in cursor.fetchall()]

def get_user_chats(username: str) -> List[dict]:
    cursor = db.execute("""
        SELECT c.id, c.chat_name 
        FROM chats c
        JOIN chat_participants cp ON c.id = cp.chat_id
        WHERE cp.username = ?
    """, (username,))
    return [{"id": row["id"], "chat_name": row["chat_name"]} for row in cursor.fetchall()]

def get_chat_participants(chat_id: int) -> List[str]:
    cursor = db.execute("SELECT username FROM chat_participants WHERE chat_id = ?", (chat_id,))
    return [row["username"] for row in cursor.fetchall()]

def get_chat_messages(chat_id: int) -> List[Message]:
    cursor = db.execute("""
        SELECT id, sender_username, content, timestamp 
        FROM messages 
        WHERE chat_id = ? 
        ORDER BY timestamp ASC
    """, (chat_id,))
    return [
        Message(
            id=row["id"], 
            sender_username=row["sender_username"], 
            content=row["content"], 
            timestamp=row["timestamp"]
        ) for row in cursor.fetchall()
    ]

def get_full_chat(chat_id: int) -> Optional[FullChat]:
    cursor = db.execute("SELECT chat_name FROM chats WHERE id = ?", (chat_id,))
    chat_base = cursor.fetchone()
    
    if not chat_base:
        return None

    participants = get_chat_participants(chat_id)
    messages = get_chat_messages(chat_id)

    return FullChat(
        chat_id=chat_id,
        chat_name=chat_base["chat_name"],
        participants=participants,
        messages=messages
    )

def get_all_full_chats_of_user(username: str) -> List[FullChat]:
    chat_base_info = get_user_chats(username)
    return [get_full_chat(chat["id"]) for chat in chat_base_info if get_full_chat(chat["id"]) is not None]

# inject from outside
def run_sql_code(code: str) -> List[dict]:
    cursor = db.execute(code)
    try:
        results = cursor.fetchall()
        db.commit()
        return [dict(row) for row in results]
    except Exception:
        db.commit()
        return []