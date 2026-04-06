from fastapi import APIRouter, Request
from src.utils.status import Status
from src.utils.server_response import generate_response

router = APIRouter()

@router.get("/logout")
async def handle_logout(request: Request):
    request.session.clear() 
    response = generate_response(Status.OK, "")
    response.delete_cookie("session") # Standard-Cookie von Starlette löschen
    return response