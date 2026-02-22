"""
Geolocation utilities
=====================
Resolves a US zip-code to city, state, and county via Google Geocoding API.
"""

from __future__ import annotations

import logging

import httpx
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from src.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

REQUEST_TIMEOUT: float = 10.0


class ResolvedLocation(BaseModel):
    zip_code: str
    city: str
    state: str
    state_abbrev: str
    county: str


@router.get("/resolve-zip", response_model=ResolvedLocation)
async def resolve_zip(zip_code: str = Query(..., min_length=5, max_length=10)):
    """
    Resolve a US zip code to city, state, and county using Google Geocoding.
    """
    if not settings.GOOGLE_MAPS_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GOOGLE_MAPS_API_KEY is not configured.",
        )

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        response = await client.get(
            settings.GOOGLE_MAPS_GEOCODING_URL,
            params={
                "address": zip_code,
                "components": "country:US",
                "key": settings.GOOGLE_MAPS_API_KEY,
            },
        )

    data = response.json()

    if data.get("status") != "OK" or not data.get("results"):
        raise HTTPException(
            status_code=404,
            detail=f"Could not resolve zip code '{zip_code}'.",
        )

    # Parse address components from the first result
    components = data["results"][0].get("address_components", [])

    city = ""
    state = ""
    state_abbrev = ""
    county = ""

    for comp in components:
        types = comp.get("types", [])
        if "locality" in types:
            city = comp["long_name"]
        elif "administrative_area_level_1" in types:
            state = comp["long_name"]
            state_abbrev = comp["short_name"]
        elif "administrative_area_level_2" in types:
            # Google returns county as "Franklin County" — strip the suffix
            county = comp["long_name"].replace(" County", "").replace(" Parish", "")

    # Fallback: if no locality found, try sublocality or neighborhood
    if not city:
        for comp in components:
            types = comp.get("types", [])
            if "sublocality" in types or "neighborhood" in types:
                city = comp["long_name"]
                break

    if not state_abbrev:
        raise HTTPException(
            status_code=404,
            detail=f"Could not determine state for zip code '{zip_code}'.",
        )

    return ResolvedLocation(
        zip_code=zip_code,
        city=city or "Unknown",
        state=state,
        state_abbrev=state_abbrev,
        county=county or "Unknown",
    )
