from typing import List, Optional

from pydantic import BaseModel


class EmailContact(BaseModel):
    """Represents a single email contact found for a domain."""
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    position: Optional[str] = None
    confidence: Optional[int] = None
    type: Optional[str] = None  # personal or generic
    linkedin: Optional[str] = None
    twitter: Optional[str] = None


class EmailSearchResult(BaseModel):
    """Result of an email search for a specific domain."""
    domain: str
    organization: Optional[str] = None
    contacts: List[EmailContact] = []
    total_found: int = 0
    error: Optional[str] = None
