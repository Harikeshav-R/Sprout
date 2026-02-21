"""
Google Places Geospatial Market Tool
=====================================
LangGraph tool for the SDR / Matchmaking pipeline (Phase 3).

Given a farm's location and a business-category query (e.g. "restaurants",
"grocery stores", "farmers markets"), this tool searches the Google Places
API (New – v1) for nearby businesses and returns clean, typed Pydantic objects
ready for downstream scraping (Phase 1 web_scraper) and email drafting (Phase 3).

Architecture rules enforced
----------------------------
- Fully async  (httpx.AsyncClient + async def)
- API key from Pydantic Settings only – never os.environ
- Lives in backend/src/tools/ per AGENTS.md
- Timeout + exponential-backoff retry on every outbound request
"""

from __future__ import annotations

import asyncio
import logging

import httpx
from langchain_core.tools import tool

from src.core.config import settings
from src.schemas.google_places import NearbyBusiness, PlacesSearchResult

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# API endpoints
# ---------------------------------------------------------------------------
# Defined in config.py:
# settings.GOOGLE_MAPS_GEOCODING_URL
# settings.GOOGLE_PLACES_TEXT_SEARCH_URL

# ---------------------------------------------------------------------------
# Tunables
# ---------------------------------------------------------------------------
# 30 miles expressed in metres (matches the Phase-3 "30-mile radius" rule in AGENTS.md)
DEFAULT_RADIUS_METERS: int = 48_280
DEFAULT_MAX_RESULTS: int = 20  # Google Places (New) hard cap per page
REQUEST_TIMEOUT: float = 10.0  # seconds per individual HTTP call
MAX_RETRIES: int = 3
_BACKOFF_BASE: float = 1.5  # seconds; wait = _BACKOFF_BASE ** attempt

# Fields we ask Google to return (reduces payload size and cost)
_FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.rating",
    "places.websiteUri",
    "places.internationalPhoneNumber",
    "places.types",
    "places.location",
])


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

async def _request_with_retry(
        client: httpx.AsyncClient,
        method: str,
        url: str,
        **kwargs,
) -> httpx.Response:
    """Sends an HTTP request with exponential-backoff retry.

    Retries on network-level errors and 5xx responses.
    Raises immediately on 4xx (client errors – retrying won't help).
    """
    last_exc: Exception | None = None
    for attempt in range(MAX_RETRIES):
        try:
            response = await client.request(method, url, **kwargs)
            response.raise_for_status()
            return response
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code < 500:
                # 4xx – surface immediately; retrying won't fix it
                raise
            last_exc = exc
        except httpx.TransportError as exc:
            last_exc = exc

        wait = _BACKOFF_BASE ** attempt
        logger.warning(
            "Places API attempt %d/%d failed: %s. Retrying in %.1fs…",
            attempt + 1,
            MAX_RETRIES,
            last_exc,
            wait,
        )
        await asyncio.sleep(wait)

    raise RuntimeError(
        f"All {MAX_RETRIES} retries exhausted for {method} {url}"
    ) from last_exc


async def _geocode_address(
        client: httpx.AsyncClient, address: str
) -> tuple[float, float]:
    """Converts a street address string to (latitude, longitude).

    Raises ValueError if Google cannot resolve the address.
    """
    response = await _request_with_retry(
        client,
        "GET",
        settings.GOOGLE_MAPS_GEOCODING_URL,
        params={"address": address, "key": settings.GOOGLE_MAPS_API_KEY},
        timeout=REQUEST_TIMEOUT,
    )
    data: dict = response.json()

    status = data.get("status")
    if status != "OK" or not data.get("results"):
        raise ValueError(
            f"Geocoding failed for '{address}' – Google status: {status}"
        )

    loc = data["results"][0]["geometry"]["location"]
    return float(loc["lat"]), float(loc["lng"])


async def _resolve_location(
        client: httpx.AsyncClient, location: str
) -> tuple[float, float]:
    """Accepts either a 'lat,lng' string or a human-readable address."""
    parts = location.strip().split(",")
    if len(parts) == 2:
        try:
            return float(parts[0].strip()), float(parts[1].strip())
        except ValueError:
            pass  # Not numeric coordinates; fall through to geocoding

    return await _geocode_address(client, location)


