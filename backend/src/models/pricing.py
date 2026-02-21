import uuid
from sqlmodel import Field, SQLModel
from datetime import date as datetime_date

class CommodityPricingBase(SQLModel):
    crop_name: str = Field(index=True)
    county: str = Field(index=True)
    date: datetime_date = Field(index=True)
    price: float
    unit: str

class CommodityPricing(CommodityPricingBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

class CommodityPricingCreate(CommodityPricingBase):
    pass

class CommodityPricingRead(CommodityPricingBase):
    id: uuid.UUID
