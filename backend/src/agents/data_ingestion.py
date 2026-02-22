"""
Data Ingestion LangGraph Agent

Pipeline:
1. fetch_pricing_node — Uses fetch_usda_ams_pricing tool to get latest pricing
2. persist_pricing_node — Bulk-inserts fetched data into CommodityPricing (skip duplicates)
3. trigger_analytics_node — Triggers the analytics_agent to re-analyze with new data
"""

import logging
from datetime import date
from typing import Any, Dict, List
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from langgraph.graph import StateGraph, END
from sqlalchemy import text
from sqlmodel.ext.asyncio.session import AsyncSession

from src.db.session import engine
from src.schemas.market_news import MarketPriceResult
from src.tools.market_news import fetch_usda_ams_pricing

logger = logging.getLogger(__name__)


class IngestionState(BaseModel):
    farm_id: UUID
    target_crops: List[str]
    county: str
    zip_code: str

    fetched_prices: List[dict] = Field(default_factory=list)
    persisted_count: int = 0
    errors: List[str] = Field(default_factory=list)

    # Analytics results (populated by trigger_analytics_node)
    analytics_predictions: List[dict] = Field(default_factory=list)
    analytics_insights: List[str] = Field(default_factory=list)

    model_config = ConfigDict(arbitrary_types_allowed=True)


async def fetch_pricing_node(state: IngestionState) -> Dict[str, Any]:
    """Fetch pricing data for each target crop using the USDA market news tool."""
    logger.info("Fetching pricing data for crops: %s", state.target_crops)
    all_prices: List[dict] = []
    errors: List[str] = []

    for crop in state.target_crops:
        try:
            result = await fetch_usda_ams_pricing.ainvoke(
                {"commodity": crop, "zip_code": state.zip_code}
            )
            if isinstance(result, MarketPriceResult) and result.prices:
                for p in result.prices:
                    all_prices.append({
                        "crop_name": crop,
                        "county": state.county,
                        "date": p.date,
                        "price": p.avg_price if p.avg_price else (p.low_price + p.high_price) / 2,
                        "unit": p.unit,
                    })
                logger.info("Fetched %d prices for %s", len(result.prices), crop)
            else:
                msg = f"No pricing data returned for {crop}"
                logger.warning(msg)
                errors.append(msg)
        except Exception as e:
            msg = f"Failed to fetch pricing for {crop}: {e}"
            logger.error(msg)
            errors.append(msg)

    return {"fetched_prices": all_prices, "errors": errors}


async def persist_pricing_node(state: IngestionState) -> Dict[str, Any]:
    """Bulk-insert fetched pricing data into CommodityPricing, skipping duplicates."""
    if not state.fetched_prices:
        logger.info("No fetched prices to persist.")
        return {"persisted_count": 0}

    logger.info("Persisting %d pricing records...", len(state.fetched_prices))

    # Normalize date strings to date objects for the DB
    records = []
    for p in state.fetched_prices:
        record_date = p["date"]
        if isinstance(record_date, str):
            record_date = date.fromisoformat(record_date)
        records.append({
            "crop_name": p["crop_name"],
            "county": p["county"],
            "date": record_date,
            "price": round(float(p["price"]), 2),
            "unit": p["unit"],
        })

    async with AsyncSession(engine) as session:
        stmt = text("""
            INSERT INTO commoditypricing (id, crop_name, county, date, price, unit)
            VALUES (gen_random_uuid(), :crop_name, :county, :date, :price, :unit)
            ON CONFLICT ON CONSTRAINT uq_commodity_pricing DO NOTHING
        """)
        await session.exec(stmt, params=records)  # type: ignore[arg-type]
        await session.commit()

    logger.info("Persisted up to %d records (duplicates skipped).", len(records))
    return {"persisted_count": len(records)}


async def trigger_analytics_node(state: IngestionState) -> Dict[str, Any]:
    """Trigger the analytics agent to re-analyze with newly ingested data."""
    from src.agents.analytics import analytics_agent
    from src.schemas.agent_analytics import AnalyticsSearchCriteria, AnalyticsState

    logger.info("Triggering analytics agent for %s in %s...", state.target_crops, state.county)

    criteria = AnalyticsSearchCriteria(
        farm_id=state.farm_id,
        target_crops=state.target_crops,
        county=state.county,
        zip_code=state.zip_code,
        state="OR",
    )

    try:
        analytics_result = await analytics_agent.ainvoke(
            {"search_criteria": criteria}
        )

        predictions = []
        if analytics_result.get("predictions"):
            predictions = [p.model_dump() if hasattr(p, "model_dump") else p for p in analytics_result["predictions"]]

        insights = analytics_result.get("insights", [])
        errors = analytics_result.get("errors", [])

        logger.info(
            "Analytics complete: %d predictions, %d insights",
            len(predictions),
            len(insights),
        )

        return {
            "analytics_predictions": predictions,
            "analytics_insights": insights,
            "errors": state.errors + errors,
        }
    except Exception as e:
        msg = f"Analytics agent failed: {e}"
        logger.error(msg)
        return {"errors": state.errors + [msg]}


# --- Graph Construction ---

def build_ingestion_graph():
    workflow = StateGraph(IngestionState)

    workflow.add_node("fetch_pricing", fetch_pricing_node)
    workflow.add_node("persist_pricing", persist_pricing_node)
    workflow.add_node("trigger_analytics", trigger_analytics_node)

    workflow.set_entry_point("fetch_pricing")
    workflow.add_edge("fetch_pricing", "persist_pricing")
    workflow.add_edge("persist_pricing", "trigger_analytics")
    workflow.add_edge("trigger_analytics", END)

    return workflow.compile()


data_ingestion_agent = build_ingestion_graph()
