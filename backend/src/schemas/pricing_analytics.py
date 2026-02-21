"""Re-export analytics result models for use in API endpoints."""

from src.services.predictive_pricing import (
    InsufficientDataResult,
    PricingAnalyticsResult,
)

__all__ = ["PricingAnalyticsResult", "InsufficientDataResult"]
