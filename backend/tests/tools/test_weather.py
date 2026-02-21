import pytest
import respx
import httpx
from src.tools.weather import fetch_agricultural_weather, WeatherResult, WeatherError

@pytest.fixture(autouse=True)
def mock_weather_settings(mocker):
    mocker.patch("src.core.config.settings.WEATHER_API_KEY", "test_key")
    mocker.patch("src.core.config.settings.WEATHER_API_BASE_URL", "https://api.openweathermap.org/data/2.5")

@respx.mock
@pytest.mark.asyncio
async def test_fetch_agricultural_weather_success():
    # Arrange
    # Mock current weather
    respx.get("https://api.openweathermap.org/data/2.5/weather").mock(
        return_value=httpx.Response(
            200,
            json={
                "main": {"temp": 70, "humidity": 50, "temp_min": 60, "temp_max": 80},
                "coord": {"lat": 37.77, "lon": -122.42},
                "name": "San Francisco",
                "weather": [{"description": "clear sky"}]
            }
        )
    )
    
    # Mock forecast
    respx.get("https://api.openweathermap.org/data/2.5/forecast").mock(
        return_value=httpx.Response(
            200,
            json={
                "list": [
                    {
                        "dt_txt": "2023-01-01 12:00:00",
                        "main": {"temp": 72, "humidity": 55, "temp_min": 65, "temp_max": 75},
                        "weather": [{"description": "sunny"}],
                        "rain": {"3h": 0.0}
                    }
                ]
            }
        )
    )

    # Act
    result = await fetch_agricultural_weather.ainvoke({"zip_code": "94103"})

    # Assert
    assert isinstance(result, WeatherResult)
    assert result.current_temp == 70
    assert result.location == "San Francisco"
    assert len(result.forecast) > 0
    assert result.forecast[0].description == "sunny"
