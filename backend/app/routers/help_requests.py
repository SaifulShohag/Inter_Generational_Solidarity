from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.dependencies import get_db, get_current_user
from app.models.user import User, UserRole
from app.models.help_request import HelpRequest, RequestStatus
from app.models.assignment import VolunteerAssignment
from app.schemas.help_request import HelpRequestOut, AssignedMissionOut
from app.schemas.assignment import AssignmentCreate, AssignmentOut

router = APIRouter(prefix="/requests", tags=["Help Requests"])


def _with_name(req: HelpRequest, name: str | None) -> HelpRequestOut:
    return HelpRequestOut.model_validate(req).model_copy(update={"requester_name": name})


@router.get("", response_model=list[HelpRequestOut])
async def list_requests(
    status: str = "pending",
    limit:  int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        status_enum = RequestStatus(status)
    except ValueError:
        raise HTTPException(400, f"Invalid status '{status}'")

    result = await db.execute(
        select(HelpRequest, User.name.label("requester_name"))
        .join(User, HelpRequest.requester_id == User.id, isouter=True)
        .where(HelpRequest.status == status_enum)
        .order_by(HelpRequest.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return [_with_name(req, name) for req, name in result.all()]


@router.get("/mine", response_model=list[HelpRequestOut])
async def my_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(HelpRequest)
        .where(HelpRequest.requester_id == current_user.id)
        .order_by(HelpRequest.created_at.desc())
    )
    return result.scalars().all()


@router.get("/assigned-to-me", response_model=list[AssignedMissionOut])
async def assigned_to_me(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    RequesterUser = User.__table__.alias("requester_user")
    result = await db.execute(
        select(HelpRequest, VolunteerAssignment, RequesterUser.c.name.label("requester_name"))
        .join(VolunteerAssignment, HelpRequest.id == VolunteerAssignment.request_id)
        .join(RequesterUser, HelpRequest.requester_id == RequesterUser.c.id, isouter=True)
        .where(VolunteerAssignment.volunteer_id == current_user.id)
        .order_by(HelpRequest.updated_at.desc())
    )
    out = []
    for req, assignment, rname in result.all():
        item = HelpRequestOut.model_validate(req).model_copy(update={"requester_name": rname})
        out.append(AssignedMissionOut(
            **item.model_dump(),
            accepted_at=assignment.accepted_at,
            completed_at=assignment.completed_at,
        ))
    return out


@router.get("/{request_id}")
async def get_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = await db.get(HelpRequest, request_id)
    if not req:
        raise HTTPException(404, "Request not found")
    assignment = (await db.execute(
        select(VolunteerAssignment).where(VolunteerAssignment.request_id == request_id)
    )).scalar_one_or_none()
    return {
        "request":    HelpRequestOut.model_validate(req).model_dump(),
        "assignment": AssignmentOut.model_validate(assignment).model_dump() if assignment else None
    }


@router.post("/{request_id}/accept", response_model=AssignmentOut)
async def accept_request(
    request_id: int,
    body: AssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.VOLUNTEER:
        raise HTTPException(403, "Only volunteers can accept requests")
    req = await db.get(HelpRequest, request_id)
    if not req or req.status != RequestStatus.PENDING:
        raise HTTPException(400, "Request is not available")
    req.status = RequestStatus.ACCEPTED
    assignment = VolunteerAssignment(
        request_id=request_id,
        volunteer_id=current_user.id,
        eta_minutes=body.eta_minutes
    )
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)
    return assignment


@router.post("/{request_id}/complete", response_model=HelpRequestOut)
async def complete_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
    current_user: User = Depends(get_current_user)
):
    req = await db.get(HelpRequest, request_id)
    if not req:
        raise HTTPException(404, "Request not found")
    if req.requester_id != current_user.id:
        raise HTTPException(403, "Only the requester can cancel")
    if req.status in (RequestStatus.COMPLETED, RequestStatus.CANCELLED):
        raise HTTPException(400, f"Cannot cancel a {req.status.value} request")
    req.status = RequestStatus.CANCELLED
    await db.commit()
    await db.refresh(req)
    return req
