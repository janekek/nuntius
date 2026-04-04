from sqlalchemy import text, func
from src.database.database import db 
from src.utils.status import Status
from src.utils.myTypes import EnhancedUser, FullChat, Message, ChatParticipant, SearchMatch
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
        iv_private_key=user.iv_private_key,
        color_id=user.color_id
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
    new_chat_id = create_chat_without_users(chat_name)
    
    unique_users = set(users) 
    
    for user in unique_users:
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

def search_users_by_prefix(prefix: str) -> List[SearchMatch]:
    users = db.query(User).filter(User.username.like(f"{prefix}%")).all()
    return [
        SearchMatch(username=u.username, color_id = u.color_id)
        for u in users
    ]

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
        color_id =get_user_color(p.username)
        chat_participant = ChatParticipant(
            username=p.username,
            last_read_message_id=last_read,
            color_id=color_id or 0
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
            # [there was an error] Convert datetime to string. Handle potential None values just in case.
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

def get_user_public_key(username: str):
    user = db.query(User).filter(User.username == username).first()
    if user:
        return user.public_key
    return None

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

def get_user_send_read_receipt_default(username: str):
    """
    Gibt den Standardwert für Lesebestätigungen zurück.
    Gibt True zurück, falls der User nicht gefunden wird (als sicherer Default).
    """
    user = db.query(User).filter(User.username == username).first()
    if user:
        return user.send_read_receipts_default
    return True

def set_user_send_read_receipt_default(username: str, enabled: bool):
    """
    Aktualisiert die globale Einstellung für Lesebestätigungen eines Nutzers.
    """
    user = db.query(User).filter(User.username == username).first()
    if user:
        try:
            user.send_read_receipts_default = enabled
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            print(f"Fehler beim Aktualisieren der Lesebestätigung: {e}")
            return False
    return False

def exists_chat_with_users(users: List[str]) -> bool:
    if not users:
        return False
    
    # 1. Ziel-Menge als Set definieren (für einfachen "genau gleich"-Vergleich)
    target_users = set(users)
    first_user = users[0]
    
    # 2. Kandidaten finden: Hole alle chat_ids, in denen zumindest der erste User ist.
    # Das reduziert die Datenbankabfrage enorm, da wir nicht alle Chats durchsuchen müssen.
    candidate_chats = db.query(ChatParticipantModel.chat_id).filter(
        ChatParticipantModel.username == first_user
    ).all()
    
    candidate_chat_ids = [chat.chat_id for chat in candidate_chats]
    
    if not candidate_chat_ids:
        return False # Der User ist in gar keinem Chat -> also gibt es auch keinen solchen Chat

    # 3. Überprüfe die Kandidaten-Chats auf exakte Übereinstimmung
    for chat_id in candidate_chat_ids:
        # Hole alle Usernamen für diesen spezifischen Chat
        participants = db.query(ChatParticipantModel.username).filter(
            ChatParticipantModel.chat_id == chat_id
        ).all()
        
        # Erstelle ein Set aus den gefundenen Usernamen
        current_chat_users = set(p.username for p in participants)
        
        # Wenn die Sets exakt übereinstimmen (nicht mehr, nicht weniger), haben wir den Chat gefunden!
        if current_chat_users == target_users:
            return True
            
    return False

def get_user_color(username: str):
    user = db.query(User).filter(User.username == username).first()
    if user:
        return user.color_id
    return None

def set_user_color(username: str, color_id: int):
    user = db.query(User).filter(User.username == username).first()
    if user:
        try:
            user.color_id = color_id
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            print(f"Fehler beim Speichern: {e}")
            return False
    return False


def _ensure_system_user_exists():
    """Hilfsfunktion: Prüft, ob '[TheAnonymous]' existiert und legt ihn an, falls nicht."""
    sys_user = db.query(User).filter(User.username == "[TheAnonymous]").first()
    if not sys_user:
        sys_user = User(
            username="[TheAnonymous]",
            password_hash="system",
            public_key="system",
            encrypted_private_key="system",
            iv_private_key="system",
            color_id=0,
            send_read_receipts_default=False
        )
        db.add(sys_user)
        db.flush() # flush() schreibt es in die DB, ohne die Transaktion schon zu committen

def leave_chat(username: str, chat_id: int):
    try:
        # 1. System-User sicherstellen
        _ensure_system_user_exists()

        # 2. Eigentum der Nachrichten DIESES Chats auf den System-User übertragen
        db.query(MessageModel).filter(
            MessageModel.chat_id == chat_id,
            MessageModel.sender_username == username
        ).update({"sender_username": "[TheAnonymous]"}, synchronize_session=False)

        # 3. User aus dem Chat entfernen
        db.query(ChatParticipantModel).filter(
            ChatParticipantModel.chat_id == chat_id,
            ChatParticipantModel.username == username
        ).delete(synchronize_session=False)

        # 4. Die verschlüsselten Message-Keys dieses Users für diesen Chat löschen.
        # SQLAlchemy Subquery: Finde alle message_ids dieses Chats
        subq = db.query(MessageModel.id).filter(MessageModel.chat_id == chat_id).subquery()
        db.query(MessageKey).filter(
            MessageKey.username == username,
            MessageKey.message_id.in_(subq)
        ).delete(synchronize_session=False)

        # 5. Prüfen, ob der Chat jetzt komplett leer ist
        participant_count = db.query(func.count(ChatParticipantModel.chat_id)).filter(
            ChatParticipantModel.chat_id == chat_id
        ).scalar()

        if participant_count == 0:
            # Wenn leer, Chat löschen (ondelete="CASCADE" => löscht auch automatisch alle verbliebenen Messages dieses Chats)
            db.query(Chat).filter(Chat.id == chat_id).delete(synchronize_session=False)

        db.commit()
    except Exception as e:
        db.rollback()
        print("Fehler beim Verlassen des Chats:", e)
        raise e

def delete_user_account(username: str):
    try:
        # 1. System-User sicherstellen
        _ensure_system_user_exists()

        # 2. Eigentum ALLER Nachrichten dieses Users serverweit übertragen
        db.query(MessageModel).filter(
            MessageModel.sender_username == username
        ).update({"sender_username": "[TheAnonymous]"}, synchronize_session=False)

        # 3. User löschen (löscht dank CASCADE auch alle ChatParticipant und MessageKey Einträge!)
        db.query(User).filter(User.username == username).delete(synchronize_session=False)

        # 4. Aufräumen: Geister-Chats löschen (Chats ohne Teilnehmer)
        # SQLAlchemy Subquery: Alle Chat-IDs, die noch Teilnehmer haben
        active_chat_ids_subq = db.query(ChatParticipantModel.chat_id).subquery()
        
        # Lösche alle Chats, deren ID NICHT in der Subquery ist
        db.query(Chat).filter(
            Chat.id.not_in(active_chat_ids_subq)
        ).delete(synchronize_session=False)

        db.commit()
    except Exception as e:
        db.rollback()
        print("Fehler beim Löschen des Accounts:", e)
        raise e