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
        "INSERT INTO users (username, password_hash, public_key, encrypted_private_key, iv_private_key) VALUES (?, ?, ?, ?, ?)",
        (user.username, user.password_hash, user.public_key, user.encrypted_private_key, user.iv_private_key)
    )
    db.commit()
    return Status.OK

# NEU: Funktion, um den verschlüsselten Private Key für den eingeloggten User zu holen
def get_user_encrypted_private_key(username: str) -> dict:
    cursor = db.execute("SELECT encrypted_private_key, iv_private_key FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    if row:
        return {
            "encrypted_private_key": row["encrypted_private_key"], 
            "iv_private_key": row["iv_private_key"]
        }
    return None

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


def get_chat_messages(chat_id: int, current_user: str) -> List[Message]:
    # Wir joinen die messages-Tabelle mit der message_keys-Tabelle, 
    # aber filtern direkt nach dem aktuellen User!
    cursor = db.execute("""
        SELECT m.id, m.sender_username, m.encrypted_content, m.iv, m.timestamp, mk.encrypted_sym_key
        FROM messages m
        JOIN message_keys mk ON m.id = mk.message_id
        WHERE m.chat_id = ? AND mk.username = ?
        ORDER BY m.timestamp ASC
    """, (chat_id, current_user))
    
    # Wir formatieren das Ergebnis so, dass das Frontend exakt dieselbe 
    # Struktur bekommt wie beim WebSocket-Event!
    return [
        Message(
            id=row["id"], 
            sender_username=row["sender_username"], 
            content=row["encrypted_content"], # Verschlüsselter Text
            iv=row["iv"],
            keys=[{"username": current_user, "encryptedKey": row["encrypted_sym_key"]}],
            timestamp=row["timestamp"]
        ) for row in cursor.fetchall()
    ]


# WICHTIG: get_full_chat muss jetzt den Usernamen als Parameter annehmen
def get_full_chat(chat_id: int, current_user: str) -> Optional[FullChat]:
    cursor = db.execute("SELECT chat_name FROM chats WHERE id = ?", (chat_id,))
    chat_base = cursor.fetchone()
    
    if not chat_base:
        return None

    participants = get_chat_participants(chat_id)
    # Usernamen an get_chat_messages weitergeben!
    messages = get_chat_messages(chat_id, current_user)

    # unread messages zählen
    last_read_message_id = get_user_last_read_message(username=current_user, chat_id=chat_id)
    unread_count = 0

    for message in messages:
        if message.id > last_read_message_id:
            unread_count += 1

    return FullChat(
        chat_id=chat_id,
        chat_name=chat_base["chat_name"],
        participants=participants,
        messages=messages,
        last_read_message_id=last_read_message_id,
        unread_count = unread_count
    )

def get_all_full_chats_of_user(username: str) -> List[FullChat]:
    chat_base_info = get_user_chats(username)
    return [get_full_chat(chat["id"], username) for chat in chat_base_info if get_full_chat(chat["id"], username) is not None]

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

# neu chat model end2end    
def get_chat_public_keys(chat_id: int) -> list[dict]:
    cursor = db.execute("""
        SELECT u.username, u.public_key 
        FROM chat_participants cp
        JOIN users u ON cp.username = u.username
        WHERE cp.chat_id = ?
    """, (chat_id,))
    
    return [{"username": row["username"], "public_key": row["public_key"]} for row in cursor.fetchall()]

def add_encrypted_message(chat_id: int, sender_username: str, encrypted_content: str, iv: str, keys: list) -> dict:
    cursor = db.execute(
        "INSERT INTO messages (chat_id, sender_username, encrypted_content, iv) VALUES (?, ?, ?, ?)",
        (chat_id, sender_username, encrypted_content, iv)
    )
    message_id = cursor.lastrowid
    
    for key_data in keys:
        db.execute(
            "INSERT INTO message_keys (message_id, username, encrypted_sym_key) VALUES (?, ?, ?)",
            (message_id, key_data["username"], key_data["encryptedKey"])
        )
    db.commit()
    return {"code": Status.OK.code, "msg": Status.OK.msg, "message_id": message_id}

def set_user_last_read_message(username: str, chat_id: int, last_message_id: int) -> None:
    db.execute("""
        UPDATE chat_participants 
        SET last_read_message_id = ? 
        WHERE username = ? AND chat_id = ?
    """, (last_message_id, username, chat_id))
    db.commit()

def get_user_last_read_message(username: str, chat_id: int) -> Optional[int]:
    cursor = db.execute("""
        SELECT last_read_message_id 
        FROM chat_participants 
        WHERE username = ? AND chat_id = ?
    """, (username, chat_id))
    
    row = cursor.fetchone()
    if row:
        return row["last_read_message_id"]
    return None

def set_user_send_read_receipts(username: str, chat_id: int, send_receipts: bool) -> None:
    db.execute("""
        UPDATE chat_participants 
        SET send_read_receipts = ? 
        WHERE username = ? AND chat_id = ?
    """, (send_receipts, username, chat_id))
    db.commit()

def get_user_send_read_receipts(username: str, chat_id: int) -> Optional[bool]:
    cursor = db.execute("""
        SELECT send_read_receipts 
        FROM chat_participants 
        WHERE username = ? AND chat_id = ?
    """, (username, chat_id))
    
    row = cursor.fetchone()
    if row:
        return bool(row["send_read_receipts"])
    return None