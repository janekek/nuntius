from fastapi import APIRouter, Request
from src.utils.status import Status
from src.utils.server_response import generate_response
from pydantic import BaseModel
from src.database.databaseOperations import set_user_color
router = APIRouter()

class PutColorRequest(BaseModel):
    color_id: int

@router.put("/api/color")
async def search_user(request: Request, data: PutColorRequest):
    if not request.session or not request.session.get("loggedIn"):
        return generate_response(Status.USER_NOT_LOGGED_IN, "")
    
    username = request.session.get("username")
    color_id = data.color_id

    success = set_user_color(username=username, color_id=color_id)

    if not success:
        return generate_response(Status.ERROR, "")
    
    return generate_response(Status.OK, "")


