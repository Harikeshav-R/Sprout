import uuid
from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime, timezone
import enum
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import ENUM

class OutreachStatus(str, enum.Enum):
    drafted = "Drafted"
    sent = "Sent"
    opened = "Opened"
    replied = "Replied"
    converted = "Converted"

class OutreachEmailBase(SQLModel):
    farm_id: uuid.UUID = Field(foreign_key="farm.id", index=True)
    restaurant_name: str
    restaurant_location: str
    match_score: Optional[float] = None
    status: OutreachStatus = Field(
        sa_column=Column(ENUM(OutreachStatus, name="outreachstatus_enum", create_type=True))
    )
    draft_content: str
    menu_keywords_matched: Optional[str] = None

class OutreachEmail(OutreachEmailBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OutreachEmailCreate(OutreachEmailBase):
    pass

class OutreachEmailRead(OutreachEmailBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
