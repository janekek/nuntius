from fastapi import (
    FastAPI,
    Request,
)

from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.datastructures import Headers
import itsdangerous
import socketio

import uvicorn

from src.utils.status import Status 
from src.utils.server_response import generate_response, generate_ws_payload
from src.database.databaseOperations import create_chat_with_users, set_user_last_read_message, set_user_color
from src.routes import login, logout, signup, chats, chat, searchUser, createChat, color, receipts, settings
from src.chat.receiveChat import handle_send_message

SESSION_COOKIE_NAME = "session"
SESSION_SECRET = "verySecretKey"

app = FastAPI()

# Session & CORS Middleware setup
app.add_middleware(
    SessionMiddleware, 
    secret_key="verySecretKey", 
    session_cookie=SESSION_COOKIE_NAME,
    max_age=1000 * 60 * 60 * 24, # 24 hrs
    same_site="none",  #  Erlaubt Cross-Domain Cookies
    https_only=True,    #   Pflicht, wenn same_site="none"
)

origins = [
    "http://localhost:3000",
    "http://192.168.2.70:3000",
    "http://192.168.2.131:3000",
    "https://nuntius.janek-zeiger.com"
]

app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://localhost:3000"],
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    
)


sio = socketio.AsyncServer(
    async_mode='asgi', 
    # cors_allowed_origins="http://localhost:3000"
    cors_allowed_origins="*"
)
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
app.include_router(searchUser.router)
app.include_router(createChat.router)
app.include_router(color.router)
app.include_router(receipts.router)
app.include_router(settings.router)

@app.get("/database")
async def handle_database(request: Request):
    response = set_user_color("Janek", 1)
    set_user_color("Timon", 2)
    set_user_color("Frank", 3)
    # response = run_sql_code(data.command)
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

@sio.on("sendReadMessage")
async def send_read_message(sid, data):
    session = get_session_manually(sid)
    if not session or not session.get("loggedIn"):
        return await sio.emit(generate_ws_payload(Status.USER_NOT_LOGGED_IN, ""), to=sid)
    username = session.get("username")
    chat_id = int(data.get("chat_id"))
    last_message_id = int(data.get("last_message_id"))

    set_user_last_read_message(chat_id=chat_id, last_message_id=last_message_id, username=username)
# <-- websocket ---

if __name__ == "__main__":
    uvicorn.run("app:socket_app", host="0.0.0.0", port=5000, reload=True)