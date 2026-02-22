import json
import logging
from typing import List, Dict, Any

from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END

from src.core.config import settings
from src.schemas.agent_discovery import DiscoveryState, CompetitorFarm, DiscoverySearchCriteria
from src.tools.google_places_api import search_nearby_businesses
from src.tools.usda_api import search_all_local_food, FarmersMarketSearchResult, CSASearchResult
from src.tools.web_scraper import analyze_website_visuals
from src.tools.competitor_analysis import analyze_competitor_gap
from src.tools.seo_tools import fetch_local_seo_keywords

logger = logging.getLogger(__name__)


# --- Nodes ---

async def search_usda_node(state: DiscoveryState) -> Dict[str, Any]:
    """
    Queries the USDA API to find local farms to treat as competitors.
    """
    logger.info("Executing search_usda_node...")

    criteria_input = state.search_criteria
    if isinstance(criteria_input, dict):
        criteria = DiscoverySearchCriteria(**criteria_input)
    else:
        criteria = criteria_input

    zip_code = criteria.zip_code
    state_code = criteria.state
    farm_name = criteria.farm_name

    if not zip_code and not state_code:
        return {"errors": ["Missing zip_code or state in search_criteria"]}

    results = await search_all_local_food.ainvoke({
        "zip_code": zip_code,
        "state": state_code,
        "radius_miles": 20
    })

    raw_competitors: List[CompetitorFarm] = []

    # Process Farmers Markets
    fm_result = results.get("farmersmarket")
    if isinstance(fm_result, FarmersMarketSearchResult):
        for listing in fm_result.listings:
            name = listing.listing_name or "Unknown"
            if farm_name.lower() not in name.lower():
                raw_competitors.append(CompetitorFarm(
                    farm_name=name,
                    location_state=state_code or "Unknown", 
                    location_zip=zip_code or "Unknown",     
                    source="usda_market",
                ))

    # Process CSAs
    csa_result = results.get("csa")
    if isinstance(csa_result, CSASearchResult):
        for listing in csa_result.listings:
            name = listing.listing_name or "Unknown"
            if farm_name.lower() not in name.lower():
                raw_competitors.append(CompetitorFarm(
                    farm_name=name,
                    location_state=state_code or "Unknown",
                    location_zip=zip_code or "Unknown",
                    source="usda_csa",
                ))

    logger.info(f"Found {len(raw_competitors)} raw competitors from USDA.")
    return {"raw_competitors": raw_competitors}


async def enrich_competitors_node(state: DiscoveryState) -> Dict[str, Any]:
    """
    Query Google Places to find the competitor's official business listing and website.
    """
    logger.info("Executing enrich_competitors_node...")
    raw_competitors = state.raw_competitors
    enriched_competitors: List[CompetitorFarm] = []

    for comp in raw_competitors:
        query = comp.farm_name
        location = comp.location_zip if comp.location_zip != "Unknown" else f"{comp.location_state}, USA"

        try:
            result = await search_nearby_businesses.ainvoke({
                "location": location,
                "query": query,
                "radius_meters": 5000, 
                "max_results": 1
            })

            if result.businesses:
                match = result.businesses[0]
                comp.google_places_id = match.place_id
                comp.website_url = match.website
                logger.info(f"Matched competitor '{comp.farm_name}' to '{match.name}'")
            else:
                logger.info(f"No Google Place found for '{comp.farm_name}'")

        except Exception as e:
            logger.error(f"Error enriching competitor {comp.farm_name}: {e}")

        enriched_competitors.append(comp)

    return {"enriched_competitors": enriched_competitors}


