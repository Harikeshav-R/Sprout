from typing import List, Optional
from pydantic import BaseModel

class EventError(BaseModel):
    source: str = "event_search"
    error: str
    detail: Optional[str] = None

class LocalEvent(BaseModel):
    title: str
    date: str
    location: str
    description: Optional[str] = None
    link: Optional[str] = None
    venue: Optional[str] = None

class EventResult(BaseModel):
    events: List[LocalEvent]
    count: int
    query_location: str
    query_zip: Optional[str] = None
