import json
from datetime import datetime, timezone
from app.services.database import AsyncSessionLocal
from app.models.help_request import HelpRequest, RequestCategory, RequestStatus

async def create_help_request(
    user_id: str,
    title: str,
    description: str,
    category: str,
    scheduled_at: str,
    location_text: str,
    latitude: float = None,
    longitude: float = None
) -> str:
    # Validate and parse datetime from agent
    try:
        parsed_dt = datetime.fromisoformat(scheduled_at)
        if parsed_dt.tzinfo is None:
            parsed_dt = parsed_dt.replace(tzinfo=timezone.utc)
    except ValueError:
        return json.dumps({
            "ok": False,
            "message": "Invalid date format. Use ISO format like 2026-07-10T14:00:00"
        })

    # Validate category
    try:
        cat = RequestCategory(category)
    except ValueError:
        return json.dumps({
            "ok": False,
            "message": f"Invalid category '{category}'. Must be: medical, grocery, cleaning, transport, other"
        })

    async with AsyncSessionLocal() as db:
        req = HelpRequest(
            requester_id=int(user_id),
            title=title,
            description=description,
            category=cat,
            scheduled_at=parsed_dt,
            location_text=location_text,
            latitude=latitude,
            longitude=longitude,
            status=RequestStatus.PENDING
        )
        db.add(req)
        await db.commit()
        await db.refresh(req)
        return json.dumps({
            "ok": True,
            "request_id": req.id,
            "message": "Help request created successfully."
        })


async def get_request_status(request_id: str) -> str:
    async with AsyncSessionLocal() as db:
        req = await db.get(HelpRequest, int(request_id))
        if not req:
            return json.dumps({"ok": False, "message": "Request not found."})
        return json.dumps({
            "ok": True,
            "request_id": req.id,
            "status": req.status.value,
            "title": req.title
        })