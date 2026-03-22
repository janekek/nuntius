from flask import Flask, jsonify, request, session
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room
import datetime

import src.backend.login
import src.backend.checkSession
import src.backend.chats
import src.backend.singleChat
import src.backend.logout
import src.backend.receiveChat

app = Flask(__name__)
app.secret_key = "verySecurePassword"
CORS(app,
     supports_credentials=True,
     origins=["http://localhost:3000"]) 
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route("/api/checkSession", methods=["GET"])
def handleCheckSession():
    return src.backend.checkSession.checkSession(session)

@app.route("/api/login", methods=["POST"])
def handelLogin():
    return src.backend.login.handleLogin(request, session)

@app.route("/api/logout", methods=["POST"])
def handelLogout():
    return src.backend.logout.handleLogout(session)

@app.route("/api/chats", methods=["GET"])
def handelChats():
    return src.backend.chats.handleChats(session)

@app.route("/api/chats/<chatID>", methods=["GET"])
def handelSingleChat(chatID):
    return src.backend.singleChat.handelSingleChat(session, chatID)

@socketio.on('join')
def onJoin(data):
    chatID = data['chatID']
    join_room(chatID)

@socketio.on('sendMessage')
def handle_message(data):
    chatID = data['chatID']
    msg = data['msg']
    sender = session.get("username")
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    addChat = src.backend.receiveChat.addChatMessageToDatabase(session=session, msg=msg, chatID=chatID)
    emit('receiveMessage', {'sender': sender, 'text': msg, "timestamp":timestamp, "status":addChat.msg}, room=chatID)

if __name__ == "__main__":
    socketio.run(app, debug=True, port=5000)
    # app.run(port=5000, debug=True)