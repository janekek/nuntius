from fastapi import APIRouter, Request, Path
from src.utils.status import Status
from src.utils.server_response import generate_response
from src.database.databaseOperations import get_full_chat, get_chat_public_keys
from src.database.databaseOperations import get_user_encrypted_private_key

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

    # HIER IST DIE ÄNDERUNG: Wir übergeben den current_user an get_full_chat
    full_chat = get_full_chat(int(chat_id), current_user)

    return generate_response(Status.OK, {
        "username": current_user, 
        "fullChat": full_chat.model_dump() if full_chat else None
    })

@router.get("/api/chat/{chat_id}/keys")
async def handle_get_chat_keys(request: Request, chat_id: int):
    if not request.session.get("loggedIn"):
        return generate_response(Status.USER_NOT_LOGGED_IN, "")
    
    keys = get_chat_public_keys(chat_id)
    print(keys)
    return generate_response(Status.OK, {"keys": keys})


@router.get("/api/user/keys")
async def handle_get_my_keys(request: Request):
    if not request.session.get("loggedIn"):
        return generate_response(Status.USER_NOT_LOGGED_IN, "")

    current_user = request.session.get("username")
    keys = get_user_encrypted_private_key(current_user)
    
    if not keys:
        return generate_response(Status.ERROR, "Keine Keys gefunden")

    return generate_response(Status.OK, keys)