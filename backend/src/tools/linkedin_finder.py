"""
LinkedIn Profile Search Tool
============================
LangGraph tool for the SDR / Matchmaking pipeline (Phase 2).

Given a person's name and/or company, this tool searches for their
LinkedIn profile to facilitate personalized outreach.
It uses SerpApi's Google Search engine.

Architecture rules enforced
----------------------------
- Fully async (httpx.AsyncClient + async def)
- API key from Pydantic Settings (SERPAPI_API_KEY)
- Lives in backend/src/tools/ per AGENTS.md
"""

import logging
from typing import Optional

import httpx
from langchain_core.tools import tool

from src.core.config import settings
from src.schemas.linkedin_finder import LinkedInProfile, LinkedInSearchResult

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Public tool function
# ---------------------------------------------------------------------------

@tool
async def search_linkedin_profiles(name: str, company: Optional[str] = None) -> LinkedInSearchResult:
    """Searches for a person's LinkedIn profile.

    Useful for finding the 'Executive Chef' or 'Owner' of a restaurant to
    personalize outreach emails.

    Args:
        name: The person's name (e.g., "Thomas Keller").
        company: (Optional) The company or restaurant name (e.g., "The French Laundry").

    Returns:
        LinkedInSearchResult: A list of potential profile matches with URLs and snippets.
    """
    if not settings.SERPAPI_API_KEY:
        return LinkedInSearchResult(
            query=f"{name} {company or ''}".strip(),
            profiles=[],
            total_found=0,
            error="SERPAPI_API_KEY is not configured. Cannot perform LinkedIn search."
        )

    # Construct a targeted query
    search_query = f"site:linkedin.com/in/ {name}"
    if company:
        search_query += f" {company}"

    # SerpApi params for Google Search
    params = {
        "engine": "google",
        "q": search_query,
        "location": "United States",
        "google_domain": "google.com",
        "gl": "us",
        "hl": "en",
        "num": 5,  # Top 5 results are usually enough
        "api_key": settings.SERPAPI_API_KEY
    }

    url = f"{settings.SERPAPI_BASE_URL}/search"

    async with httpx.AsyncClient() as client:
        try:
            # SerpApi uses GET requests
            response = await client.get(url, params=params)

            if response.status_code == 403:
                return LinkedInSearchResult(
                    query=search_query,
                    profiles=[],
                    total_found=0,
                    error="Invalid SERPAPI_API_KEY."
                )

            if response.status_code != 200:
                return LinkedInSearchResult(
                    query=search_query,
                    profiles=[],
                    total_found=0,
                    error=f"SerpApi error: {response.status_code}"
                )

            data = response.json()
            organic_results = data.get("organic_results", [])

            profiles = []
            for result in organic_results:
                link = result.get("link", "")
                if "linkedin.com/in/" in link:
                    profiles.append(LinkedInProfile(
                        title=result.get("title", ""),
                        link=link,
                        snippet=result.get("snippet", "")
                    ))

            return LinkedInSearchResult(
                query=search_query,
                profiles=profiles,
                total_found=len(profiles)
            )

        except httpx.RequestError as e:
            logger.error(f"LinkedIn search failed: {e}")
            return LinkedInSearchResult(
                query=search_query,
                profiles=[],
                total_found=0,
                error=f"Network error: {str(e)}"
            )
