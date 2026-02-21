import uuid
from typing import List, Optional
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.models.inventory import FarmInventory, FarmInventoryCreate

async def create_inventory(session: AsyncSession, inventory_in: FarmInventoryCreate) -> FarmInventory:
    inventory = FarmInventory.model_validate(inventory_in)
    session.add(inventory)
    await session.commit()
    await session.refresh(inventory)
    return inventory

async def get_inventory(session: AsyncSession, id: uuid.UUID) -> Optional[FarmInventory]:
    return await session.get(FarmInventory, id)

async def get_inventories(
    session: AsyncSession, *, farm_id: Optional[uuid.UUID] = None, offset: int = 0, limit: int = 100
) -> List[FarmInventory]:
    query = select(FarmInventory)
    if farm_id:
        query = query.where(FarmInventory.farm_id == farm_id)
    result = await session.exec(query.offset(offset).limit(limit))
    return result.all()

async def update_inventory(
    session: AsyncSession, *, inventory: FarmInventory, inventory_in: FarmInventoryCreate
) -> FarmInventory:
    update_data = inventory_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(inventory, key, value)
    session.add(inventory)
    await session.commit()
    await session.refresh(inventory)
    return inventory

async def delete_inventory(session: AsyncSession, *, inventory: FarmInventory) -> FarmInventory:
    session.delete(inventory)
    try:
        await session.commit()
    except Exception as e:
        await session.rollback()
        raise e
    return inventory
