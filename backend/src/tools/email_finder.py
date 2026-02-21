"""
Hunter.io Email Finder Tool
===========================
LangGraph tool for the SDR / Matchmaking pipeline (Phase 2).

Given a restaurant's website domain, this tool searches for verified email addresses
associated with key decision-makers (Chef, Owner, Manager) using the Hunter.io API.

Architecture rules enforced
----------------------------
- Fully async (httpx.AsyncClient + async def)
- API key from Pydantic Settings only – never os.environ
- Lives in backend/src/tools/ per AGENTS.md
- Graceful degradation if API key is missing
"""

import logging

import httpx
from langchain_core.tools import tool

from src.core.config import settings
from src.schemas.email_finder import EmailContact, EmailSearchResult

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# API endpoints
# ---------------------------------------------------------------------------
# Constructed dynamically inside the function using settings


# ---------------------------------------------------------------------------
# Public tool function
# ---------------------------------------------------------------------------

@tool
async def find_decision_maker_email(domain: str) -> EmailSearchResult:
    """Finds email addresses for decision makers at a given domain (e.g., 'frenchlaundry.com').

    Uses Hunter.io to search for emails associated with the domain, prioritizing
    roles like 'Chef', 'Owner', 'Manager', or 'Director'.

    Args:
        domain: The website domain to search (e.g., 'chezpanisse.com').
                Do not include 'http://' or 'www.'.

    Returns:
        EmailSearchResult: A structured object containing a list of found contacts
        and their metadata.
    """
    if not settings.HUNTER_API_KEY:
        return EmailSearchResult(
            domain=domain,
            error="HUNTER_API_KEY is not configured. Cannot perform email search."
        )

    # Clean the domain input
    clean_domain = domain.replace("http://", "").replace("https://", "").replace("www.", "").split("/")[0]

    url = f"{settings.HUNTER_API_BASE_URL}/domain-search"

    params = {
        "domain": clean_domain,
        "api_key": settings.HUNTER_API_KEY,
        "limit": 10,  # Limit to 10 results to save credits
        # "type": "personal", # Prefer personal emails over generic (info@)
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params)

            # Handle specific API errors
            if response.status_code == 401:
                return EmailSearchResult(domain=clean_domain, error="Invalid Hunter.io API key.")
            if response.status_code == 429:
                return EmailSearchResult(domain=clean_domain, error="Hunter.io rate limit exceeded.")

            # Parse successful response
            if response.status_code == 200:
                data = response.json().get("data", {})
                emails = data.get("emails", [])

                contacts = []
                for e in emails:
                    contacts.append(EmailContact(
                        email=e.get("value"),
                        first_name=e.get("first_name"),
                        last_name=e.get("last_name"),
                        position=e.get("position"),
                        confidence=e.get("confidence"),
                        type=e.get("type"),
                        linkedin=e.get("linkedin"),
                        twitter=e.get("twitter")
                    ))

                # Filter for relevant roles if possible (simple keyword matching)
                # In a real app, we might want to keep all and let the LLM filter.
                # For now, we return all found contacts.

                return EmailSearchResult(
                    domain=clean_domain,
                    organization=data.get("organization"),
                    contacts=contacts,
                    total_found=len(contacts)
                )

            # Generic error handling
            return EmailSearchResult(
                domain=clean_domain,
                error=f"Hunter.io API returned status {response.status_code}"
            )

        except httpx.RequestError as e:
            logger.error(f"Hunter.io request failed: {e}")
            return EmailSearchResult(domain=clean_domain, error=f"Network error: {str(e)}")
