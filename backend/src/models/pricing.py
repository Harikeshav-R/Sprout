import uuid
from datetime import date as datetime_date

from sqlmodel import Field, SQLModel


class CommodityPricingBase(SQLModel):
    crop_name: str = Field(index=True, min_length=1)
    county: str = Field(index=True, min_length=1)
    date: datetime_date = Field(index=True)
    price: float = Field(gt=0)
    unit: str = Field(min_length=1)


from sqlalchemy import UniqueConstraint


class CommodityPricing(CommodityPricingBase, table=True):
    __table_args__ = (UniqueConstraint("crop_name", "county", "date", name="uq_commodity_pricing"),)
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)


class CommodityPricingCreate(CommodityPricingBase):
    pass


class CommodityPricingRead(CommodityPricingBase):
    id: uuid.UUID
