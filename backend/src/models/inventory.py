import uuid
from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime, timezone

class FarmInventoryBase(SQLModel):
    farm_id: uuid.UUID = Field(foreign_key="farm.id", index=True)
    crop_name: str = Field(index=True, min_length=1)
    quantity: float = Field(ge=0)
    unit: str = Field(min_length=1)
    
from sqlalchemy import UniqueConstraint

class FarmInventory(FarmInventoryBase, table=True):
    __table_args__ = (UniqueConstraint("farm_id", "crop_name", name="uq_farm_inventory_crop"),)
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FarmInventoryCreate(FarmInventoryBase):
    pass

class FarmInventoryUpdate(SQLModel):
    quantity: Optional[float] = Field(default=None, ge=0)
    unit: Optional[str] = Field(default=None, min_length=1)

class FarmInventoryRead(FarmInventoryBase):
    id: uuid.UUID
    last_updated: datetime
