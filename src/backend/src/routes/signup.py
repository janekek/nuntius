from fastapi import APIRouter, Request
import hashlib
from pydantic import BaseModel
from src.utils.status import Status
from src.utils.server_response import generate_response
from src.utils.myTypes import EnhancedUser
from src.database.databaseOperations import create_user, is_username_taken
import re

router = APIRouter()

class SignupRequest(BaseModel):
    username: str
    password: str
    password2: str
    public_key: str
    encrypted_private_key: str
    iv_private_key: str
    color_id: int

@router.post("/signup")
async def handle_signup(request: Request, data: SignupRequest):
    if request.session.get("loggedIn"):
        return generate_response(Status.USER_LOGGED_IN, "")

    try:
        if not data.username or len(data.username) <= 3:
            return generate_response(Status.USERNAME_TOO_SHORT, "")
        
        if len(data.username) >= 20:
            return generate_response(Status.USERNAME_TOO_LONG, "")

        if not re.match(r"^[a-zA-Z0-9]+$", data.username): 
            return generate_response(Status.USERNAME_INVALID, "")

        if is_username_taken(data.username):
            return generate_response(Status.USERNAME_TAKEN, "")

        if data.password == data.password2:
            return generate_response(Status.PASSWORDS_MATCH, "") 
        
        if not re.match(r"^[\x21-\x7E]+$", data.password):
            return generate_response(Status.PASSWORD_INVALID, "")
        
        if not re.match(r"^[\x21-\x7E]+$", data.password2):
            return generate_response(Status.PASSWORD_INVALID, "")

        hashed_password = hashlib.sha256(data.password.encode()).hexdigest()

        user = EnhancedUser(
            username=data.username,
            password_hash=hashed_password,
            public_key=data.public_key,
            encrypted_private_key=data.encrypted_private_key,
            iv_private_key=data.iv_private_key,
            color_id=data.color_id
        )

        create_user(user)
        return generate_response(Status.OK, "")
    except Exception as e:
        print("Signup Fehler:", e)
        return generate_response(Status.ERROR, str(e))