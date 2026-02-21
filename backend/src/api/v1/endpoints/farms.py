from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List

from src.db.session import get_session
from src.models.farm import Farm
from src.schemas.farm import FarmCreate, FarmRead

router = APIRouter()

@router.post("/", response_model=FarmRead)
async def create_farm(*, session: AsyncSession = Depends(get_session), farm_in: FarmCreate):
    farm = Farm.model_validate(farm_in)
    session.add(farm)
    await session.commit()
    await session.refresh(farm)
    return farm

@router.get("/", response_model=List[FarmRead])
async def read_farms(session: AsyncSession = Depends(get_session), offset: int = 0, limit: int = 100):
    result = await session.exec(select(Farm).offset(offset).limit(limit))
    return result.all()
