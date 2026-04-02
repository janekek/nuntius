from fastapi.responses import JSONResponse
from src.utils.status import Status

def generate_response(status: Status, content: any = "") -> JSONResponse:
    # Wir erzwingen HTTP 200, damit das Frontend die Response 
    # immer im "success"-Block (z.B. axios.then) empfängt.
    return JSONResponse(
        status_code=200, 
        content={
            "status": {
                "code": status.value.code, # Dein interner Code (z.B. 401)
                "msg": status.value.msg
            },
            "content": content
        }
    )

def generate_ws_payload(status: Status, content: any = "") -> dict:
    return {
        "status": {
            "code": status.value.code, # Dein interner Code (z.B. 401)
            "msg": status.value.msg
        },
        "content": content
    }

def send_response(status: Status, content: any = "") -> JSONResponse:
    # TS Code hatte generateResponse und sendResponse separat, machten vermutlich dasselbe
    return generate_response(status, content)