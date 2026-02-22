"""
Event Search Tool for finding local food events, farmers markets, and festivals.
"""
from __future__ import annotations

import logging
from typing import Any, Optional

import httpx
from langchain_core.tools import tool

from src.core.config import settings
from src.schemas.events import EventError, LocalEvent, EventResult

logger = logging.getLogger(__name__)


async def _fetch_serp_events(client: httpx.AsyncClient, query: str, location: str) -> dict[str, Any]:
    # Using SerpApi Google Events API or similar
    base_url = f"{settings.SERPAPI_BASE_URL}/search"

    params = {
        "engine": "google_events",
        "q": query,
        "location": location,
        "hl": "en",
        "gl": "us",
        "api_key": settings.SERPAPI_API_KEY
    }

    if not settings.SERPAPI_API_KEY:
        logger.warning("SERPAPI_API_KEY not set. Returning empty results.")
        return {}

    logger.debug("SerpApi GET %s | query=%s location=%s", base_url, query, location)
    response = await client.get(base_url, params=params)
    response.raise_for_status()
    return response.json()


@tool
async def search_local_food_events(
        zip_code: str,
        radius_miles: int = 25,
        client: Optional[httpx.AsyncClient] = None
) -> EventResult | EventError:
    """
    Search for upcoming local food events, farmers markets, and agricultural festivals.
    
    Args:
        zip_code: 5-digit US ZIP code.
        radius_miles: Search radius (approximate, used for context).
        
    Returns:
        EventResult: List of found events.
        EventError: If the search fails.
    """
    if not zip_code:
        return EventError(error="ZIP code is required")

    async def _execute(c: httpx.AsyncClient) -> EventResult | EventError:
        try:
            # We'll search for "farmers markets events" or "food festivals" near the zip code
            # First, we might need a city name from the zip code for better Google Search results,
            # but usually "near {zip_code}" works well enough for Google.

            search_query = "farmers markets and food festivals"
            location_query = f"{zip_code}, United States"

            data = await _fetch_serp_events(c, search_query, location_query)

            events_list = data.get("events_results", [])
            local_events = []

            for event in events_list:
                local_events.append(LocalEvent(
                    title=event.get("title", "Unknown Event"),
                    date=event.get("date", {}).get("when", "Unknown Date"),
                    location=event.get("address", [])[0] if event.get("address") else "Unknown Location",
                    description=event.get("description"),
                    link=event.get("link"),
                    venue=event.get("venue", {}).get("name")
                ))

            return EventResult(
                events=local_events,
                count=len(local_events),
                query_location=location_query,
                query_zip=zip_code
            )

        except httpx.HTTPStatusError as e:
            logger.error(f"SerpApi HTTP error: {e}")
            return EventError(error=f"HTTP {e.response.status_code}", detail=str(e))
        except Exception as e:
            logger.error(f"Error searching events: {e}")
            return EventError(error="Failed to search events", detail=str(e))

    if client:
        return await _execute(client)
    async with httpx.AsyncClient() as c:
        return await _execute(c)