def _parse_place(raw: dict) -> NearbyBusiness | None:
    """Maps a raw Google Places v1 place object to a NearbyBusiness.
    Returns None if the location coordinates are missing or 0.0,0.0.
    """
    loc = raw.get("location")
    if not loc or ("latitude" not in loc and "longitude" not in loc):
        logger.debug("Skipping place '%s' due to missing location data", raw.get("id"))
        return None

    lat = float(loc.get("latitude", 0.0))
    lng = float(loc.get("longitude", 0.0))

    # Skip clearly invalid coordinates (e.g. defaulting to 0,0)
    if lat == 0.0 and lng == 0.0:
        logger.debug("Skipping place '%s' due to (0,0) coordinates", raw.get("id"))
        return None

    display = raw.get("displayName", {})

    return NearbyBusiness(
        name=display.get("text", "Unknown"),
        address=raw.get("formattedAddress", ""),
        rating=raw.get("rating"),
        website=raw.get("websiteUri"),
        phone_number=raw.get("internationalPhoneNumber"),
        place_id=raw.get("id", ""),
        latitude=lat,
        longitude=lng,
        types=raw.get("types", []),
    )


async def _run_text_search(
        client: httpx.AsyncClient,
        query: str,
        lat: float,
        lng: float,
        radius_meters: int,
        max_results: int,
) -> list[NearbyBusiness]:
    """Executes a Google Places Text Search (New API) and parses the results."""
    payload = {
        "textQuery": query,
        # API hard cap is 20; guard against callers passing a higher value
        "maxResultCount": min(max_results, DEFAULT_MAX_RESULTS),
        "locationBias": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                # API maximum for circle radius is 50 000 m
                "radius": float(min(radius_meters, 50_000)),
            }
        },
    }
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": settings.GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": _FIELD_MASK,
    }

    response = await _request_with_retry(
        client,
        "POST",
        settings.GOOGLE_PLACES_TEXT_SEARCH_URL,
        json=payload,
        headers=headers,
        timeout=REQUEST_TIMEOUT,
    )

    places: list[dict] = response.json().get("places", [])
    parsed_places = [_parse_place(p) for p in places]
    return [p for p in parsed_places if p is not None]


# ---------------------------------------------------------------------------
# Public tool function  (called from LangGraph nodes)
# ---------------------------------------------------------------------------

@tool
async def search_nearby_businesses(
        location: str,
        query: str,
        radius_meters: int = DEFAULT_RADIUS_METERS,
        max_results: int = DEFAULT_MAX_RESULTS,
) -> PlacesSearchResult:
    """Search for nearby businesses using the Google Places API (New – v1).

    This is the primary LangGraph tool for both the Discovery pipeline (Phase 1)
    and the Restaurant Matchmaking / SDR pipeline (Phase 3).

    Args:
        location:      Farm address ("123 Main St, Sonoma, CA 95476") **or**
                       a pre-resolved "lat,lng" string ("38.2919,-122.4580").
        query:         Business category to search (e.g. "restaurants",
                       "grocery stores", "cafes", "farmers markets").
        radius_meters: Search radius in metres.
                       Default = 48 280 m ≈ 30 miles (Phase-3 spec).
        max_results:   Maximum results to return (Google cap: 20 per page).

    Returns:l
        PlacesSearchResult – a Pydantic model containing a list of
        NearbyBusiness objects with name, address, rating, website, and
        coordinates ready for Phase-1 scraping or Phase-3 email drafting.

    Raises:
        ValueError:   If the API key is missing or the address cannot be geocoded.
        RuntimeError: If all retry attempts are exhausted.
        httpx.HTTPStatusError: On unrecoverable API errors (e.g. 403 bad key).
    """
    if not settings.GOOGLE_MAPS_API_KEY:
        raise ValueError("GOOGLE_MAPS_API_KEY is not configured in environment settings.")

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        lat, lng = await _resolve_location(client, location)

        businesses = await _run_text_search(
            client, query, lat, lng, radius_meters, max_results
        )

    logger.info(
        "Places search '%s' near '%s' → %d results",
        query,
        location,
        len(businesses),
    )

    return PlacesSearchResult(
        query=query,
        location_input=location,
        radius_meters=radius_meters,
        businesses=businesses,
        total_found=len(businesses),
    )
