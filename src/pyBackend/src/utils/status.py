from enum import Enum
from dataclasses import dataclass

@dataclass(frozen=True)
class StatusDetail:
    msg: str
    code: int

class Status(Enum):
    # Basic
    OK = StatusDetail(msg="Ok.", code=100)
    ERROR = StatusDetail(msg="An error has occurred.", code=101)

    # Auth
    USER_NOT_LOGGED_IN = StatusDetail(msg="The user is not logged in.", code=201)
    USER_NOT_ALLOWED = StatusDetail(msg="The user is not allowed to perform this action", code=202)
    USER_NOT_PART_OF_CHAT = StatusDetail(msg="The user is not a part of this chat", code=203)

    # Login
    LOGIN_USERNAME_OR_PASSWORD_INCORRECT = StatusDetail(
        msg="The combination of username and password doesn't match", 
        code=301
    )

    # Sign-up
    USER_LOGGED_IN = StatusDetail(
        msg="The user cannot perform this action because they are logged in", 
        code=401
    )
    USERNAME_TAKEN = StatusDetail(msg="The username is already taken", code=402)
    USERNAME_TOO_SHORT = StatusDetail(msg="The username is too short", code=403)
    PASSWORDS_MATCH = StatusDetail(msg="The password are not allowed to match", code=404)
    USERNAME_INVALID = StatusDetail(msg="The username contains invalid characters", code=405)
    PASSWORD_WEAK = StatusDetail(msg="The password does not meet the security requirements", code=406)
    PASSWORD_INVALID = StatusDetail(msg="The password contains invalid characters", code=407)
    USERNAME_TOO_LONG = StatusDetail(msg="The username is too long", code=408)

    # Chats
    CHAT_NOT_FOUND = StatusDetail(msg="The requested chat does not exist", code=501)
    CHAT_ALREADY_EXISTS = StatusDetail(msg="The requested chat already exists", code=502)

    @property
    def msg(self) -> str:
        return self.value.msg

    @property
    def code(self) -> int:
        return self.value.code