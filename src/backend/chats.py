import os
import json
from flask import jsonify

from src.backend.utils.status import Status

scriptDir = os.path.dirname(__file__)

def getChats():
    with open(os.path.join(scriptDir, "chats.json"), "r", encoding="utf-8") as f:
        return json.load(f)["chats"]
    
def handleChats(session):

    if not session.get("loggedIn"):
        return jsonify({"status": Status.USER_NOT_LOGGED_IN.code})

    currentUser = session.get("username")
    chats = getChats()
    userChats = [c for c in chats if currentUser in c["usernames"]]

    print(userChats)
    
    content = {
        "username": currentUser,
        "chats": userChats
    }
    response = {
        "status": Status.OK.code,
        "content": content
    }
    print(jsonify(response))
    return jsonify(response)