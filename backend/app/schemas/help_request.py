from datetime import datetime
from pydantic import BaseModel
from app.models.help_request import RequestCategory, RequestStatus

class HelpRequestOut(BaseModel):
    id:             int
    requester_id:   int
    requester_name: str | None = None
    title:          str
    description:    str
    category:       RequestCategory
    scheduled_at:   datetime
    location_text:  str
    latitude:       float | None
    longitude:      float | None
    status:         RequestStatus
    created_at:     datetime
    updated_at:     datetime

    class Config:
        from_attributes = True

class AssignedMissionOut(HelpRequestOut):
    accepted_at:  datetime
    completed_at: datetime | None = None
