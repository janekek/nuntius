from flask import jsonify
import os
import datetime
import json

from src.backend.utils.status import Status
# from src.backend.utils.userInteractionUtils import UserInteractionUtils
from src.backend.utils import UserInteractionUtils

scriptDir = os.path.dirname(__file__)

def addChatMessageToDatabase(session, msg, chatID) -> Status:
    return Status.OK
    login = UserInteractionUtils.checkLogin(session)
    if not login == Status.OK:
        return login
    
    sender = session.get("username")

    with open(os.path.join(scriptDir, "chats.json"), "r+", encoding="utf-8") as f:
        data = json.load(f)
        for chat in data["chats"]:
            if chat["chatID"] == chatID:
                if sender in chat["usernames"]:
                    newMsg = {
                        "sender" : sender,
                        "text" : msg,
                        "timestamp" : datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    }
                    chat["messages"].append(newMsg)

                    f.seek(0)
                    json.dump(data, f, indent=2)
                    f.truncate()
                    return Status.OK
                else:
                    return Status.USER_NOT_PART_OF_CHAT
        return Status.ERROR
    return Status.ERROR