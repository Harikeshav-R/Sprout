import json
import logging
from typing import List, Dict, Any

from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.core.config import settings
from src.db.session import engine
from src.models.farm import Farm
from src.schemas.agent_discovery import DiscoveryState, FarmLead, DiscoverySearchCriteria
from src.tools.google_places_api import search_nearby_businesses
from src.tools.usda_api import search_all_local_food, FarmersMarketSearchResult, CSASearchResult
from src.tools.web_scraper import analyze_website_visuals

logger = logging.getLogger(__name__)


# --- Nodes ---

async def search_usda_node(state: DiscoveryState) -> Dict[str, Any]:
    """
    Queries the USDA API for local food directories (CSA & Farmers Markets).
    """
    logger.info("Executing search_usda_node...")

    # Access state attributes directly
    criteria_input = state.search_criteria

    # Handle both dict and Pydantic object
    if isinstance(criteria_input, dict):
        criteria = DiscoverySearchCriteria(**criteria_input)
    else:
        criteria = criteria_input

    zip_code = criteria.zip_code
    state_code = criteria.state

    if not zip_code and not state_code:
        return {"errors": ["Missing zip_code or state in search_criteria"]}

    # Call the tool directly using ainvoke
    results = await search_all_local_food.ainvoke({
        "zip_code": zip_code,
        "state": state_code,
        "radius_miles": 20
    })

    raw_leads: List[FarmLead] = []

    # Process Farmers Markets
    fm_result = results.get("farmersmarket")
    if isinstance(fm_result, FarmersMarketSearchResult):
        for listing in fm_result.listings:
            # USDA listings name is often the market name, but we treat it as a potential lead
            raw_leads.append(FarmLead(
                farm_name=listing.listing_name or "Unknown",
                location_state=state_code or "Unknown", # USDA result doesn't always have state in listing
                location_zip=zip_code or "Unknown",     # USDA result doesn't always have zip in listing
                source="usda_market",
            ))

    # Process CSAs
    csa_result = results.get("csa")
    if isinstance(csa_result, CSASearchResult):
        for listing in csa_result.listings:
            raw_leads.append(FarmLead(
                farm_name=listing.listing_name or "Unknown",
                location_state=state_code or "Unknown",
                location_zip=zip_code or "Unknown",
                source="usda_csa",
            ))
    

    logger.info(f"Found {len(raw_leads)} raw leads from USDA.")
    # Return a dict to update the state
    return {"raw_leads": raw_leads}


async def enrich_leads_node(state: DiscoveryState) -> Dict[str, Any]:
    """
    For each raw lead, query Google Places to find the official business listing and website.
    """
    logger.info("Executing enrich_leads_node...")
    raw_leads = state.raw_leads
    enriched_leads: List[FarmLead] = []

    # Semantic filter: We only want to enrich "Farms", not "Markets" if possible, 
    # but many farms sell at markets. For now, we enrich everyone.

    for lead in raw_leads:
        # Construct a search query: Name + Zip
        query = lead.farm_name
        location = lead.location_zip if lead.location_zip != "Unknown" else f"{lead.location_state}, USA"

        try:
            # We use the search_nearby_businesses tool to find the specific business
            # We set a small radius and low limit because we are looking for a specific match
            result = await search_nearby_businesses.ainvoke({
                "location": location,
                "query": query,
                "radius_meters": 5000,  # 5km roughly
                "max_results": 1
            })

            if result.businesses:
                match = result.businesses[0]
                # Update lead in place (copy)
                lead.google_places_id = match.place_id
                lead.website_url = match.website
                logger.info(f"Matched '{lead.farm_name}' to '{match.name}' (Web: {match.website})")
            else:
                logger.info(f"No Google Place found for '{lead.farm_name}' in {location}")

        except Exception as e:
            logger.error(f"Error enriching lead {lead.farm_name}: {e}")

        enriched_leads.append(lead)

    return {"enriched_leads": enriched_leads}


