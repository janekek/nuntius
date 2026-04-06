from fastapi import APIRouter, Request
from src.utils.status import Status
from src.utils.server_response import generate_response
from pydantic import BaseModel

from src.database.databaseOperations import get_user_last_read_message

router = APIRouter()

class GetLastReadMessageIDRequest(BaseModel):
    username: str
    chat_id: str

@router.post("/api/getLastReadMessageID")
async def handle_login(request: Request, data: GetLastReadMessageIDRequest):
    if not request.session or not request.session.get("loggedIn"):
        return generate_response(Status.USER_NOT_LOGGED_IN, "")
    
    username = data.username
    chat_id = data.chat_id
    last_read_message_id = get_user_last_read_message(username = username, chat_id=chat_id)

    return generate_response(Status.OK, {last_read_message_id})