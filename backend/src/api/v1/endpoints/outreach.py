import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel.ext.asyncio.session import AsyncSession
from pydantic import BaseModel

from src.db.session import get_session
from src.models.outreach import OutreachEmailCreate, OutreachEmailRead, OutreachStatus
from src import crud

router = APIRouter()

class OutreachStatusUpdate(BaseModel):
    status: OutreachStatus

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
        
    # Documented transition logic: All transitions are intentionally allowed for manual corrections
    # to support the "Approve & Send" and manual tracking workflow by the farmer.
    return await crud.update_outreach_status(session, outreach=outreach, status=status_update.status)
