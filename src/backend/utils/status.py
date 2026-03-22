from enum import Enum

class Status(Enum):
    OK = ("Ok.", 100)
    ERROR = ("An error has orrured.", 101)

    USER_NOT_LOGGED_IN = ("The user is not logged in.", 201)
    USER_NOT_ALLOWED = ("The user is not allowed to perform this action", 202)
    USER_NOT_PART_OF_CHAT = ("The user is not a part of this chat", 203)

    LOGIN_USERNAME_OR_PASSWORD_INCORRECT = ("The combination of username and password doesn't match", 301)

    def __init__ (self, msg, code):
        self.msg = msg
        self.code = code