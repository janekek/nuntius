from src.backend.utils.status import Status
from typing import Literal

class UserInteractionUtils:
    
    def checkLogin(session) -> Literal[Status.OK, Status.USER_NOT_LOGGED_IN]:
        return Status.OK if session.get("loggedIn") else Status.USER_NOT_LOGGED_IN