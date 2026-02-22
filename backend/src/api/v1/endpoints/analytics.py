from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from src.db.session import get_session
from src.schemas.analytics import PricePredictionResponse
from src.schemas.pricing_analytics import InsufficientDataResult
from src.services.predictive_pricing import PricingAnalyticsService

router = APIRouter()


@router.get("/predictive-pricing", response_model=PricePredictionResponse)
async def predictive_pricing(
        crop_name: str,
        county: str,
        session: AsyncSession = Depends(get_session),
):
    """
    Return a price prediction with a prediction interval for a crop in a
    given county.  The plain-language insight is generated dynamically
    based on the trend slope direction.
    """

    service = PricingAnalyticsService(session)
    result = await service.analyze(crop_name, county)

    if isinstance(result, InsufficientDataResult):
        raise HTTPException(
            status_code=404,
            detail=f"Not enough historical data to generate a prediction for '{crop_name}' in '{county}' "
            f"({result.data_points} data point(s) found, minimum {service.MIN_DATA_POINTS} required).",
        )

    direction = "rising" if result.trend_slope >= 0 else "falling"
    confidence_pct = int(service.CONFIDENCE_LEVEL * 100)

    insight = (
        f"Based on {result.data_points} historical data points, the price trend for "
        f"{crop_name} in {county} is {direction} (slope: {result.trend_slope:+.4f}/day). "
        f"The next projected price is ${result.predicted_next_price:.2f}, with a "
        f"{confidence_pct}% prediction interval of "
        f"${result.prediction_interval_low:.2f}–${result.prediction_interval_high:.2f}."
    )

    return PricePredictionResponse(
        crop_name=crop_name,
        county=county,
        trend_slope=result.trend_slope,
        predicted_price=result.predicted_next_price,
        pi_low=result.prediction_interval_low,
        pi_high=result.prediction_interval_high,
        plain_language_insight=insight,
    )
