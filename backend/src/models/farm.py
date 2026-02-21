import uuid
from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime, timezone

class FarmBase(SQLModel):
    farm_name: str = Field(index=True)
    location_state: str = Field(index=True)
    location_zip: str = Field(index=True)
    google_places_id: Optional[str] = None
    website_url: Optional[str] = None
    digital_health_score: Optional[int] = None

class Farm(FarmBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
