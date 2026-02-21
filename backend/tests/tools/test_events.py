import pytest
import respx
import httpx
from src.tools.events import search_local_food_events, EventResult, EventError

@pytest.fixture(autouse=True)
def mock_serp_settings(mocker):
    mocker.patch("src.core.config.settings.SERPAPI_API_KEY", "test_key")

@respx.mock
@pytest.mark.asyncio
async def test_search_local_food_events_success():
    # Arrange
    respx.get("https://serpapi.com/search").mock(
        return_value=httpx.Response(
            200,
            json={
                "events_results": [
                    {
                        "title": "Farmers Market",
                        "date": {"when": "Sat, 10 AM"},
                        "address": ["123 Market St"],
                        "description": "Local produce",
                        "link": "http://event.com",
                        "venue": {"name": "Town Square"}
                    }
                ]
            }
        )
    )

    # Act
    result = await search_local_food_events.ainvoke({"zip_code": "94103"})

    # Assert
    assert isinstance(result, EventResult)
    assert len(result.events) == 1
    assert result.events[0].title == "Farmers Market"
    assert result.events[0].date == "Sat, 10 AM"
