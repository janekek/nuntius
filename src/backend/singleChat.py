from .chats import getChats
from flask import jsonify

from src.backend.utils.status import Status

def handelSingleChat(session, chatID):  

    if not session.get("loggedIn"):
        return jsonify({"status": Status.USER_NOT_LOGGED_IN})

    currentUser = session.get("username")
    chats = getChats()
    chat = None
    for c in chats:
        if c["chatID"] == chatID:
            chat = c
            break
    

    if not chat:
        return jsonify({"status":"Chat not found"})
    
    if currentUser not in chat["usernames"]:
        return jsonify({"status": Status.USER_NOT_PART_OF_CHAT.code, "content": ""})

    content = {
        "username": currentUser,
        "chat": chat
    }
    response = {
        "status": Status.OK.code,
        "content": content
    }
    return jsonify(response)
