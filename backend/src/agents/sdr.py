import json
import logging
from typing import Dict, Any

from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.core.config import settings
from src.db.session import engine
from src.models.farm import Farm
from src.models.inventory import FarmInventory
from src.models.outreach import OutreachEmail, OutreachStatus
from src.schemas.agent_sdr import SDRState, RestaurantLead
from src.tools.email_finder import find_decision_maker_email
from src.tools.google_places_api import search_nearby_businesses
from src.tools.review_analyzer import analyze_restaurant_reviews
from src.tools.web_scraper import scrape_website_content

logger = logging.getLogger(__name__)


async def fetch_farm_context_node(state: SDRState) -> Dict[str, Any]:
    """Fetches the Farm details and its inventory for keyword matching."""
    logger.info("Executing fetch_farm_context_node...")
    criteria = state.search_criteria

    farm_name = ""
    inventory = []

    async with AsyncSession(engine) as session:
        farm = await session.get(Farm, criteria.farm_id)
        if not farm:
            return {"errors": [f"Farm not found: {criteria.farm_id}"]}

        farm_name = farm.farm_name

        # Get inventory to use as keywords
        stmt = select(FarmInventory).where(FarmInventory.farm_id == criteria.farm_id)
        items = await session.exec(stmt)
        inventory = [item.crop_name.lower() for item in items.all()]

    if not inventory:
        return {"errors": ["Farm has no inventory listed. Cannot match restaurants."]}

    return {"farm_name": farm_name, "farm_inventory": inventory}


async def search_restaurants_node(state: SDRState) -> Dict[str, Any]:
    """Finds restaurants in the specified radius using Google Places."""
    logger.info("Executing search_restaurants_node...")
    criteria = state.search_criteria

    if state.errors:
        return {}  # Skip if previous errors

    # Convert miles to meters for Google Places
    radius_meters = int(criteria.radius_miles * 1609.34)

    try:
        # Search for restaurants near the farmer
        result = await search_nearby_businesses.ainvoke({
            "location": f"{criteria.latitude},{criteria.longitude}",
            "query": "restaurant",
            "radius_meters": min(radius_meters, 50000),  # Google places max radius is 50km
            "max_results": 10  # limit to save API costs
        })

        leads = []
        for b in result.businesses:
            leads.append(RestaurantLead(
                place_id=b.place_id,
                name=b.name,
                location=b.vicinity,
                website_url=b.website
            ))

        return {"raw_restaurants": leads}

    except Exception as e:
        logger.error(f"Error searching restaurants: {e}")
        return {"errors": [f"Restaurant search failed: {str(e)}"]}


async def scrape_and_match_node(state: SDRState) -> Dict[str, Any]:
    """
    Analyzes restaurants by scraping their site and analyzing reviews 
    to see if they match the farmer's inventory keywords.
    """
    logger.info("Executing scrape_and_match_node...")
    if state.errors:
        return {}

    raw_leads = state.raw_restaurants
    inventory_keywords = state.farm_inventory
    matched_leads = []

    for lead in raw_leads:
        matched_words = []

        # 1. Analyze Reviews for localization intent
        try:
            review_results = await analyze_restaurant_reviews.ainvoke({"place_id": lead.place_id})
            for rv in review_results.reviews:
                if rv.highlighted:
                    lead.relevant_reviews.append(rv.text)
                    if "local" not in matched_words: matched_words.append("local_sourcing")
        except Exception as e:
            logger.error(f"Error analyzing reviews for {lead.name}: {e}")

        # 2. Scrape Website/Menu to find inventory keywords
        if lead.website_url:
            try:
                website_data = await scrape_website_content.ainvoke({"url": lead.website_url})
                if isinstance(website_data, str) and not website_data.startswith('{"error"'):
                    lead.menu_text = website_data[:2000]  # store some context

                    # Simple keyword matching on scraped text
                    website_lower = website_data.lower()
                    for crop in inventory_keywords:
                        if crop in website_lower and crop not in matched_words:
                            matched_words.append(crop)
            except Exception as e:
                logger.error(f"Error scraping site for {lead.name}: {e}")

        if len(matched_words) > 0:
            lead.matched_keywords = matched_words
            lead.match_score = min(100.0, len(matched_words) * 20.0)  # crude scoring
            matched_leads.append(lead)

    return {"matched_restaurants": matched_leads}


