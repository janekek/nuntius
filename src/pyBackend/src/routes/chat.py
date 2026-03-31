from fastapi import APIRouter, Request, Path
from src.utils.status import Status
from src.utils.server_response import generate_response
from src.database.databaseOperations import get_full_chat

router = APIRouter()

@router.get("/api/chat/{chat_id}")
async def handle_single_chat(request: Request, chat_id: str = Path(...)):
    if not request.session.get("loggedIn"):
        return generate_response(Status.USER_NOT_LOGGED_IN, "")

    current_user = request.session.get("username")

    def is_number(s: str) -> bool:
        try:
            float(s)
            return s.strip() != ""
        except ValueError:
            return False

    if not is_number(chat_id):
        return generate_response(Status.ERROR, "chat_id is not a number")

    full_chat = get_full_chat(int(chat_id))

    return generate_response(Status.OK, {"username": current_user, "fullChat": full_chat.model_dump() if full_chat else None})