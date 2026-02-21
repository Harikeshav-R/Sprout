from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from src.db.session import get_session
from src.schemas.analytics import PricePredictionResponse
from src.services.predictive_pricing import get_price_prediction

router = APIRouter()


@router.get("/predictive-pricing", response_model=PricePredictionResponse)
async def predictive_pricing(
    crop_name: str,
    county: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Return a price prediction with confidence intervals for a crop in a
    given county.  The plain-language insight is generated dynamically
    based on the trend slope direction.
    """

    prediction = await get_price_prediction(session, crop_name, county)

    if prediction is None:
        raise HTTPException(
            status_code=404,
            detail=f"Not enough data to generate a prediction for '{crop_name}' in '{county}'.",
        )

    direction = "rise" if prediction["trend_slope"] >= 0 else "fall"

    insight = (
        f"There is a 95% probability the price for {crop_name} will "
        f"{direction} to ${prediction['predicted_price']:.2f} next month "
        f"based on historical trends."
    )

    return PricePredictionResponse(
        crop_name=crop_name,
        county=county,
        trend_slope=prediction["trend_slope"],
        predicted_price=prediction["predicted_price"],
        ci_low=prediction["ci_low"],
        ci_high=prediction["ci_high"],
        plain_language_insight=insight,
    )
