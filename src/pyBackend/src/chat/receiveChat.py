from src.utils.status import Status, StatusDetail
from src.database.databaseOperations import add_message_to_chat

from datetime import datetime

async def handle_send_message(sid, session, data, sio):

    if not session or not session.get("loggedIn"):
        print("hi")
        await sio.emit("error", {"message": "Nicht authentifiziert"}, to=sid)
        return

    chat_id_raw = data.get("chatID")
    msg = data.get("msg")
    
    try:
        chat_id = int(chat_id_raw)
    except (ValueError, TypeError):
        await sio.emit("error", {"message": "Ungültige Chat-ID"}, to=sid)
        return

    # Logik-Check in DB
    result = add_chat_message_to_database(session, msg, chat_id)

    if result.code == Status.OK.code:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        message_payload = {
            "content": msg,
            "sender_username": session.get("username"),
            "timestamp": timestamp
        }

        # FIX: await hinzufügen und Raum als String
        await sio.emit("receiveMessage", {
            "status": result.msg,
            "message": message_payload
        }, room=str(chat_id))
    else:
        await sio.emit("error", {"message": result.msg}, to=sid)


def add_chat_message_to_database(session: dict, msg: str, chat_id: int) -> StatusDetail:
    if not session.get("loggedIn"):
        return Status.USER_NOT_LOGGED_IN.value
    
    sender = session.get("username")
    print(sender)
    print(chat_id)
    print(msg)
    add_message_to_chat(chat_id, sender, msg)
    return Status.OK.value