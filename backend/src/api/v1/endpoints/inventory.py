import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.exc import IntegrityError

from src.db.session import get_session
from src.models.inventory import FarmInventoryCreate, FarmInventoryRead, FarmInventoryUpdate
from src import crud

router = APIRouter()

@router.post("/", response_model=FarmInventoryRead)
async def create_inventory(
    *, session: AsyncSession = Depends(get_session), inventory_in: FarmInventoryCreate
):
    farm = await crud.get_farm(session, inventory_in.farm_id)
    if not farm:
        raise HTTPException(status_code=400, detail="Farm not found")
    try:
        return await crud.create_inventory(session, inventory_in)
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=400, detail="Inventory item for this farm and crop already exists")

@router.get("/", response_model=List[FarmInventoryRead])
async def read_inventories(
    session: AsyncSession = Depends(get_session),
    farm_id: Optional[uuid.UUID] = None,
    offset: int = 0,
    limit: int = 100,
):
    return await crud.get_inventories(session, farm_id=farm_id, offset=offset, limit=limit)

@router.get("/{id}", response_model=FarmInventoryRead)
async def read_inventory(
    *, session: AsyncSession = Depends(get_session), id: uuid.UUID
):
    inventory = await crud.get_inventory(session, id)
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    return inventory

@router.put("/{id}", response_model=FarmInventoryRead)
async def update_inventory(
    *,
    session: AsyncSession = Depends(get_session),
    id: uuid.UUID,
    inventory_in: FarmInventoryUpdate,
):
    inventory = await crud.get_inventory(session, id)
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    try:
        return await crud.update_inventory(session, inventory=inventory, inventory_in=inventory_in)
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=400, detail="Database integrity error")

@router.delete("/{id}")
async def delete_inventory(
    *, session: AsyncSession = Depends(get_session), id: uuid.UUID
):
    inventory = await crud.get_inventory(session, id)
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    await crud.delete_inventory(session, inventory=inventory)
    return {"ok": True}
