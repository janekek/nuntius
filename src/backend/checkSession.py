from flask import jsonify

def checkSession(session):
    if session.get('loggedIn'):
        return jsonify({"loggedIn": True,"username": session["username"]})
    else:
        return jsonify({"loggedIn": False})