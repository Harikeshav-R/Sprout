from pydantic import BaseModel


class PricePredictionResponse(BaseModel):
    """Response schema for the predictive pricing endpoint."""

    crop_name: str
    county: str
    trend_slope: float
    predicted_price: float
    ci_low: float
    ci_high: float
    plain_language_insight: str
