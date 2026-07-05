from datetime import datetime
from pydantic import BaseModel, Field

class AssignmentCreate(BaseModel):
    eta_minutes: int = Field(..., ge=0, description="Estimated arrival time in minutes")

class AssignmentLocationUpdate(BaseModel):
    lat:       float
    lng:       float
    timestamp: str

class WithdrawBody(BaseModel):
    reason: str = Field(..., min_length=10, description="Why the volunteer is withdrawing")

class AssignmentOut(BaseModel):
    id:                    int
    request_id:            int
    volunteer_id:          int
    accepted_at:           datetime
    eta_minutes:           int | None
    completed_at:          datetime | None
    volunteer_current_lat: float | None
    volunteer_current_lng: float | None
    meeting_code:          str | None

    class Config:
        from_attributes = True