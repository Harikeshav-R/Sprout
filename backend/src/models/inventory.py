import uuid
from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime, timezone

class FarmInventoryBase(SQLModel):
    farm_id: uuid.UUID = Field(foreign_key="farm.id", index=True)
    crop_name: str = Field(index=True)
    quantity: float
    unit: str
    
class FarmInventory(FarmInventoryBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FarmInventoryCreate(FarmInventoryBase):
    pass

class FarmInventoryRead(FarmInventoryBase):
    id: uuid.UUID
    last_updated: datetime
