from datetime import datetime
from pydantic import BaseModel
from app.models.help_request import RequestCategory, RequestStatus

class HelpRequestOut(BaseModel):
    id:            int
    requester_id:  int
    title:         str
    description:   str
    category:      RequestCategory
    scheduled_at:  datetime          # proper datetime — not a raw string
    location_text: str
    latitude:      float | None
    longitude:     float | None
    status:        RequestStatus
    created_at:    datetime
    updated_at:    datetime

    class Config:
        from_attributes = True