from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List

from src.db.session import get_session
from src.models.farm import FarmCreate, FarmRead
from src import crud

router = APIRouter()

@router.post("/", response_model=FarmRead)
async def create_farm(*, session: AsyncSession = Depends(get_session), farm_in: FarmCreate):
    return await crud.create_farm(session, farm_in)

@router.get("/", response_model=List[FarmRead])
async def read_farms(session: AsyncSession = Depends(get_session), offset: int = 0, limit: int = 100):
    return await crud.get_farms(session, offset=offset, limit=limit)
