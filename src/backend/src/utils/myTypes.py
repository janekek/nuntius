from __future__ import annotations

from pydantic import BaseModel
from typing import List, Optional, Dict

class EnhancedUser(BaseModel):
    username: str
    password_hash: str
    public_key: str
    encrypted_private_key: str # NEU
    iv_private_key: str
    color_id: int

class Message(BaseModel):
    id: Optional[int] = None
    content: str
    sender_username: str
    timestamp: str

class Message(BaseModel):
    id: int
    sender_username: str
    content: str  # (encrypted_content)
    iv: str       # Initialization Vector für AES
    keys: List[Dict[str, str]] # Liste mit Schlüsseln
    timestamp: str

class FullChat(BaseModel):
    chat_id: int
    chat_name: Optional[str] = None
    participants: List[ChatParticipant]
    messages: List[Message]
    last_read_message_id: int
    unread_count: int

class ChatParticipant (BaseModel):
    username: str
    last_read_message_id: int
    color_id: int

class SearchMatch (BaseModel):
    username: str
    color_id: int