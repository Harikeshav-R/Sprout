from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AnalyticsSearchCriteria(BaseModel):
    farm_id: UUID
    target_crops: List[str]
    county: str
    zip_code: str
    state: str


class CropPrediction(BaseModel):
    crop_name: str
    current_average_price: float
    trend_slope: float
    predicted_next_price: float
    pi_low: float
    pi_high: float
    data_points_analyzed: int
    moving_averages: List[float] = []


class AnalyticsState(BaseModel):
    search_criteria: AnalyticsSearchCriteria
    
    historical_prices: Dict[str, Any] = Field(default_factory=dict)
    weather_data: Optional[Dict[str, Any]] = None
    event_data: Optional[Dict[str, Any]] = None
    
    predictions: List[CropPrediction] = Field(default_factory=list)
    insights: List[str] = Field(default_factory=list)
    
    errors: List[str] = Field(default_factory=list)

    model_config = ConfigDict(arbitrary_types_allowed=True)
