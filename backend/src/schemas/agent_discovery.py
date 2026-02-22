from typing import List, Optional, Union, Dict, Any

from pydantic import BaseModel, ConfigDict, Field


class CompetitorFarm(BaseModel):
    """
    Represents a local competitor farm for benchmarking.
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
    farm_name: str
    farm_offerings: str
    zip_code: str
    state: str


class DiscoveryState(BaseModel):
    """
    State definition for the LangGraph Discovery workflow.
    """
    search_criteria: Union[DiscoverySearchCriteria, dict] = Field(default_factory=dict)

    raw_competitors: List[CompetitorFarm] = Field(default_factory=list)
    enriched_competitors: List[CompetitorFarm] = Field(default_factory=list)
    audited_competitors: List[CompetitorFarm] = Field(default_factory=list)

    # Reports
    market_gap_report: Optional[Dict[str, Any]] = None
    seo_report: Optional[Dict[str, Any]] = None

    errors: List[str] = Field(default_factory=list)

    model_config = ConfigDict(arbitrary_types_allowed=True)
