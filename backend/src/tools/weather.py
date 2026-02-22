"""
Agricultural Weather Tool for fetching local weather data and forecasts.
"""
from __future__ import annotations

import logging
from typing import Any, Optional

import httpx
from langchain_core.tools import tool

from src.core.config import settings
from src.schemas.weather import WeatherError, WeatherForecast, WeatherResult

logger = logging.getLogger(__name__)


async def _fetch_weather(client: httpx.AsyncClient, endpoint: str, params: dict[str, Any]) -> dict[str, Any]:
    base_url = settings.WEATHER_API_BASE_URL.rstrip("/")
    url = f"{base_url}/{endpoint.lstrip('/')}"

    if settings.WEATHER_API_KEY:
        params["appid"] = settings.WEATHER_API_KEY

    logger.debug("Weather API GET %s | params=%s", url, params)
    response = await client.get(url, params=params)
    response.raise_for_status()
    return response.json()


@tool
async def fetch_agricultural_weather(
        zip_code: str,
        days: int = 5,
        client: Optional[httpx.AsyncClient] = None
) -> WeatherResult | WeatherError:
    """
    Fetch current weather and forecast for a specific ZIP code to aid agricultural planning.
    
    Args:
        zip_code: 5-digit US ZIP code.
        days: Number of forecast days (default 5).
        
    Returns:
        WeatherResult: Current weather and forecast data.
        WeatherError: If the API call fails.
    """
    if not zip_code:
        return WeatherError(error="ZIP code is required")

    async def _execute(c: httpx.AsyncClient) -> WeatherResult | WeatherError:
        try:
            # First get lat/lon for the ZIP code using the weather API's geocoding
            # Assuming OpenWeatherMap 'weather' endpoint accepts zip directly or we use geocoding API
            # For simplicity, we'll assume the 'weather' endpoint supports 'zip={zip_code},us'

            # Current Weather
            current_params = {"zip": f"{zip_code},us", "units": "imperial"}
            current_data = await _fetch_weather(c, "weather", current_params)

            lat = current_data.get("coord", {}).get("lat")
            lon = current_data.get("coord", {}).get("lon")

            # Forecast
            forecast_params = {"lat": lat, "lon": lon, "cnt": days * 8,
                               "units": "imperial"}  # 3-hour intervals, 8 per day
            forecast_data = await _fetch_weather(c, "forecast", forecast_params)

            forecasts = []
            for item in forecast_data.get("list", []):
                # Basic parsing, might need more specific aggregation for daily summaries
                forecasts.append(WeatherForecast(
                    temperature_min=item["main"]["temp_min"],
                    temperature_max=item["main"]["temp_max"],
                    precipitation_mm=item.get("rain", {}).get("3h", 0.0),
                    humidity=item["main"]["humidity"],
                    description=item["weather"][0]["description"],
                    date=item["dt_txt"]
                ))

            return WeatherResult(
                current_temp=current_data["main"]["temp"],
                forecast=forecasts[:days],  # Simplified: usually would aggregate daily
                location=current_data["name"],
                zip_code=zip_code
            )

        except httpx.HTTPStatusError as e:
            logger.error(f"Weather API HTTP error: {e}")
            return WeatherError(error=f"HTTP {e.response.status_code}", detail=str(e))
        except Exception as e:
            logger.error(f"Error fetching weather: {e}")
            return WeatherError(error="Failed to fetch weather data", detail=str(e))

    if client:
        return await _execute(client)
    async with httpx.AsyncClient() as c:
        return await _execute(c)
