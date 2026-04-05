from fastapi import APIRouter, Request
from src.utils.status import Status
from src.utils.server_response import generate_response
from src.database.databaseOperations import get_user_color, get_user_send_read_receipt_default, get_user_send_read_receipts
from pydantic import BaseModel

router = APIRouter()


@router.get("/api/settings")
async def search_user(request: Request):
    if not request.session or not request.session.get("loggedIn"):
        return generate_response(Status.USER_NOT_LOGGED_IN, "")
    username = request.session.get("username")
    color_id = get_user_color(username=username)
    send_read_receipt_default = get_user_send_read_receipt_default(username=username)

    content = {
        "color_id": color_id,
        "send_read_receipt_default": send_read_receipt_default
    }
    
    return generate_response(Status.OK, content=content)

class SettingsChatRequest(BaseModel):
    chat_id : int

@router.post("/api/settingsChat")
async def search_user(request: Request, data: SettingsChatRequest):
    if not request.session or not request.session.get("loggedIn"):
        return generate_response(Status.USER_NOT_LOGGED_IN, "")
    
    username = request.session.get("username")
    chat_id = data.chat_id

    send_read_receipts = get_user_send_read_receipts(username=username, chat_id=chat_id)

    content = {
        "send_read_receipts": send_read_receipts
    }
    
    return generate_response(Status.OK, content=content)