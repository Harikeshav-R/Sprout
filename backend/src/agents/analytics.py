import json
import logging
from typing import Dict, Any

from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from sqlmodel.ext.asyncio.session import AsyncSession

from src.core.config import settings
from src.db.session import engine
from src.schemas.agent_analytics import AnalyticsState, AnalyticsSearchCriteria, CropPrediction
from src.services.predictive_pricing import PricingAnalyticsService
from src.schemas.pricing_analytics import PricingAnalyticsResult
from src.tools.weather import fetch_agricultural_weather
from src.tools.events import search_local_food_events

logger = logging.getLogger(__name__)


async def start_node(state: AnalyticsState) -> Dict[str, Any]:
    """
    Dummy entry point to fork parallel execution.
    """
    return {}


async def predictive_modeling_node(state: AnalyticsState) -> Dict[str, Any]:
    """
    Uses PricingAnalyticsService to query PostgreSQL and calculate regressions.
    """
    logger.info("Executing predictive_modeling_node...")
    criteria = state.search_criteria
    if isinstance(criteria, dict):
        criteria = AnalyticsSearchCriteria(**criteria)

    predictions = []
    
    async with AsyncSession(engine) as session:
        service = PricingAnalyticsService(session)
        
        for crop in criteria.target_crops:
            # PricingAnalyticsService handles db querying and scipy modeling securely
            result = await service.analyze(crop_name=crop, county=criteria.county)
            
            if isinstance(result, PricingAnalyticsResult):
                predictions.append(CropPrediction(
                    crop_name=result.crop_name,
                    current_average_price=result.current_average,
                    trend_slope=result.trend_slope,
                    predicted_next_price=result.predicted_next_price,
                    pi_low=result.prediction_interval_low,
                    pi_high=result.prediction_interval_high,
                    data_points_analyzed=result.data_points,
                    moving_averages=result.moving_averages
                ))
            else:
                logger.info(f"Insufficient data for {crop}: {result.message}")

    if not predictions:
        return {"errors": ["No significant predictions could be generated due to insufficient data."]}
        
    return {"predictions": predictions}


async def fetch_market_context_node(state: AnalyticsState) -> Dict[str, Any]:
    """
    Fetches environmental and event context that could impact prices.
    """
    logger.info("Executing fetch_market_context_node...")
    if state.errors:
        return {}
        
    criteria = state.search_criteria
    if isinstance(criteria, dict):
        criteria = AnalyticsSearchCriteria(**criteria)

    weather, events = None, None
    
    try:
        weather_res = await fetch_agricultural_weather.ainvoke({"zip_code": criteria.zip_code})
        if not hasattr(weather_res, 'error'):
            weather = weather_res.model_dump()
    except Exception as e:
        logger.warning(f"Failed to fetch weather: {e}")

    try:
        events_res = await search_local_food_events.ainvoke({
            "zip_code": criteria.zip_code, 
            "radius_miles": 30
        })
        if not hasattr(events_res, 'error'):
            events = events_res.model_dump()
    except Exception as e:
        logger.warning(f"Failed to fetch events: {e}")
        
    return {"weather_data": weather, "event_data": events}


async def insight_generation_node(state: AnalyticsState) -> Dict[str, Any]:
    """
    Synthesizes the strict math models (predictions) with environmental context 
    into actionable plain-language insights for the farmer using an LLM.
    """
    logger.info("Executing insight_generation_node...")
    if state.errors or not state.predictions:
        return {}
        
    predictions = state.predictions
    weather = state.weather_data
    events = state.event_data
    
    llm = ChatOpenAI(
        model=settings.OPENROUTER_DEFAULT_MODEL,
        temperature=0.3,
        openai_api_key=settings.OPENROUTER_API_KEY,
        base_url=settings.OPENROUTER_BASE_URL
    )
    
    preds_str = json.dumps([p.model_dump() for p in predictions], indent=2)
    
    prompt = f"""
    You are an Agricultural Market Analyst providing actionable insights for a local farmer.
    
    STATISTICAL PREDICTIONS (95% Confidence Intervals):
    {preds_str}
    
    LOCAL WEATHER TRENDS:
    {json.dumps(weather) if weather else "N/A"}
    
    LOCAL EVENTS/FESTIVALS:
    {json.dumps(events) if events else "N/A"}
    
    Create a list of 2-3 plain-language, highly actionable insights. Use the exact statistical data provided.
    For example: "There is a 95% probability that organic zucchini prices will rise by 12% in the next three weeks based on local scarcity."
    Incorporate upcoming weather (if adverse) or local events (if they represent demand opportunities) into your reasoning.
    
    Return the result as a raw JSON list of strings (no markdown wrapping).
    Example:
    [
      "Insight 1 text...",
      "Insight 2 text..."
    ]
    """
    
    insights = []
    try:
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        content = response.content.replace("```json", "").replace("```", "").strip()
        insights = json.loads(content)
        if not isinstance(insights, list):
            insights = [str(insights)]
    except Exception as e:
        logger.error(f"Insight generation failed: {e}")
        insights = ["Data calculated successfully, but AI insight generation failed."]
        
    return {"insights": insights}


# --- Graph Construction ---

def build_analytics_graph():
    workflow = StateGraph(AnalyticsState)
    
    workflow.add_node("start", start_node)
    workflow.add_node("predictive_modeling", predictive_modeling_node)
    workflow.add_node("fetch_market_context", fetch_market_context_node)
    workflow.add_node("insight_generation", insight_generation_node)
    
    workflow.set_entry_point("start")
    
    workflow.add_edge("start", "predictive_modeling")
    workflow.add_edge("start", "fetch_market_context")
    
    workflow.add_edge("predictive_modeling", "insight_generation")
    workflow.add_edge("fetch_market_context", "insight_generation")
    
    workflow.add_edge("insight_generation", END)
    
    return workflow.compile()


analytics_agent = build_analytics_graph()
