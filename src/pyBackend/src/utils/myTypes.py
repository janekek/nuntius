from pydantic import BaseModel
from typing import List, Optional

class EnhancedUser(BaseModel):
    username: str
    password_hash: str
    public_key: str

class Message(BaseModel):
    id: Optional[int] = None
    content: str
    sender_username: str
    timestamp: str

class FullChat(BaseModel):
    chat_id: int
    chat_name: Optional[str] = None
    participants: List[str]
    messages: List[Message]