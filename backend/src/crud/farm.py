import uuid
from typing import List, Optional

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.models.farm import Farm
from src.schemas.farm import FarmCreate


async def create_farm(session: AsyncSession, farm_in: FarmCreate) -> Farm:
    farm = Farm.model_validate(farm_in)
    session.add(farm)
    await session.commit()
    await session.refresh(farm)
    return farm


async def get_farm(session: AsyncSession, id: uuid.UUID) -> Optional[Farm]:
    return await session.get(Farm, id)


async def get_farms(
        session: AsyncSession, *, offset: int = 0, limit: int = 100
) -> List[Farm]:
    result = await session.exec(select(Farm).offset(offset).limit(limit))
    return result.all()
