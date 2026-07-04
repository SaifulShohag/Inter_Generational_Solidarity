import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from app.dependencies import get_current_user
from app.models.user import User, UserRole
from app.schemas.conversation import MessageIn, ConversationSummary
from app.services.conversation_store import (
    create_session, load_session, delete_session, list_user_sessions
)
from app.services.agent_service import stream_agent_response

router = APIRouter(prefix="/conversations", tags=["Conversations"])

@router.get("", response_model=list[ConversationSummary])
async def list_conversations(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.REQUESTER:
        raise HTTPException(403, "Only requesters have conversations")
    return await list_user_sessions(current_user.id)

@router.post("/start")
async def start_conversation(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.REQUESTER:
        raise HTTPException(403, "Only requesters can start conversations")
    session_id = str(uuid.uuid4())
    session    = await create_session(session_id, current_user.id)
    return {"session_id": session_id, "status": session["status"]}

@router.post("/{session_id}/message")
async def send_message(
    session_id: str,
    body: MessageIn,                               # typed schema — not raw dict
    current_user: User = Depends(get_current_user)
):
    session = await load_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    if session["user_id"] != current_user.id:
        raise HTTPException(403, "Not your session")

    return StreamingResponse(
        stream_agent_response(session_id, current_user.id, body.text),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )

@router.get("/{session_id}/history")
async def get_history(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    session = await load_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    if session["user_id"] != current_user.id:
        raise HTTPException(403, "Not your session")
    return {
        "session_id": session_id,
        "status":     session["status"],
        "request_id": session.get("request_id"),
        "messages": [
            m for m in session["messages"]
            if m["role"] in ("user", "assistant")   # hide tool call internals from frontend
        ]
    }

@router.delete("/{session_id}")
async def delete_conversation(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    session = await load_session(session_id)
    if not session or session["user_id"] != current_user.id:
        raise HTTPException(403, "Not your session")
    await delete_session(session_id)
    return {"ok": True}