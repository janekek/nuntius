from flask import jsonify

def handleLogout(session):
    session.clear()
    return jsonify({"status":"ok"})