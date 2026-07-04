from pydantic import BaseModel, Field

class MessageIn(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)

class ConversationSummary(BaseModel):
    """Returned when listing all conversations for a user."""
    session_id:    str
    status:        str
    request_id:    int | None
    message_count: int
    created_at:    str
    updated_at:    str