import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession

from src.db.session import get_session
from src.schemas.analytics import PricePredictionResponse
from src.schemas.pricing_analytics import InsufficientDataResult
from src.services.predictive_pricing import PricingAnalyticsService

router = APIRouter()


class AnalyticsPipelineRequest(BaseModel):
    farm_id: uuid.UUID
    county: str
    zip_code: str
    target_crops: List[str]


class AnalyticsPipelineResponse(BaseModel):
    predictions: List[dict] = []
    insights: List[str] = []
    persisted_count: int = 0
    errors: List[str] = []


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


@router.post("/run", response_model=AnalyticsPipelineResponse)
async def run_analytics_pipeline(body: AnalyticsPipelineRequest):
    """
    Trigger the full analytics pipeline:
    1. Ingest latest pricing data (fetch from USDA / mock)
    2. Persist to CommodityPricing table
    3. Run predictive modeling via analytics agent
    4. Generate LLM-powered insights

    Returns predictions, insights, and any errors.
    """
    from src.agents.data_ingestion import data_ingestion_agent

    result = await data_ingestion_agent.ainvoke({
        "farm_id": body.farm_id,
        "target_crops": body.target_crops,
        "county": body.county,
        "zip_code": body.zip_code,
    })

    return AnalyticsPipelineResponse(
        predictions=result.get("analytics_predictions", []),
        insights=result.get("analytics_insights", []),
        persisted_count=result.get("persisted_count", 0),
        errors=result.get("errors", []),
    )
