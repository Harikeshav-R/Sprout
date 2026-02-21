"""
LinkedIn Profile Search Tool
============================
LangGraph tool for the SDR / Matchmaking pipeline (Phase 2).

Given a person's name and/or company, this tool searches for their
LinkedIn profile to facilitate personalized outreach.
It uses a SERP API (like Serper.dev or Google Custom Search) via the
SERP_API_KEY setting.

Architecture rules enforced
----------------------------
- Fully async (httpx.AsyncClient + async def)
- API key from Pydantic Settings
- Lives in backend/src/tools/ per AGENTS.md
"""

import logging
from typing import List, Optional

import httpx
from langchain_core.tools import tool

from src.core.config import settings
from src.schemas.linkedin_finder import LinkedInProfile, LinkedInSearchResult

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# API endpoints
# ---------------------------------------------------------------------------
# Defaulting to Serper.dev as it's the standard for LangChain SERP tools
_SERPER_URL = "https://google.serper.dev/search"

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
    if not settings.SERP_API_KEY:
        return LinkedInSearchResult(
            query=f"{name} {company or ''}".strip(),
            profiles=[],
            total_found=0,
            error="SERP_API_KEY is not configured. Cannot perform LinkedIn search."
        )

    # Construct a targeted query
    search_query = f"site:linkedin.com/in/ {name}"
    if company:
        search_query += f" {company}"

    payload = {
        "q": search_query,
        "num": 5  # Top 5 results are usually enough
    }
    
    headers = {
        "X-API-KEY": settings.SERP_API_KEY,
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(_SERPER_URL, headers=headers, json=payload)
            
            if response.status_code == 403:
                 return LinkedInSearchResult(
                    query=search_query,
                    profiles=[],
                    total_found=0,
                    error="Invalid SERP_API_KEY."
                )
            
            if response.status_code != 200:
                return LinkedInSearchResult(
                    query=search_query,
                    profiles=[],
                    total_found=0,
                    error=f"Serper API error: {response.status_code}"
                )

            data = response.json()
            organic_results = data.get("organic", [])
            
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
