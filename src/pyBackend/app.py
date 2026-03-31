from fastapi import (
    Cookie,
    FastAPI,
    Request,
    Query,
    WebSocket,
    WebSocketException,
    status,
)

from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.datastructures import Headers
import itsdangerous
import socketio

import uvicorn

from datetime import datetime


from src.utils.status import Status 
from src.utils.server_response import generate_response
from src.database.databaseOperations import run_sql_code
from src.routes import login, logout, signup, chats, chat
from src.chat.receiveChat import handle_send_message

SESSION_COOKIE_NAME = "session"
SESSION_SECRET = "verySecretKey"

app = FastAPI()

# Session & CORS Middleware setup
app.add_middleware(
    SessionMiddleware, 
    secret_key="verySecretKey", 
    session_cookie=SESSION_COOKIE_NAME,
    max_age=1000 * 60 * 60 * 24 # 24 hrs
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins="http://localhost:3000")
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)


def get_session_manually(sid):
    environ = sio.get_environ(sid)
    scope = environ.get("asgi.scope", {})
    if "session" in scope and scope["session"]:
        return scope["session"]

    headers = Headers(raw=scope.get("headers", []))
    cookie_header = headers.get("cookie")
    
    if cookie_header:
        import http.cookies
        cookie = http.cookies.SimpleCookie(cookie_header)
        if SESSION_COOKIE_NAME in cookie:
            data = cookie[SESSION_COOKIE_NAME].value
            signer = itsdangerous.TimestampSigner(SESSION_SECRET)
            try:
                unsigned_data = signer.unsign(data, max_age=86400)
                import base64
                import json
                return json.loads(base64.b64decode(unsigned_data))
            except Exception as e:
                print(f"Session Dekodierung fehlgeschlagen: {e}")
    return {}


# --- router -->
app.include_router(login.router)
app.include_router(signup.router)
app.include_router(logout.router)
app.include_router(chats.router)
app.include_router(chat.router)

@app.post("/api/database")
async def handle_database(data):
    response = run_sql_code(data.command)
    return generate_response(Status.OK, response)

@app.get("/")
async def root():
    return "Nuntius API is running."
# <-- router ---

# --- websocket -->
@sio.on("connect")
async def connect(sid, environ):
    session = get_session_manually(sid)
    print(f"User connected: {sid}. Session gefunden: {session}")

@sio.on("join")
async def join(sid, data):
    chat_id = str(data.get("chatID"))
    await sio.enter_room(sid, chat_id)
    print(f"User {sid} ist Raum {chat_id} beigetreten")

@sio.on("sendMessage")
async def send_message(sid, data):
    await handle_send_message(sid=sid, session=get_session_manually(sid), data=data, sio=sio)
# <-- websocket ---

if __name__ == "__main__":
    uvicorn.run("app:socket_app", host="0.0.0.0", port=5000, reload=True)