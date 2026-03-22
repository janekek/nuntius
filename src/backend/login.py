import os
from flask import jsonify
import json
import hashlib

from src.backend.utils.status import Status

def checkLoginData(username, password):
    path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend/users.json")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    hashedPassword = hashlib.sha256(password.encode('utf-8')).hexdigest()
    for user in data:
        if user["username"] == username and user["password"] == hashedPassword:
            return True
    return False

def handleLogin(request, session):
    data = request.get_json()
    submittedUsername = data.get("username")
    submittedPassword = data.get("password")

    if checkLoginData(submittedUsername, submittedPassword):
        session['loggedIn'] = True
        session['username'] = submittedUsername
        return jsonify({"status": Status.OK.code})
    else:
        return jsonify({"status" : Status.LOGIN_USERNAME_OR_PASSWORD_INCORRECT.code})
