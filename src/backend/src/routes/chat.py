from fastapi import APIRouter, Request, Path
from src.utils.status import Status
from src.utils.server_response import generate_response
from src.database.databaseOperations import get_full_chat, get_chat_public_keys
from src.database.databaseOperations import get_user_encrypted_private_key, get_user_public_key, leave_chat, delete_user_account
from src.database.database import db, User, ChatParticipant, MessageKey
from pydantic import BaseModel
from typing import List
from src.database.databaseOperations import db

router = APIRouter()

@router.get("/chat/{chat_id}")
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

    full_chat = get_full_chat(int(chat_id), current_user)

    return generate_response(Status.OK, {
        "username": current_user, 
        "fullChat": full_chat.model_dump() if full_chat else None
    })

@router.get("/chat/{chat_id}/keys")
async def handle_get_chat_keys(request: Request, chat_id: int):
    if not request.session.get("loggedIn"):
        return generate_response(Status.USER_NOT_LOGGED_IN, "")
    
    keys = get_chat_public_keys(chat_id)
    print(keys)
    return generate_response(Status.OK, {"keys": keys})


@router.get("/user/keys")
async def handle_get_my_keys(request: Request):
    if not request.session.get("loggedIn"):
        return generate_response(Status.USER_NOT_LOGGED_IN, "")

    current_user = request.session.get("username")
    keys = get_user_encrypted_private_key(current_user)
    
    if not keys:
        return generate_response(Status.ERROR, "Keine Keys gefunden")

    return generate_response(Status.OK, keys)

class GetUserPublicKeyRequest(BaseModel):
    username: str

@router.post("/chat/get_user_public_key")
async def user_public_key(request: Request, data: GetUserPublicKeyRequest):
    if not request.session or not request.session.get("loggedIn"):
        return generate_response(Status.USER_NOT_LOGGED_IN, "")
    # username = request.session.get("username")
    public_key = get_user_public_key(username=data.username)
    return generate_response(Status.OK, {"public_key" : public_key})

class AddUserRequest(BaseModel):
    new_username: str
    historic_keys: List[dict]

@router.post("/chat/{chat_id}/add_user")
async def handle_add_user_to_chat(request: Request, chat_id: int, data: AddUserRequest):
    if not request.session.get("loggedIn"):
        return generate_response(Status.USER_NOT_LOGGED_IN, "")

    current_user = request.session.get("username")

    try:
        is_in_chat = db.query(ChatParticipant).filter(
            ChatParticipant.chat_id == chat_id,
            ChatParticipant.username == current_user
        ).first()
        
        if not is_in_chat:
            return generate_response(Status.ERROR, "Du bist nicht in diesem Chat!")

        user_to_add = db.query(User).filter(User.username == data.new_username).first()
        if not user_to_add:
            return generate_response(Status.ERROR, "Benutzer existiert nicht.")

        already_in_chat = db.query(ChatParticipant).filter(
            ChatParticipant.chat_id == chat_id,
            ChatParticipant.username == data.new_username
        ).first()
        
        if not already_in_chat:
            new_participant = ChatParticipant(
                chat_id=chat_id,
                username=data.new_username,
                send_read_receipts=user_to_add.send_read_receipts_default 
            )
            db.add(new_participant)

        for key_data in data.historic_keys:
            new_key = MessageKey(
                message_id=key_data["message_id"],
                username=data.new_username,
                encrypted_sym_key=key_data["encrypted_sym_key"]
            )
            db.merge(new_key)
        
        db.commit()
        return generate_response(Status.OK, "User erfolgreich hinzugefügt und Historie geteilt.")

    except Exception as e:
        db.rollback()
        print("Fehler beim Hinzufügen zum Chat:", e)
        return generate_response(Status.ERROR, "Interner Datenbankfehler.")
    

@router.post("/chat/{chat_id}/leave")
async def handle_leave_chat(request: Request, chat_id: int):
    if not request.session.get("loggedIn"):
        return generate_response(Status.USER_NOT_LOGGED_IN, "")
    
    current_user = request.session.get("username")
    
    try:
        leave_chat(current_user, chat_id)
        return generate_response(Status.OK, "")
    except Exception:
        return generate_response(Status.ERROR, "Fehler beim Verlassen des Chats.")

@router.post("/user/delete")
async def handle_delete_account(request: Request):
    if not request.session.get("loggedIn"):
        return generate_response(Status.USER_NOT_LOGGED_IN, "")
    
    current_user = request.session.get("username")
    
    try:
        delete_user_account(current_user)
        request.session.clear()
        
        return generate_response(Status.OK, "")
    except Exception:
        return generate_response(Status.ERROR, "")