async def audit_leads_node(state: DiscoveryState) -> Dict[str, Any]:
    """
    For leads with a website, perform a visual/technical audit to assign a health score.
    """
    logger.info("Executing audit_leads_node...")
    enriched_leads = state.enriched_leads
    audited_leads: List[FarmLead] = []

    llm = ChatOpenAI(
        model="google/gemini-2.5-flash",
        temperature=0,
        openai_api_key=settings.OPENROUTER_API_KEY,
        base_url=settings.OPENROUTER_BASE_URL
    )

    for lead in enriched_leads:
        url = lead.website_url

        if not url:
            # No website = Automatic score of 0 or 10 (very poor)
            lead.digital_health_score = 10
            lead.audit_notes = "No website detected."
            audited_leads.append(lead)
            continue

        try:
            # Use the visual analysis tool
            # Note: In a real high-throughput scenario, we might want to check robots.txt first
            # or use a lighter weight check. For hackathon, we assume visual check is okay.
            analysis_result = await analyze_website_visuals.ainvoke({"url": url})

            # The tool returns a string critique. We need to extract a score.
            # We'll ask the LLM to parse its own critique or just ask it to score based on the critique.

            scoring_prompt = f"""
            You are a Digital Health Auditor.
            Here is a visual analysis of a farm website:
            
            "{analysis_result}"
            
            Based on this analysis, assign a "Digital Health Score" from 0 to 100.
            - 90-100: Excellent, modern, mobile-responsive, clear CTA.
            - 50-89: Functional but dated or minor issues.
            - 0-49: Broken, non-responsive, missing critical info, or extremely ugly.
            
            Return ONLY a valid JSON object:
            {{
                "score": <int>,
                "summary": "<one sentence summary>"
            }}
            """

            response = await llm.ainvoke([HumanMessage(content=scoring_prompt)])
            content = response.content.replace("```json", "").replace("```", "").strip()

            try:
                score_data = json.loads(content)
                lead.digital_health_score = score_data.get("score", 50)
                lead.audit_notes = score_data.get("summary", "Analyzed via AI.")
            except json.JSONDecodeError:
                lead.digital_health_score = 50  # Default fallback
                lead.audit_notes = "Error parsing AI score."

        except Exception as e:
            logger.error(f"Error auditing {url}: {e}")
            lead.digital_health_score = 20  # Penalize for error (likely unreachable)
            lead.audit_notes = f"Audit failed: {str(e)}"

        audited_leads.append(lead)

    return {"audited_leads": audited_leads}


async def save_leads_node(state: DiscoveryState) -> Dict[str, Any]:
    """
    Save processed leads to the PostgreSQL database.
    Only saves leads with a digital health score < 50 (Target Leads).
    """
    logger.info("Executing save_leads_node...")
    audited_leads = state.audited_leads

    async with AsyncSession(engine) as session:
        for lead in audited_leads:
            score = lead.digital_health_score or 100

            # Filter: Only target leads with poor digital health (< 50)
            if score is not None and score < 50:
                # Check if already exists
                statement = select(Farm).where(Farm.farm_name == lead.farm_name)
                existing = await session.exec(statement)
                if existing.first():
                    continue

                new_farm = Farm(
                    farm_name=lead.farm_name,
                    location_state=lead.location_state,
                    location_zip=lead.location_zip,
                    google_places_id=lead.google_places_id,
                    website_url=lead.website_url,
                    digital_health_score=score
                )
                session.add(new_farm)
                logger.info(f"Saved Target Lead: {new_farm.farm_name} (Score: {score})")

        await session.commit()

    return {"audited_leads": audited_leads}  # Pass through


# --- Graph Construction ---

def build_discovery_graph():
    workflow = StateGraph(DiscoveryState)

    workflow.add_node("search_usda", search_usda_node)
    workflow.add_node("enrich_leads", enrich_leads_node)
    workflow.add_node("audit_leads", audit_leads_node)
    workflow.add_node("save_leads", save_leads_node)

    workflow.set_entry_point("search_usda")

    workflow.add_edge("search_usda", "enrich_leads")
    workflow.add_edge("enrich_leads", "audit_leads")
    workflow.add_edge("audit_leads", "save_leads")
    workflow.add_edge("save_leads", END)

    return workflow.compile()


# For easy import and running
discovery_agent = build_discovery_graph()
