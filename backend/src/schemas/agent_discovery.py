from typing import List, Optional, Union

from pydantic import BaseModel, Field


class FarmLead(BaseModel):
    """
    Represents a single farm lead moving through the discovery pipeline.
    """
    farm_name: str
    location_state: str
    location_zip: str
    source: str  # "usda_csa" or "usda_market"
    google_places_id: Optional[str] = None
    website_url: Optional[str] = None
    digital_health_score: Optional[int] = None
    audit_notes: Optional[str] = None


class DiscoverySearchCriteria(BaseModel):
    """
    Input criteria for the discovery process.
    """
    zip_code: Optional[str] = None
    state: Optional[str] = None


class DiscoveryState(BaseModel):
    """
    State definition for the LangGraph Discovery workflow.
    """
    search_criteria: Union[DiscoverySearchCriteria, dict] = Field(default_factory=dict)
    raw_leads: List[FarmLead] = Field(default_factory=list)
    enriched_leads: List[FarmLead] = Field(default_factory=list)
    audited_leads: List[FarmLead] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)
