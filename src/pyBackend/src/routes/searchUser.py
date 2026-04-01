from fastapi import APIRouter, Request
from src.utils.status import Status
from src.utils.server_response import generate_response
from src.database.databaseOperations import search_users_by_prefix
from pydantic import BaseModel

router = APIRouter()

class SearchRequest(BaseModel):
    searchUser: str

@router.post("/api/searchUser")
async def search_user(request: Request, data: SearchRequest):
    prefix = data.searchUser
    result = search_users_by_prefix(prefix=prefix)
    return generate_response(Status.OK, {"result": result})