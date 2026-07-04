from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from collections import defaultdict
from app.services.auth_service import decode_token
from app.schemas.assignment import AssignmentLocationUpdate

router = APIRouter(tags=["Location"])

# request_id → list of active WebSocket connections in that room
rooms: dict[str, list[WebSocket]] = defaultdict(list)

@router.websocket("/ws/location/{request_id}")
async def location_stream(
    websocket:  WebSocket,
    request_id: str,
    token:      str = Query(...)
):
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    await websocket.accept()
    rooms[request_id].append(websocket)

    try:
        while True:
            raw = await websocket.receive_json()
            # Validate payload shape before broadcasting
            try:
                AssignmentLocationUpdate(**raw)
            except Exception:
                await websocket.send_json({"error": "Invalid payload. Expected: {lat, lng, timestamp}"})
                continue
            # Broadcast to all other connections in the same room
            for conn in rooms[request_id]:
                if conn != websocket:
                    await conn.send_json(raw)
    except WebSocketDisconnect:
        rooms[request_id].remove(websocket)
        if not rooms[request_id]:
            del rooms[request_id]