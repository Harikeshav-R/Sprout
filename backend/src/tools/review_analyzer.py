"""
Restaurant Review Analyzer Tool
===============================
LangGraph tool for the SDR / Matchmaking pipeline (Phase 2).

Given a Google Place ID, this tool retrieves the most recent reviews
and highlights those mentioning "local", "farm-to-table", or "fresh"
ingredients, helping identify high-conversion leads for the farm.

Architecture rules enforced
----------------------------
- Fully async (httpx.AsyncClient + async def)
- API key from Pydantic Settings only – never os.environ
- Lives in backend/src/tools/ per AGENTS.md
"""

import logging

import httpx
from langchain_core.tools import tool

from src.core.config import settings
from src.schemas.review_analyzer import Review, ReviewAnalysisResult

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# API endpoints
# ---------------------------------------------------------------------------
_PLACE_DETAILS_URL_TEMPLATE = "https://places.googleapis.com/v1/places/{place_id}"

# Fields to retrieve from Google Places Details
_FIELD_MASK = "reviews"


# ---------------------------------------------------------------------------
# Public tool function
# ---------------------------------------------------------------------------

@tool
async def analyze_restaurant_reviews(place_id: str) -> ReviewAnalysisResult:
    """Fetches and analyzes reviews for a specific restaurant (by Google Place ID).
    
    Identifies reviews that mention 'local', 'farm', 'fresh', 'seasonal', or 'organic',
    which indicate a higher likelihood of interest in direct-from-farm sourcing.

    Args:
        place_id: The Google Place ID of the restaurant (e.g., "ChIJ..." from search_nearby_businesses).

    Returns:
        ReviewAnalysisResult: A structured object containing filtered and highlighted reviews.
    """
    if not settings.GOOGLE_MAPS_API_KEY:
        return ReviewAnalysisResult(
            place_id=place_id,
            total_reviews_scanned=0,
            relevant_reviews_found=0,
            reviews=[],
            error="GOOGLE_MAPS_API_KEY is not configured."
        )

    url = _PLACE_DETAILS_URL_TEMPLATE.format(place_id=place_id)

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": settings.GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": _FIELD_MASK,
    }

    # Keywords that suggest the restaurant cares about sourcing
    KEYWORDS = ["local", "farm", "fresh", "seasonal", "organic", "sourcing", "sustainable", "heirloom"]

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)

            if response.status_code != 200:
                return ReviewAnalysisResult(
                    place_id=place_id,
                    total_reviews_scanned=0,
                    relevant_reviews_found=0,
                    reviews=[],
                    error=f"Google Places API error: {response.status_code} - {response.text}"
                )

            data = response.json()
            raw_reviews = data.get("reviews", [])

            processed_reviews = []
            relevant_count = 0

            for r in raw_reviews:
                text_content = r.get("text", {}).get("text", "")
                if not text_content:
                    continue

                # Simple keyword matching
                is_relevant = any(k in text_content.lower() for k in KEYWORDS)
                if is_relevant:
                    relevant_count += 1

                processed_reviews.append(Review(
                    author_name=r.get("authorAttribution", {}).get("displayName", "Anonymous"),
                    rating=r.get("rating", 0),
                    text=text_content,
                    relative_time_description=r.get("relativePublishTimeDescription", ""),
                    original_text=text_content,
                    highlighted=is_relevant
                ))

            # Sort by relevance (highlighted first), then by rating (high to low)
            processed_reviews.sort(key=lambda x: (not x.highlighted, -x.rating))

            return ReviewAnalysisResult(
                place_id=place_id,
                total_reviews_scanned=len(processed_reviews),
                relevant_reviews_found=relevant_count,
                reviews=processed_reviews
            )

        except httpx.RequestError as e:
            logger.error(f"Google Places Review fetch failed: {e}")
            return ReviewAnalysisResult(
                place_id=place_id,
                total_reviews_scanned=0,
                relevant_reviews_found=0,
                reviews=[],
                error=f"Network error: {str(e)}"
            )
