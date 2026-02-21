import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel.ext.asyncio.session import AsyncSession

from src.db.session import get_session
from src.models.transaction import TransactionCreate, TransactionRead
from src import crud

router = APIRouter()

@router.post("/", response_model=TransactionRead)
async def create_transaction(
    *, session: AsyncSession = Depends(get_session), transaction_in: TransactionCreate
):
    return await crud.create_transaction(session, transaction_in)

@router.get("/", response_model=List[TransactionRead])
async def read_transactions(
    session: AsyncSession = Depends(get_session),
    farm_id: Optional[uuid.UUID] = None,
    offset: int = 0,
    limit: int = 100,
):
    return await crud.get_transactions(session, farm_id=farm_id, offset=offset, limit=limit)

@router.get("/{id}", response_model=TransactionRead)
async def read_transaction(
    *, session: AsyncSession = Depends(get_session), id: uuid.UUID
):
    transaction = await crud.get_transaction(session, id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction
