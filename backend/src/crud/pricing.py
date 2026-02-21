import uuid
from typing import List, Optional

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.models.pricing import CommodityPricing, CommodityPricingCreate


async def create_pricing(session: AsyncSession, pricing_in: CommodityPricingCreate) -> CommodityPricing:
    pricing = CommodityPricing.model_validate(pricing_in)
    session.add(pricing)
    await session.commit()
    await session.refresh(pricing)
    return pricing


async def get_pricing(session: AsyncSession, id: uuid.UUID) -> Optional[CommodityPricing]:
    return await session.get(CommodityPricing, id)


async def get_pricings(
        session: AsyncSession, *, crop_name: Optional[str] = None, county: Optional[str] = None, offset: int = 0,
        limit: int = 100
) -> List[CommodityPricing]:
    query = select(CommodityPricing)
    if crop_name:
        query = query.where(CommodityPricing.crop_name == crop_name)
    if county:
        query = query.where(CommodityPricing.county == county)
    result = await session.exec(query.offset(offset).limit(limit))
    return result.all()
