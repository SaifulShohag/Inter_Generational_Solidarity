from datetime import datetime
from pydantic import BaseModel, Field

class ReviewCreate(BaseModel):
    rating:  int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")
    comment: str | None = None

class ReviewOut(BaseModel):
    id:          int
    request_id:  int
    reviewer_id: int
    reviewee_id: int
    rating:      int
    comment:     str | None
    created_at:  datetime

    class Config:
        from_attributes = True