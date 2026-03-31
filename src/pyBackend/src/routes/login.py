from fastapi import APIRouter, Request
import hashlib
from src.utils.status import Status
from src.utils.server_response import generate_response
from src.database.databaseOperations import check_credentials
from pydantic import BaseModel

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str

def check_login_data(username: str, password: str) -> bool:
    hashed_password = hashlib.sha256(password.encode()).hexdigest()
    return check_credentials(username, hashed_password)

@router.post("/api/login")
async def handle_login(request: Request, data: LoginRequest):
    print(data)
    if check_login_data(data.username, data.password):
        request.session["loggedIn"] = True
        request.session["username"] = data.username
        return generate_response(Status.OK, "")
    else:
        return generate_response(Status.LOGIN_USERNAME_OR_PASSWORD_INCORRECT, "")