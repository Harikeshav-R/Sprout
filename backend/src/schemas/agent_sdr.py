from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SDRSearchCriteria(BaseModel):
    farm_id: UUID
    latitude: float
    longitude: float
    radius_miles: int = 30


class RestaurantLead(BaseModel):
    place_id: str
    name: str
    location: str
    website_url: Optional[str] = None
    menu_text: Optional[str] = None

    # Matching metadata
    matched_keywords: List[str] = []
    match_score: float = 0.0

    # Contact metadata
    decision_maker_name: Optional[str] = None
    decision_maker_email: Optional[str] = None
    decision_maker_linkedin: Optional[str] = None

    # Review highlighting
    relevant_reviews: List[str] = []


class SDRState(BaseModel):
    search_criteria: SDRSearchCriteria
    farm_name: str = ""
    farm_inventory: List[str] = []

    raw_restaurants: List[RestaurantLead] = []
    matched_restaurants: List[RestaurantLead] = []

    # This will allow us to track success/failures of step runs
    errors: List[str] = []

    model_config = ConfigDict(arbitrary_types_allowed=True)
