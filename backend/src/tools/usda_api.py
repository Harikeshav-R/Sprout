"""
USDA Local Food Directories API tool for the Sprout LangGraph Discovery Agent.

Targets two USDA Local Food Directories endpoints:
  - /api/farmersmarket/  – Farmers Market listings
  - /api/csa/            – Community Supported Agriculture (CSA) listings

Design principles (per AGENTS.md):
  - Fully async (httpx.AsyncClient inside async def).
  - No hardcoded URLs — base URL and key come from Pydantic Settings.
  - Returns typed Pydantic models the LangGraph agent can directly read.
  - Returns a USDAToolError value (never raises) so the graph cannot crash
    due to an upstream government API outage.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

from src.core.config import settings
from langchain_core.tools import tool
from src.schemas.usda import (
    CSAListing,
    CSASearchResult,
    FarmersMarketListing,
    FarmersMarketSearchResult,
    USDAToolError,
)

logger = logging.getLogger(__name__)

_REQUEST_TIMEOUT: float = 15.0  # seconds


# ---------------------------------------------------------------------------
# Internal HTTP helper
# ---------------------------------------------------------------------------


async def _fetch_usda(client: httpx.AsyncClient, endpoint: str, params: dict[str, Any]) -> dict[str, Any]:
    """
    GET a USDA Local Food Directories endpoint and return the parsed JSON.

    Raises:
        httpx.HTTPStatusError  – 4xx / 5xx HTTP responses.
        httpx.RequestError     – Network-level failures (timeout, DNS, …).
    """
    base_url = settings.USDA_API_BASE_URL.rstrip("/")
    url = f"{base_url}/{endpoint.lstrip('/')}"

    # Attach the API key only when one is configured; omit the param entirely
    # when absent so the request still works on the un-keyed public endpoint.
    if settings.USDA_API_KEY:
        params = {**params, "apikey": settings.USDA_API_KEY}

    logger.debug("USDA GET %s | params=%s", url, params)
    response = await client.get(url, params=params)
    response.raise_for_status()
    return response.json()


# ---------------------------------------------------------------------------
# Public tool functions
# ---------------------------------------------------------------------------


@tool
async def search_farmers_markets(
    zip_code: str | None = None,
    state: str | None = None,
    radius_miles: int = 25,
    client: httpx.AsyncClient | None = None,
) -> FarmersMarketSearchResult | USDAToolError:
    """
    Search the USDA Farmers Market directory by ZIP code and/or state.

    At least one of `zip_code` or `state` must be provided.  When a ZIP code
    is given, `radius_miles` is used to build a geo-radius query (default 25
    miles).  `state` can be combined with a ZIP or used alone to list all
    markets in that state.

    Args:
        zip_code:     5-digit US ZIP code to centre the search on.
        state:        2-letter state abbreviation (e.g. "CA").
        radius_miles: Search radius in miles around `zip_code` (default 25).

    Returns:
        FarmersMarketSearchResult – typed listing data on success.
        USDAToolError             – error descriptor when the API is down or
                                    returns an unexpected response.
    """
    if not zip_code and not state:
        logger.warning("search_farmers_markets called with no zip_code or state")
        return USDAToolError(
            source="farmersmarket",
            error="At least one of zip_code or state must be supplied.",
        )

    params: dict[str, Any] = {}
    if zip_code:
        params["zip"] = zip_code
        params["radius"] = radius_miles
    if state:
        params["state"] = state.upper()

    async def _execute_search(client_to_use: httpx.AsyncClient) -> FarmersMarketSearchResult | USDAToolError:
        try:
            data = await _fetch_usda(client_to_use, "/api/farmersmarket/", params)
        except httpx.HTTPStatusError as exc:
            logger.error(
                "USDA farmers-market HTTP error %s for params %s",
                exc.response.status_code,
                params,
            )
            return USDAToolError(
                source="farmersmarket",
                error=f"HTTP {exc.response.status_code} from USDA API",
                detail=str(exc),
            )
        except httpx.TimeoutException as exc:
            logger.error("USDA farmers-market request timed out: %s", exc)
            return USDAToolError(
                source="farmersmarket",
                error="Request to USDA API timed out",
                detail=str(exc),
            )
        except httpx.RequestError as exc:
            logger.error("USDA farmers-market network error: %s", exc)
            return USDAToolError(
                source="farmersmarket",
                error="Network error reaching USDA API",
                detail=str(exc),
            )
        except Exception as exc:  # noqa: BLE001 – catch-all so agent graph never crashes
            logger.exception("Unexpected error in search_farmers_markets")
            return USDAToolError(
                source="farmersmarket",
                error="Unexpected error",
                detail=str(exc),
            )

        try:
            raw_listings: list[dict[str, Any]] = data.get("results", [])
            if not isinstance(raw_listings, list):
                if isinstance(data, dict) and "error" in data:
                    raise ValueError(f"API Error: {data['error']}")
                raise TypeError(f"Expected 'results' to be a list, got {type(raw_listings)}")
            listings = [FarmersMarketListing.model_validate(r) for r in raw_listings]
        except Exception as exc:
            logger.error("Failed to parse USDA farmers-market response: %s", exc)
            return USDAToolError(
                source="farmersmarket",
                error="Failed to parse response payload",
                detail=str(exc),
            )

        logger.info(
            "USDA farmers-market: %d results for zip=%s state=%s radius=%s mi",
            len(listings),
            zip_code,
            state,
            radius_miles if zip_code else "N/A",
        )

        return FarmersMarketSearchResult(
            query_zip=zip_code,
            query_state=state,
            query_radius_miles=radius_miles if zip_code else None,
            count=data.get("count", len(listings)),
            listings=listings,
        )

    if client is None:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as local_client:
            return await _execute_search(local_client)
    else:
        return await _execute_search(client)

    logger.info(
        "USDA farmers-market: %d results for zip=%s state=%s radius=%s mi",
        len(listings),
        zip_code,
        state,
        radius_miles if zip_code else "N/A",
    )

    return FarmersMarketSearchResult(
        query_zip=zip_code,
        query_state=state,
        query_radius_miles=radius_miles if zip_code else None,
        count=data.get("count", len(listings)),
        listings=listings,
    )


@tool
async def search_csa(
    zip_code: str | None = None,
    state: str | None = None,
    radius_miles: int = 25,
    client: httpx.AsyncClient | None = None,
) -> CSASearchResult | USDAToolError:
    """
    Search the USDA Community Supported Agriculture (CSA) directory.

    At least one of `zip_code` or `state` must be provided.

    Args:
        zip_code:     5-digit US ZIP code to centre the search on.
        state:        2-letter state abbreviation (e.g. "CA").
        radius_miles: Search radius in miles around `zip_code` (default 25).

    Returns:
        CSASearchResult – typed listing data on success.
        USDAToolError   – error descriptor when the API is down or returns an
                          unexpected response.
    """
    if not zip_code and not state:
        logger.warning("search_csa called with no zip_code or state")
        return USDAToolError(
            source="csa",
            error="At least one of zip_code or state must be supplied.",
        )

    params: dict[str, Any] = {}
    if zip_code:
        params["zip"] = zip_code
        params["radius"] = radius_miles
    if state:
        params["state"] = state.upper()

    async def _execute_search(client_to_use: httpx.AsyncClient) -> CSASearchResult | USDAToolError:
        try:
            data = await _fetch_usda(client_to_use, "/api/csa/", params)
        except httpx.HTTPStatusError as exc:
            logger.error(
                "USDA CSA HTTP error %s for params %s",
                exc.response.status_code,
                params,
            )
            return USDAToolError(
                source="csa",
                error=f"HTTP {exc.response.status_code} from USDA API",
                detail=str(exc),
            )
        except httpx.TimeoutException as exc:
            logger.error("USDA CSA request timed out: %s", exc)
            return USDAToolError(
                source="csa",
                error="Request to USDA API timed out",
                detail=str(exc),
            )
        except httpx.RequestError as exc:
            logger.error("USDA CSA network error: %s", exc)
            return USDAToolError(
                source="csa",
                error="Network error reaching USDA API",
                detail=str(exc),
            )
        except Exception as exc:  # noqa: BLE001
            logger.exception("Unexpected error in search_csa")
            return USDAToolError(
                source="csa",
                error="Unexpected error",
                detail=str(exc),
            )

        try:
            raw_listings: list[dict[str, Any]] = data.get("results", [])
            if not isinstance(raw_listings, list):
                if isinstance(data, dict) and "error" in data:
                    raise ValueError(f"API Error: {data['error']}")
                raise TypeError(f"Expected 'results' to be a list, got {type(raw_listings)}")
            listings = [CSAListing.model_validate(r) for r in raw_listings]
        except Exception as exc:
            logger.error("Failed to parse USDA CSA response: %s", exc)
            return USDAToolError(
                source="csa",
                error="Failed to parse response payload",
                detail=str(exc),
            )

        logger.info(
            "USDA CSA: %d results for zip=%s state=%s radius=%s mi",
            len(listings),
            zip_code,
            state,
            radius_miles if zip_code else "N/A",
        )

        return CSASearchResult(
            query_zip=zip_code,
            query_state=state,
            query_radius_miles=radius_miles if zip_code else None,
            count=data.get("count", len(listings)),
            listings=listings,
        )

    if client is None:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as local_client:
            return await _execute_search(local_client)
    else:
        return await _execute_search(client)

    logger.info(
        "USDA CSA: %d results for zip=%s state=%s radius=%s mi",
        len(listings),
        zip_code,
        state,
        radius_miles if zip_code else "N/A",
    )

    return CSASearchResult(
        query_zip=zip_code,
        query_state=state,
        query_radius_miles=radius_miles if zip_code else None,
        count=data.get("count", len(listings)),
        listings=listings,
    )


@tool
async def search_all_local_food(
    zip_code: str | None = None,
    state: str | None = None,
    radius_miles: int = 25,
) -> dict[str, FarmersMarketSearchResult | CSASearchResult | USDAToolError]:
    """
    Query both the farmers-market and CSA directories **concurrently** and
    return a combined dictionary keyed by source name.

    This is the primary entry-point for the LangGraph Discovery Agent node —
    a single tool call surfaces all local food directory data in one shot.

    Args:
        zip_code:     5-digit US ZIP code.
        state:        2-letter state abbreviation (e.g. "CA").
        radius_miles: Search radius in miles (default 25).

    Returns:
        {
            "farmersmarket": FarmersMarketSearchResult | USDAToolError,
            "csa":           CSASearchResult           | USDAToolError,
        }

    Neither coroutine can raise — any failure is captured as a USDAToolError
    value so the graph continues safely with whatever data is available.
    """
    async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
        fm_result, csa_result = await asyncio.gather(
            search_farmers_markets(
                zip_code=zip_code, state=state, radius_miles=radius_miles, client=client
            ),
            search_csa(
                zip_code=zip_code, state=state, radius_miles=radius_miles, client=client
            ),
        )

    return {
        "farmersmarket": fm_result,
        "csa": csa_result,
    }
