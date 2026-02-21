import uuid
from datetime import datetime

from src.models.farm import FarmBase


class FarmCreate(FarmBase):
    pass


class FarmRead(FarmBase):
    id: uuid.UUID
    created_at: datetime
