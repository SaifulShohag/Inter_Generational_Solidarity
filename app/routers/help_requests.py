import secrets
import string
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.dependencies import get_db, get_current_user, require_role
from app.models.user import User, UserRole
from app.models.help_request import HelpRequest, RequestStatus
from app.models.assignment import VolunteerAssignment
from app.schemas.help_request import HelpRequestOut
from app.schemas.assignment import AssignmentCreate, AssignmentOut, WithdrawBody

router = APIRouter(prefix="/requests", tags=["Help Requests"])


def _gen_code() -> str:
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(6))


@router.get("", response_model=list[HelpRequestOut])
async def list_requests(
    status: str = "pending",
    limit:  int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.VOLUNTEER)),   # ← volunteers only
):
    try:
        status_enum = RequestStatus(status)
    except ValueError:
        raise HTTPException(400, f"Invalid status '{status}'")
    result = await db.execute(
        select(HelpRequest)
        .where(HelpRequest.status == status_enum)
        .order_by(HelpRequest.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


@router.get("/mine", response_model=list[HelpRequestOut])
async def my_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.REQUESTER)),   # ← requesters only
):
    result = await db.execute(
        select(HelpRequest)
        .where(HelpRequest.requester_id == current_user.id)
        .order_by(HelpRequest.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{request_id}")
async def get_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = await db.get(HelpRequest, request_id)
    if not req:
        raise HTTPException(404, "Request not found")
    assignment = (await db.execute(
        select(VolunteerAssignment).where(VolunteerAssignment.request_id == request_id)
    )).scalar_one_or_none()
    return {
        "request":    HelpRequestOut.model_validate(req).model_dump(),
        "assignment": AssignmentOut.model_validate(assignment).model_dump() if assignment else None,
    }


@router.post("/{request_id}/accept", response_model=AssignmentOut)
async def accept_request(
    request_id: int,
    body: AssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.VOLUNTEER)),
):
    req = await db.get(HelpRequest, request_id)
    if not req or req.status != RequestStatus.PENDING:
        raise HTTPException(400, "Request is not available")
    req.status = RequestStatus.ACCEPTED
    assignment = VolunteerAssignment(
        request_id=request_id,
        volunteer_id=current_user.id,
        eta_minutes=body.eta_minutes,
        meeting_code=_gen_code(),
    )
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)
    return assignment


@router.post("/{request_id}/withdraw", response_model=HelpRequestOut)
async def withdraw_request(
    request_id: int,
    body: WithdrawBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.VOLUNTEER)),
):
    req = await db.get(HelpRequest, request_id)
    if not req:
        raise HTTPException(404, "Request not found")
    assignment = (await db.execute(
        select(VolunteerAssignment).where(VolunteerAssignment.request_id == request_id)
    )).scalar_one_or_none()
    if not assignment or assignment.volunteer_id != current_user.id:
        raise HTTPException(403, "You are not assigned to this request")
    if req.status not in (RequestStatus.ACCEPTED, RequestStatus.IN_PROGRESS):
        raise HTTPException(400, f"Cannot withdraw from a {req.status.value} request")

    await db.execute(delete(VolunteerAssignment).where(VolunteerAssignment.request_id == request_id))
    req.status = RequestStatus.PENDING
    req.cancellation_reason = f"Bénévole retiré : {body.reason}"
    await db.commit()
    await db.refresh(req)
    return req


@router.post("/{request_id}/complete", response_model=HelpRequestOut)
async def complete_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = await db.get(HelpRequest, request_id)
    if not req:
        raise HTTPException(404, "Request not found")

    assignment = (await db.execute(
        select(VolunteerAssignment).where(VolunteerAssignment.request_id == request_id)
    )).scalar_one_or_none()

    is_requester = req.requester_id == current_user.id
    is_volunteer = assignment is not None and assignment.volunteer_id == current_user.id

    if not is_requester and not is_volunteer:
        raise HTTPException(403, "Not authorized to complete this request")

    req.status = RequestStatus.COMPLETED
    await db.commit()
    await db.refresh(req)
    return req


@router.post("/{request_id}/cancel", response_model=HelpRequestOut)
async def cancel_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.REQUESTER)),
):
    req = await db.get(HelpRequest, request_id)
    if not req:
        raise HTTPException(404, "Request not found")
    if req.requester_id != current_user.id:
        raise HTTPException(403, "Only the requester can cancel")
    if req.status in (RequestStatus.COMPLETED, RequestStatus.CANCELLED):
        raise HTTPException(400, f"Cannot cancel a {req.status.value} request")

    await db.execute(delete(VolunteerAssignment).where(VolunteerAssignment.request_id == request_id))
    req.status = RequestStatus.CANCELLED
    await db.commit()
    await db.refresh(req)
    return req
