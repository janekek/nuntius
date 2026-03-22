from .chats import getChats
from flask import jsonify

def handelSingleChat(session, chatID):  
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
        return jsonify({"status":"User not in chat"})

    return jsonify({"status":"Ok", "username":currentUser, "chat":chat})
