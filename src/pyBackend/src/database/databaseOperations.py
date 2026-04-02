from sqlalchemy import text
# Nimm an, dass 'db' jetzt deine SQLAlchemy Session ist
from src.database.database import db 
from src.utils.status import Status
from src.utils.myTypes import EnhancedUser, FullChat, Message, ChatParticipant
from typing import List, Optional

# Hier musst du deine SQLAlchemy-Models importieren (Pfade ggf. anpassen)
from src.database.database import User, Chat, ChatParticipant as ChatParticipantModel, Message as MessageModel, MessageKey

# --- login-functions ---
def check_credentials(username: str, password_hash: str) -> bool:
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return False
    return user.password_hash == password_hash

# --- signup-functions ---
def is_username_taken(username: str) -> bool:
    # Selektiert nur den Usernamen (performanter als das ganze Objekt)
    user = db.query(User.username).filter(User.username == username).first()
    return user is not None

def create_user(user: EnhancedUser) -> Status:
    new_user = User(
        username=user.username,
        password_hash=user.password_hash,
        public_key=user.public_key,
        encrypted_private_key=user.encrypted_private_key,
        iv_private_key=user.iv_private_key
    )
    db.add(new_user)
    db.commit()
    return Status.OK

def get_user_encrypted_private_key(username: str) -> Optional[dict]:
    user = db.query(User).filter(User.username == username).first()
    if user:
        return {
            "encrypted_private_key": user.encrypted_private_key, 
            "iv_private_key": user.iv_private_key
        }
    return None

# --- chat-functions ---
def create_chat_without_users(chat_name: str) -> int:
    new_chat = Chat(chat_name=chat_name)
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat) # Lädt die generierte ID aus der Datenbank in das Objekt
    return new_chat.id

def create_chat_with_users(chat_name: str, users: List[str]) -> int:
    new_chat_id = create_chat_without_users(chat_name)
    for user in users:
        add_user_to_chat(new_chat_id, user)
    return new_chat_id

def add_user_to_chat(chat_id: int, user: str) -> None:
    participant = ChatParticipantModel(chat_id=chat_id, username=user)
    db.add(participant)
    db.commit()

def add_message_to_chat(chat_id: int, sender_username: str, content: str) -> None:
    # Hinweis: In deinem ursprünglichen Code fehlte hier "iv", 
    # obwohl es in deinem Schema auf NOT NULL gesetzt war. 
    # Falls das so gewollt war, übergeben wir für "iv" einen leeren String.
    new_msg = MessageModel(
        chat_id=chat_id, 
        sender_username=sender_username, 
        encrypted_content=content,
        iv="" 
    )
    db.add(new_msg)
    db.commit()

def search_users_by_prefix(prefix: str) -> List[str]:
    users = db.query(User).filter(User.username.like(f"{prefix}%")).all()
    return [u.username for u in users]

def get_user_chats(username: str) -> List[dict]:
    # Join zwischen Chat und ChatParticipant
    chats = db.query(Chat).join(
        ChatParticipantModel, Chat.id == ChatParticipantModel.chat_id
    ).filter(
        ChatParticipantModel.username == username
    ).all()
    
    return [{"id": c.id, "chat_name": c.chat_name} for c in chats]

def get_chat_participants(chat_id: int) -> List[ChatParticipant]:
    db_participants = db.query(ChatParticipantModel).filter(
        ChatParticipantModel.chat_id == chat_id
    ).all()
    
    participants_data = []
    for p in db_participants:
        last_read = p.last_read_message_id
        if not p.send_read_receipts:
            last_read = 0

        chat_participant = ChatParticipant(
            username=p.username,
            last_read_message_id=last_read
        )
        participants_data.append(chat_participant)
    
    print(participants_data)
    return participants_data

