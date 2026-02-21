from typing import List, Optional
from pydantic import BaseModel

class LinkedInProfile(BaseModel):
    """A potential LinkedIn profile match."""
    title: str
    link: str
    snippet: str

class LinkedInSearchResult(BaseModel):
    """Result of the LinkedIn search."""
    query: str
    profiles: List[LinkedInProfile]
    total_found: int
    error: Optional[str] = None