async def audit_competitors_node(state: DiscoveryState) -> Dict[str, Any]:
    """
    Perform a visual/technical audit to assign a health score to the competitors.
    """
    logger.info("Executing audit_competitors_node...")
    enriched_competitors = state.enriched_competitors
    audited_competitors: List[CompetitorFarm] = []

    llm = ChatOpenAI(
        model=settings.OPENROUTER_DEFAULT_MODEL,
        temperature=0,
        openai_api_key=settings.OPENROUTER_API_KEY,
        base_url=settings.OPENROUTER_BASE_URL
    )

    for comp in enriched_competitors:
        url = comp.website_url

        if not url:
            comp.digital_health_score = 10
            comp.audit_notes = "No website detected. Strong opportunity to outcompete digitally."
            audited_competitors.append(comp)
            continue

        try:
            analysis_result = await analyze_website_visuals.ainvoke({"url": url})

            scoring_prompt = f"""
            You are a Digital Health Auditor analyzing a competitor farm's website.
            
            Visual Analysis:
            "{analysis_result}"
            
            Assign a "Digital Health Score" from 0 to 100 for this competitor.
            - 90-100: Excellent, modern, mobile-responsive, clear CTA.
            - 50-89: Functional but dated or minor issues.
            - 0-49: Broken, non-responsive, missing critical info, or extremely ugly.
            
            Return ONLY a valid JSON object:
            {{
                "score": <int>,
                "summary": "<one sentence summary of the competitor's web presence>"
            }}
            """

            response = await llm.ainvoke([HumanMessage(content=scoring_prompt)])
            content = response.content.replace("```json", "").replace("```", "").strip()

            try:
                score_data = json.loads(content)
                comp.digital_health_score = score_data.get("score", 50)
                comp.audit_notes = score_data.get("summary", "Analyzed via AI.")
            except json.JSONDecodeError:
                comp.digital_health_score = 50 
                comp.audit_notes = "Error parsing AI score."

        except Exception as e:
            logger.error(f"Error auditing {url}: {e}")
            comp.digital_health_score = 20 
            comp.audit_notes = f"Audit failed: {str(e)}"

        audited_competitors.append(comp)

    return {"audited_competitors": audited_competitors}


async def market_gap_node(state: DiscoveryState) -> Dict[str, Any]:
    """
    Executes the analyze_competitor_gap tool to find positioning advantages.
    Requires lat/long, which we'll derive from the farmer's zip or Google Places.
    For simplicity in this node, we use a central zip-based approximation.
    """
    logger.info("Executing market_gap_node...")
    criteria_input = state.search_criteria
    if isinstance(criteria_input, dict):
        criteria = DiscoverySearchCriteria(**criteria_input)
    else:
        criteria = criteria_input
        
    # In a fully complete system, we might Geocode the zip code first.
    # For now, we will pass approximate coordinates or rely on the tool's 
    # internal handling (if it supports text search). The competitor tool 
    # currently takes strict lat/long. 
    # We will query Google Places once to get the user's lat/long based on their zip code.
    
    lat, lng = 0.0, 0.0
    try:
        # HACK: Use our own Google places tool to geocode the zip code
        zip_res = await search_nearby_businesses.ainvoke({
            "location": f"{criteria.zip_code} USA",
            "query": "center",
            "radius_meters": 1000,
            "max_results": 1
        })
        if zip_res.businesses and zip_res.businesses[0].location:
            loc = zip_res.businesses[0].location
            lat = loc.get("lat", 0.0)
            lng = loc.get("lng", 0.0)
    except Exception as e:
        logger.warning(f"Failed to geocode zip code for market gap analysis: {e}")
    
    gap_report = None
    if lat and lng:
        try:
            report_raw = await analyze_competitor_gap.ainvoke({
                "latitude": lat,
                "longitude": lng,
                "farm_name": criteria.farm_name,
                "farm_offerings": criteria.farm_offerings
            })
            gap_report = json.loads(report_raw)
        except Exception as e:
            logger.error(f"Market gap analysis failed: {e}")
            
    return {"market_gap_report": gap_report}


async def generate_seo_node(state: DiscoveryState) -> Dict[str, Any]:
    """
    Generates localized SEO keywords specific to the farmer's offerings.
    """
    logger.info("Executing generate_seo_node...")
    criteria_input = state.search_criteria
    if isinstance(criteria_input, dict):
        criteria = DiscoverySearchCriteria(**criteria_input)
    else:
        criteria = criteria_input

    seo_report = None
    try:
        seo_raw = await fetch_local_seo_keywords.ainvoke({
            "zip_code": criteria.zip_code,
            "farm_type": criteria.farm_offerings
        })
        seo_report = json.loads(seo_raw)
    except Exception as e:
        logger.error(f"SEO Generation failed: {e}")

    return {"seo_report": seo_report}


# --- Graph Construction ---

def build_discovery_graph():
    workflow = StateGraph(DiscoveryState)

    workflow.add_node("search_usda", search_usda_node)
    workflow.add_node("enrich_competitors", enrich_competitors_node)
    workflow.add_node("audit_competitors", audit_competitors_node)
    workflow.add_node("market_gap", market_gap_node)
    workflow.add_node("generate_seo", generate_seo_node)

    workflow.set_entry_point("search_usda")

    workflow.add_edge("search_usda", "enrich_competitors")
    workflow.add_edge("enrich_competitors", "audit_competitors")
    
    # We can run these in sequence after the audit
    workflow.add_edge("audit_competitors", "market_gap")
    workflow.add_edge("market_gap", "generate_seo")
    workflow.add_edge("generate_seo", END)

    return workflow.compile()


discovery_agent = build_discovery_graph()
