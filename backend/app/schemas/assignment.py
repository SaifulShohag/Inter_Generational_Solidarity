from datetime import datetime
from pydantic import BaseModel, Field

class AssignmentCreate(BaseModel):
    eta_minutes: int = Field(..., ge=0, description="Estimated arrival time in minutes")

class AssignmentLocationUpdate(BaseModel):
    """Used to validate incoming WebSocket location payloads."""
    lat:       float
    lng:       float
    timestamp: str

class AssignmentOut(BaseModel):
    id:                    int
    request_id:            int
    volunteer_id:          int
    accepted_at:           datetime
    eta_minutes:           int | None
    completed_at:          datetime | None
    volunteer_current_lat: float | None
    volunteer_current_lng: float | None

    class Config:
        from_attributes = True