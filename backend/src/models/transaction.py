import uuid
from sqlmodel import Field, SQLModel
from datetime import datetime, timezone

class TransactionBase(SQLModel):
    farm_id: uuid.UUID = Field(foreign_key="farm.id", index=True)
    crop_name: str = Field(index=True)
    quantity: float
    buyer_name: str
    transaction_amount: float

class Transaction(TransactionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    transaction_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TransactionCreate(TransactionBase):
    pass

class TransactionRead(TransactionBase):
    id: uuid.UUID
    transaction_date: datetime
