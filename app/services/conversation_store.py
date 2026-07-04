import json
import os
import aiofiles
from datetime import datetime, timezone
from app.config import settings

os.makedirs(settings.CONVERSATIONS_DIR, exist_ok=True)

def _path(session_id: str) -> str:
    return os.path.join(settings.CONVERSATIONS_DIR, f"{session_id}.json")

async def load_session(session_id: str) -> dict | None:
    try:
        async with aiofiles.open(_path(session_id), "r") as f:
            return json.loads(await f.read())
    except FileNotFoundError:
        return None

async def save_session(session_id: str, data: dict):
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    async with aiofiles.open(_path(session_id), "w") as f:
        await f.write(json.dumps(data, indent=2))

async def create_session(session_id: str, user_id: int) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    data = {
        "session_id": session_id,
        "user_id":    user_id,
        "status":     "active",      # active | completed
        "request_id": None,          # filled when agent calls create_help_request
        "messages":   [],
        "created_at": now,
        "updated_at": now
    }
    await save_session(session_id, data)
    return data

async def delete_session(session_id: str):
    try:
        os.remove(_path(session_id))
    except FileNotFoundError:
        pass

async def list_user_sessions(user_id: int) -> list[dict]:
    """Returns a summary list of all sessions belonging to a given user."""
    sessions = []
    try:
        files = os.listdir(settings.CONVERSATIONS_DIR)
    except FileNotFoundError:
        return []
    for filename in files:
        if not filename.endswith(".json"):
            continue
        session = await load_session(filename[:-5])
        if not session or session.get("user_id") != user_id:
            continue
        user_messages = [m for m in session["messages"] if m["role"] in ("user", "assistant")]
        sessions.append({
            "session_id":    session["session_id"],
            "status":        session["status"],
            "request_id":    session.get("request_id"),
            "message_count": len(user_messages),
            "created_at":    session["created_at"],
            "updated_at":    session["updated_at"],
        })
    return sorted(sessions, key=lambda x: x["updated_at"], reverse=True)