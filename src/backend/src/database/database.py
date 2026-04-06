from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, func, text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

from sqlalchemy import event 
from sqlalchemy.engine import Engine

Base = declarative_base()

# Verbindung zu SQLite DB
engine = create_engine("sqlite:///database/chat.db", connect_args={"check_same_thread": False})

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class User(Base):
    __tablename__ = "users"
    
    username = Column(String, primary_key=True)
    password_hash = Column(String, nullable=False)
    public_key = Column(String, nullable=False)
    encrypted_private_key = Column(String, nullable=False)
    iv_private_key = Column(String, nullable=False)
    color_id = Column(Integer, default=0, nullable=False)
    send_read_receipts_default = Column(Boolean, default=True, nullable=False)

class Chat(Base):
    __tablename__ = "chats"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    chat_name = Column(String)

class ChatParticipant(Base):
    __tablename__ = "chat_participants"
    
    # Composite Primary Key (wie in deinem SQL)
    chat_id = Column(Integer, ForeignKey("chats.id", ondelete="CASCADE"), primary_key=True)
    username = Column(String, ForeignKey("users.username", ondelete="CASCADE"), primary_key=True)
    
    send_read_receipts = Column(Boolean, default=True)
    last_read_message_id = Column(Integer, default=0)

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    chat_id = Column(Integer, ForeignKey("chats.id", ondelete="CASCADE"))
    sender_username = Column(String, ForeignKey("users.username"))
    encrypted_content = Column(String, nullable=False)
    iv = Column(String, nullable=False)
    timestamp = Column(DateTime, server_default=func.now()) # CURRENT_TIMESTAMP

class MessageKey(Base):
    __tablename__ = "message_keys"
    
    message_id = Column(Integer, ForeignKey("messages.id", ondelete="CASCADE"), primary_key=True)
    username = Column(String, ForeignKey("users.username", ondelete="CASCADE"), primary_key=True)
    encrypted_sym_key = Column(String, nullable=False)

# Erstelle alle Tabellen, falls sie noch nicht existieren
Base.metadata.create_all(bind=engine)

db = SessionLocal()