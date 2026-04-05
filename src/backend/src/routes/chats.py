from fastapi import APIRouter, Request
from src.utils.status import Status
from src.utils.server_response import generate_response
from src.database.databaseOperations import get_all_full_chats_of_user

router = APIRouter()

@router.get("/chats")
async def handle_chats(request: Request):
    if not request.session.get("loggedIn"):
        return generate_response(Status.USER_NOT_LOGGED_IN, "")
    
    current_user = request.session.get("username")
    user_chats = get_all_full_chats_of_user(current_user)
    
    chats_data = [chat.model_dump() for chat in user_chats]

    return generate_response(Status.OK, {
        "username": current_user,
        "chats": chats_data
    })