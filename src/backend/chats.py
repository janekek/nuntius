import os
import json
from flask import jsonify

scriptDir = os.path.dirname(__file__)

def getChats():
    with open(os.path.join(scriptDir, "chats.json"), "r", encoding="utf-8") as f:
        return json.load(f)["chats"]
    
def handleChats(session):
    currentUser = session.get("username")
    chats = getChats()
    userChats = [c for c in chats if currentUser in c["usernames"]]
    return jsonify({"username":currentUser, "chats":userChats})