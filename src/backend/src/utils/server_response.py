from fastapi.responses import JSONResponse
from src.utils.status import Status

def generate_response(status: Status, content: any = "") -> JSONResponse:
    return JSONResponse(
        status_code=200, 
        content={
            "status": {
                "code": status.value.code,
                "msg": status.value.msg
            },
            "content": content
        }
    )

def generate_ws_payload(status: Status, content: any = "") -> dict:
    return {
        "status": {
            "code": status.value.code,
            "msg": status.value.msg
        },
        "content": content
    }

def send_response(status: Status, content: any = "") -> JSONResponse:
    return generate_response(status, content)