async def draft_emails_node(state: SDRState) -> Dict[str, Any]:
    """
    Finds decision maker contact info and drafts the outreach email via LLM. 
    Saves the drafted email to db to await human approval.
    """
    logger.info("Executing draft_emails_node...")
    if state.errors or not state.matched_restaurants:
        return {}

    matched_leads = state.matched_restaurants

    llm = ChatOpenAI(
        model=settings.OPENROUTER_DEFAULT_MODEL,
        temperature=0.7,
        openai_api_key=settings.OPENROUTER_API_KEY,
        base_url=settings.OPENROUTER_BASE_URL
    )

    async with AsyncSession(engine) as session:
        for lead in matched_leads:
            # 1. Find Decision Maker Email
            if lead.website_url:
                try:
                    email_result = await find_decision_maker_email.ainvoke({"domain": lead.website_url})
                    if email_result.contacts:
                        best_contact = email_result.contacts[0]  # taking highest confidence usually
                        lead.decision_maker_email = best_contact.email
                        lead.decision_maker_name = f"{best_contact.first_name} {best_contact.last_name}"
                except Exception as e:
                    logger.warning(f"Failed to find email for {lead.name}: {e}")

            # 2. Look up LinkedIn (Optional context for LLM)
            # if lead.decision_maker_name:
            #     try:
            #         li_result = await search_linkedin_profiles.ainvoke({
            #             "name": lead.decision_maker_name, 
            #             "company": lead.name
            #         })
            #         if li_result.profiles:
            #             lead.decision_maker_linkedin = li_result.profiles[0].link
            #     except Exception as e:
            #         pass

            # If no email is found, we might skip drafting or draft for 'chef@' 
            recipient_email = lead.decision_maker_email or "info@restaurant.com"
            recipient_name = lead.decision_maker_name or "Chef / Procurement Manager"

            # 3. Use LLM to Draft Email
            prompt = f"""
            You are drafting an outreach email for a local farm ({state.farm_name}) to a restaurant ({lead.name}).
            The restaurant's menu / reviews indicate interest in these farm items: {lead.matched_keywords}.
            
            Write a concise, personalized B2B cold email to {recipient_name} at {lead.name}.
            Offer a sample drop-off of the matching items.
            Return ONLY a valid JSON object:
            {{
                "subject": "The email subject line",
                "body": "The plain text email body"
            }}
            """

            try:
                response = await llm.ainvoke([HumanMessage(content=prompt)])
                content = response.content.replace("```json", "").replace("```", "").strip()
                email_data = json.loads(content)

                # 4. Save to Database as Draft
                outreach_email = OutreachEmail(
                    farm_id=state.search_criteria.farm_id,
                    recipient_email=recipient_email,
                    subject=email_data.get("subject", "Local Farm Partnership"),
                    body=email_data.get("body", ""),
                    restaurant_name=lead.name,
                    restaurant_location=lead.location,
                    match_score=lead.match_score,
                    status=OutreachStatus.drafted,
                    menu_keywords_matched=",".join(lead.matched_keywords)
                )

                session.add(outreach_email)
                logger.info(f"Drafted SDR email to {lead.name} ({recipient_email}).")

            except Exception as e:
                logger.error(f"Failed to draft email for {lead.name}: {e}")

        await session.commit()

    return {"matched_restaurants": matched_leads}  # update state


# --- Graph Construction ---

def build_sdr_graph():
    workflow = StateGraph(SDRState)

    workflow.add_node("fetch_farm_context", fetch_farm_context_node)
    workflow.add_node("search_restaurants", search_restaurants_node)
    workflow.add_node("scrape_and_match", scrape_and_match_node)
    workflow.add_node("draft_emails", draft_emails_node)

    workflow.set_entry_point("fetch_farm_context")

    workflow.add_edge("fetch_farm_context", "search_restaurants")
    workflow.add_edge("search_restaurants", "scrape_and_match")
    workflow.add_edge("scrape_and_match", "draft_emails")
    workflow.add_edge("draft_emails", END)

    return workflow.compile()


sdr_agent = build_sdr_graph()
