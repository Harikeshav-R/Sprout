from typing import Optional

from pydantic import BaseModel, Field


class NearbyBusiness(BaseModel):
    """A single business returned by the Places search."""

    name: str
    address: str
    rating: Optional[float] = None
    website: Optional[str] = None
    phone_number: Optional[str] = None
    place_id: str
    latitude: float
    longitude: float
    types: list[str] = Field(default_factory=list)


class PlacesSearchResult(BaseModel):
    """Aggregate result returned by search_nearby_businesses."""

    query: str
    location_input: str
    radius_meters: int
    businesses: list[NearbyBusiness]
    total_found: int