def get_chat_messages(chat_id: int, current_user: str) -> List[Message]:
    # Wir fragen beide Models ab und joinen sie
    results = db.query(MessageModel, MessageKey).join(
        MessageKey, MessageModel.id == MessageKey.message_id
    ).filter(
        MessageModel.chat_id == chat_id,
        MessageKey.username == current_user
    ).order_by(
        MessageModel.timestamp.asc()
    ).all()
    
    # results ist eine Liste aus Tuples: (MessageModel, MessageKey)
    return [
        Message(
            id=msg.id, 
            sender_username=msg.sender_username, 
            content=msg.encrypted_content, 
            iv=msg.iv,
            keys=[{"username": current_user, "encryptedKey": key.encrypted_sym_key}],
            # Convert datetime to string. Handle potential None values just in case.
            timestamp=msg.timestamp.isoformat() if msg.timestamp else "" 
        ) for msg, key in results
    ]

def get_full_chat(chat_id: int, current_user: str) -> Optional[FullChat]:
    chat_base = db.query(Chat).filter(Chat.id == chat_id).first()
    
    if not chat_base:
        return None

    participants = get_chat_participants(chat_id)
    messages = get_chat_messages(chat_id, current_user)

    last_read_message_id = get_user_last_read_message(username=current_user, chat_id=chat_id)
    # Fallback auf 0 einbauen, falls None zurückkommt, um TypeError im Loop zu verhindern
    if last_read_message_id is None:
        last_read_message_id = 0

    unread_count = 0
    for message in messages:
        if message.id > last_read_message_id:
            unread_count += 1

    return FullChat(
        chat_id=chat_id,
        chat_name=chat_base.chat_name,
        participants=participants,
        messages=messages,
        last_read_message_id=last_read_message_id,
        unread_count=unread_count
    )

def get_all_full_chats_of_user(username: str) -> List[FullChat]:
    chat_base_info = get_user_chats(username)
    return [get_full_chat(chat["id"], username) for chat in chat_base_info if get_full_chat(chat["id"], username) is not None]

def run_sql_code(code: str) -> List[dict]:
    # SQLAlchemy benötigt "text()" für rohes SQL
    try:
        result = db.execute(text(code))
        db.commit()
        # Mappings gibt uns ein dictionary-ähnliches Format zurück
        if result.returns_rows:
            return [dict(row) for row in result.mappings().all()]
        return []
    except Exception:
        db.rollback() # Bei Fehlern lieber einen Rollback machen!
        return []

# --- neu chat model end2end ---
def get_chat_public_keys(chat_id: int) -> list[dict]:
    results = db.query(User.username, User.public_key).join(
        ChatParticipantModel, User.username == ChatParticipantModel.username
    ).filter(
        ChatParticipantModel.chat_id == chat_id
    ).all()
    
    return [{"username": r.username, "public_key": r.public_key} for r in results]

def add_encrypted_message(chat_id: int, sender_username: str, encrypted_content: str, iv: str, keys: list) -> dict:
    new_msg = MessageModel(
        chat_id=chat_id,
        sender_username=sender_username,
        encrypted_content=encrypted_content,
        iv=iv
    )
    db.add(new_msg)
    db.flush() # .flush() schreibt in die DB und gibt uns new_msg.id, ohne den Prozess schon zu committen
    
    for key_data in keys:
        new_key = MessageKey(
            message_id=new_msg.id,
            username=key_data["username"],
            encrypted_sym_key=key_data["encryptedKey"]
        )
        db.add(new_key)
        
    db.commit()
    return {"code": Status.OK.code, "msg": Status.OK.msg, "message_id": new_msg.id}

def set_user_last_read_message(username: str, chat_id: int, last_message_id: int) -> None:
    participant = db.query(ChatParticipantModel).filter_by(username=username, chat_id=chat_id).first()
    if participant:
        participant.last_read_message_id = last_message_id
        db.commit()

def get_user_last_read_message(username: str, chat_id: int) -> Optional[int]:
    participant = db.query(ChatParticipantModel).filter_by(username=username, chat_id=chat_id).first()
    return participant.last_read_message_id if participant else None

def set_user_send_read_receipts(username: str, chat_id: int, send_receipts: bool) -> None:
    participant = db.query(ChatParticipantModel).filter_by(username=username, chat_id=chat_id).first()
    if participant:
        participant.send_read_receipts = send_receipts
        db.commit()

def get_user_send_read_receipts(username: str, chat_id: int) -> Optional[bool]:
    participant = db.query(ChatParticipantModel).filter_by(username=username, chat_id=chat_id).first()
    return participant.send_read_receipts if participant else None