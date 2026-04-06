from src.utils.status import Status, StatusDetail
from src.database.databaseOperations import add_message_to_chat
from src.database.databaseOperations import add_encrypted_message

from datetime import datetime

async def handle_send_message(sid, session, data, sio):
    if not session or not session.get("loggedIn"):
        await sio.emit("error", {"message": "Nicht authentifiziert"}, to=sid)
        return

    chat_id = int(data.get("chatID"))
    encrypted_content = data.get("encryptedContent")
    iv = data.get("iv")
    keys = data.get("keys")

    sender = session.get("username")

    result = add_encrypted_message(chat_id, sender, encrypted_content, iv, keys)

    if result["code"] == Status.OK.code:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # jeder Client filtert sich seinen Key
        message_payload = {
            "id": result["message_id"],
            "content": encrypted_content,
            "iv": iv,
            "keys": keys,
            "sender_username": sender,
            "timestamp": timestamp
        }

        await sio.emit("receiveMessage", {
            "status": result["msg"],
            "message": message_payload
        }, room=str(chat_id))
    else:
        await sio.emit("error", {"message": "Fehler beim Speichern"}, to=sid)


def add_chat_message_to_database(session: dict, msg: str, chat_id: int) -> StatusDetail:
    if not session.get("loggedIn"):
        return Status.USER_NOT_LOGGED_IN.value
    
    sender = session.get("username")
    print(sender)
    print(chat_id)
    print(msg)
    add_message_to_chat(chat_id, sender, msg)
    return Status.OK.value