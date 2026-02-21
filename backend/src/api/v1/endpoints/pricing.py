import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel.ext.asyncio.session import AsyncSession

from src.db.session import get_session
from src.models.pricing import CommodityPricingCreate, CommodityPricingRead
from src import crud

router = APIRouter()

@router.post("/", response_model=CommodityPricingRead)
async def create_pricing(
    *, session: AsyncSession = Depends(get_session), pricing_in: CommodityPricingCreate
):
    return await crud.create_pricing(session, pricing_in)

@router.get("/", response_model=List[CommodityPricingRead])
async def read_pricings(
    session: AsyncSession = Depends(get_session),
    crop_name: Optional[str] = None,
    county: Optional[str] = None,
    offset: int = 0,
    limit: int = 100,
):
    return await crud.get_pricings(session, crop_name=crop_name, county=county, offset=offset, limit=limit)

@router.get("/{id}", response_model=CommodityPricingRead)
async def read_pricing(
    *, session: AsyncSession = Depends(get_session), id: uuid.UUID
):
    pricing = await crud.get_pricing(session, id)
    if not pricing:
        raise HTTPException(status_code=404, detail="Pricing record not found")
    return pricing
