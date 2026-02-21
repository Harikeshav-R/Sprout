import uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class TransactionBase(SQLModel):
    farm_id: uuid.UUID = Field(foreign_key="farm.id", index=True)
    crop_name: str = Field(index=True, min_length=1)
    quantity: float = Field(gt=0)
    buyer_name: str = Field(min_length=1)
    transaction_amount: float = Field(gt=0)


class Transaction(TransactionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    transaction_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TransactionCreate(TransactionBase):
    pass


class TransactionRead(TransactionBase):
    id: uuid.UUID
    transaction_date: datetime
