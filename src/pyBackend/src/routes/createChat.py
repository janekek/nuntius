from fastapi import APIRouter, Request
from src.utils.status import Status
from src.utils.server_response import generate_response
from pydantic import BaseModel

from src.database.databaseOperations import create_chat_with_users, exists_chat_with_users

router = APIRouter()

class CreateChatRequest(BaseModel):
    chat_name: str
    participants: list[str]

@router.post("/api/createChat")
async def handle_login(request: Request, data: CreateChatRequest):
    if not request.session or not request.session.get("loggedIn"):
        return generate_response(Status.USER_NOT_LOGGED_IN, "")
    sender_username = request.session.get("username")
    participants =data.participants

    if exists_chat_with_users(participants):
        return generate_response(Status.CHAT_ALREADY_EXISTS, "")
        
    chat_id = create_chat_with_users(chat_name=data.chat_name, users=data.participants)
    return generate_response(Status.OK, {"chat_id": chat_id})