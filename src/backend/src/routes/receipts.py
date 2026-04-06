from fastapi import APIRouter, Request
from src.utils.status import Status
from src.utils.server_response import generate_response
from pydantic import BaseModel
from src.database.databaseOperations import set_user_send_read_receipts, set_user_send_read_receipt_default
router = APIRouter()

class ReceiptsRequest(BaseModel):
    send_read_receipts_default: bool

@router.put("/receipts")
async def search_user(request: Request, data: ReceiptsRequest):
    if not request.session or not request.session.get("loggedIn"):
        return generate_response(Status.USER_NOT_LOGGED_IN, "")
    username = request.session.get("username")
    send_read_receipts = data.send_read_receipts_default

    success = set_user_send_read_receipt_default(username, send_read_receipts)

    if not success:
        return generate_response(Status.ERROR, "")
    
    return generate_response(Status.OK, "")


class ReceiptsChatRequest(BaseModel):
    send_read_receipts: bool
    chat_id: int

@router.put("/receiptsChat")
async def search_user(request: Request, data: ReceiptsChatRequest):
    if not request.session or not request.session.get("loggedIn"):
        return generate_response(Status.USER_NOT_LOGGED_IN, "")
    
    username = request.session.get("username")
    chat_id = data.chat_id
    send_read_receipts = data.send_read_receipts

    try:
        set_user_send_read_receipts(chat_id=chat_id, send_receipts=send_read_receipts, username=username)
    except:
        return generate_response(Status.ERROR, "")
    
    return generate_response(Status.OK, "")
