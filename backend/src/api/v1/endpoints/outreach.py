import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession

from src import crud
from src.db.session import get_session
from src.models.outreach import OutreachEmailCreate, OutreachEmailRead, OutreachStatus
from src.services.outreach import FarmContext, RestaurantTarget, draft_outreach_email
from src.tools.email_api import send_approved_email

router = APIRouter()


class OutreachStatusUpdate(BaseModel):
    status: OutreachStatus


class DraftRequest(BaseModel):
    """Request body for AI-drafting an outreach email."""
    farm_id: uuid.UUID
    farm_name: str
    location_state: str
    location_zip: str
    crops: list[str]
    website_url: Optional[str] = None
    restaurant_name: str
    restaurant_location: str
    restaurant_email: str
    menu_keywords_matched: Optional[list[str]] = None
    match_score: Optional[float] = None


@router.post("/", response_model=OutreachEmailRead)
async def create_outreach_email(
        *, session: AsyncSession = Depends(get_session), outreach_in: OutreachEmailCreate
):
    farm = await crud.get_farm(session, outreach_in.farm_id)
    if not farm:
        raise HTTPException(status_code=400, detail="Farm not found")
    return await crud.create_outreach_email(session, outreach_in)


@router.get("/", response_model=List[OutreachEmailRead])
async def read_outreach_emails(
        session: AsyncSession = Depends(get_session),
        farm_id: Optional[uuid.UUID] = None,
        status: Optional[OutreachStatus] = None,
        offset: int = 0,
        limit: int = 100,
):
    return await crud.get_outreach_emails(session, farm_id=farm_id, status=status, offset=offset, limit=limit)


@router.get("/drafts", response_model=List[OutreachEmailRead])
async def list_drafts(
        session: AsyncSession = Depends(get_session),
        farm_id: Optional[uuid.UUID] = None,
        offset: int = 0,
        limit: int = 100,
):
    """List all outreach emails with status DRAFT, ready for human review."""
    return await crud.get_outreach_emails(
        session, farm_id=farm_id, status=OutreachStatus.drafted, offset=offset, limit=limit
    )


@router.post("/drafts", response_model=OutreachEmailRead)
async def create_draft(
        *, session: AsyncSession = Depends(get_session), req: DraftRequest
):
    """AI-generate a personalized outreach email and save it as a DRAFT.

    This is Function A of the human-in-the-loop workflow.
    The email will appear in the dashboard for approval before sending.
    """
    farm = await crud.get_farm(session, req.farm_id)
    if not farm:
        raise HTTPException(status_code=400, detail="Farm not found")

    farm_ctx = FarmContext(
        farm_name=req.farm_name,
        location_state=req.location_state,
        location_zip=req.location_zip,
        crops=req.crops,
        website_url=req.website_url,
    )
    restaurant = RestaurantTarget(
        name=req.restaurant_name,
        location=req.restaurant_location,
        email=req.restaurant_email,
        menu_keywords_matched=req.menu_keywords_matched,
        match_score=req.match_score,
    )

    return await draft_outreach_email(session, req.farm_id, farm_ctx, restaurant)


@router.post("/drafts/{id}/send", response_model=OutreachEmailRead)
async def approve_and_send(
        *, session: AsyncSession = Depends(get_session), id: uuid.UUID
):
    """Approve and send a drafted outreach email via Gmail.

    This is Function B of the human-in-the-loop workflow.
    Only emails in DRAFT status can be sent. The status is updated to SENT
    after successful delivery.
    """
    return await send_approved_email(session, id)


@router.get("/{id}", response_model=OutreachEmailRead)
async def read_outreach_email(
        *, session: AsyncSession = Depends(get_session), id: uuid.UUID
):
    outreach = await crud.get_outreach_email(session, id)
    if not outreach:
        raise HTTPException(status_code=404, detail="Outreach email not found")
    return outreach


@router.put("/{id}/status", response_model=OutreachEmailRead)
async def update_outreach_status(
        *,
        session: AsyncSession = Depends(get_session),
        id: uuid.UUID,
        status_update: OutreachStatusUpdate,
):
    outreach = await crud.get_outreach_email(session, id)
    if not outreach:
        raise HTTPException(status_code=404, detail="Outreach email not found")

    # All transitions are intentionally allowed for manual corrections
    # to support the "Approve & Send" and manual tracking workflow by the farmer.
    return await crud.update_outreach_status(session, outreach=outreach, status=status_update.status)
