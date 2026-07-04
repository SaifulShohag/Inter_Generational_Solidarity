from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.review import Review
from app.models.help_request import HelpRequest, RequestStatus
from app.models.assignment import VolunteerAssignment
from app.schemas.review import ReviewCreate, ReviewOut

router = APIRouter(tags=["Reviews"])

@router.post("/requests/{request_id}/review", response_model=ReviewOut)
async def submit_review(
    request_id: int,
    body: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    req = await db.get(HelpRequest, request_id)
    if not req or req.status != RequestStatus.COMPLETED:
        raise HTTPException(400, "Request is not completed yet")

    assignment = (await db.execute(
        select(VolunteerAssignment).where(VolunteerAssignment.request_id == request_id)
    )).scalar_one_or_none()
    if not assignment:
        raise HTTPException(404, "No assignment found for this request")

    # Determine who is being reviewed
    if current_user.id == req.requester_id:
        reviewee_id = assignment.volunteer_id
    elif current_user.id == assignment.volunteer_id:
        reviewee_id = req.requester_id
    else:
        raise HTTPException(403, "You are not part of this request")

    # Block duplicate reviews — also enforced by DB UniqueConstraint as a safety net
    existing = (await db.execute(
        select(Review).where(
            Review.request_id  == request_id,
            Review.reviewer_id == current_user.id
        )
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(409, "You have already submitted a review for this request")

    review = Review(
        request_id=request_id,
        reviewer_id=current_user.id,
        reviewee_id=reviewee_id,
        rating=body.rating,
        comment=body.comment
    )
    db.add(review)

    # Update reviewee's rolling average rating
    reviewee = await db.get(User, reviewee_id)
    total = reviewee.total_reviews + 1
    reviewee.avg_rating    = ((reviewee.avg_rating * reviewee.total_reviews) + body.rating) / total
    reviewee.total_reviews = total

    await db.commit()
    await db.refresh(review)
    return review

@router.get("/users/{user_id}/reviews", response_model=list[ReviewOut])
async def get_user_reviews(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    result = await db.execute(select(Review).where(Review.reviewee_id == user_id))
    return result.scalars().all()