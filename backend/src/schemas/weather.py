from typing import List, Optional

from pydantic import BaseModel


class WeatherError(BaseModel):
    source: str = "weather_api"
    error: str
    detail: Optional[str] = None


class WeatherForecast(BaseModel):
    temperature_min: float
    temperature_max: float
    precipitation_mm: float
    humidity: int
    description: str
    date: str


class WeatherResult(BaseModel):
    current_temp: float
    forecast: List[WeatherForecast]
    location: str
    zip_code: Optional[str] = None
