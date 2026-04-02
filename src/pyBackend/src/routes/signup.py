from fastapi import APIRouter, Request
import hashlib
from pydantic import BaseModel
from src.utils.status import Status
from src.utils.server_response import generate_response, send_response
from src.utils.myTypes import EnhancedUser
from src.database.databaseOperations import create_user, is_username_taken

router = APIRouter()

class SignupRequest(BaseModel):
    username: str
    password: str
    password2: str
    public_key: str
    encrypted_private_key: str # NEU
    iv_private_key: str

@router.post("/api/signup")
async def handle_signup(request: Request, data: SignupRequest):
    if request.session.get("loggedIn"):
        return send_response(Status.USER_LOGGED_IN, "")

    try:
        if not data.username or len(data.username) <= 3:
            return send_response(Status.USERNAME_TOO_SHORT, "")

        if is_username_taken(data.username):
            return send_response(Status.USERNAME_TAKEN, "")

        if data.password == data.password2:
            return send_response(Status.PASSWORDS_MATCH, "") 

        hashed_password = hashlib.sha256(data.password.encode()).hexdigest()

        # Hier packen wir die neuen Keys ins User-Objekt
        user = EnhancedUser(
            username=data.username,
            password_hash=hashed_password,
            public_key=data.public_key,
            encrypted_private_key=data.encrypted_private_key,
            iv_private_key=data.iv_private_key
        )

        create_user(user)
        return generate_response(Status.OK, "")
    except Exception as e:
        print("Signup Fehler:", e)
        return generate_response(Status.ERROR, str(e))