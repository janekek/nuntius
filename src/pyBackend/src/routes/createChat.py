from fastapi import APIRouter, Request
import hashlib
from src.utils.status import Status
from src.utils.server_response import generate_response
from src.database.databaseOperations import check_credentials
from pydantic import BaseModel

from src.database.databaseOperations import create_chat_with_users

router = APIRouter()

class CreateChatRequest(BaseModel):
    chat_name: str
    participants: list[str]

def check_login_data(username: str, password: str) -> bool:
    hashed_password = hashlib.sha256(password.encode()).hexdigest()
    return check_credentials(username, hashed_password)

@router.post("/api/createChat")
async def handle_login(request: Request, data: CreateChatRequest):
    chat_id = create_chat_with_users(chat_name=data.chat_name, users=data.participants)
    return generate_response(Status.OK, {"chat_id": chat_id})