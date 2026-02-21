"""Pydantic response models for the Predictive Pricing Analytics pipeline."""

from pydantic import BaseModel


class PricingAnalyticsResult(BaseModel):
    """Output schema for predictive pricing analytics."""

    crop_name: str
    county: str
    data_points: int
    trend_slope: float
    current_average: float
    predicted_next_price: float
    confidence_interval_low: float
    confidence_interval_high: float
    moving_averages: list[float]


class InsufficientDataResult(BaseModel):
    """Returned when there is not enough historical data."""

    crop_name: str
    county: str
    data_points: int
    message: str = "Not enough data for statistical significance"
