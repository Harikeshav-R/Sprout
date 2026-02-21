import pytest
import respx
import httpx
from src.tools.google_places_api import search_nearby_businesses, PlacesSearchResult
from src.schemas.google_places import NearbyBusiness

@pytest.fixture(autouse=True)
def mock_google_settings(mocker):
    mocker.patch("src.core.config.settings.GOOGLE_MAPS_API_KEY", "test_key")

@respx.mock
@pytest.mark.asyncio
async def test_search_nearby_businesses_success():
    # Arrange
    # Mock Geocoding
    respx.get("https://maps.googleapis.com/maps/api/geocode/json").mock(
        return_value=httpx.Response(
            200,
            json={
                "status": "OK",
                "results": [
                    {
                        "geometry": {
                            "location": {
                                "lat": 37.7749,
                                "lng": -122.4194
                            }
                        }
                    }
                ]
            }
        )
    )

    # Mock Places Text Search
    respx.post("https://places.googleapis.com/v1/places:searchText").mock(
        return_value=httpx.Response(
            200,
            json={
                "places": [
                    {
                        "id": "place_123",
                        "displayName": {"text": "Test Business"},
                        "formattedAddress": "123 Main St",
                        "location": {"latitude": 37.7749, "longitude": -122.4194},
                        "rating": 4.5,
                        "websiteUri": "http://example.com",
                        "internationalPhoneNumber": "+1 555-1234",
                        "types": ["restaurant"]
                    }
                ]
            }
        )
    )

    # Act
    result = await search_nearby_businesses.ainvoke({
        "location": "San Francisco, CA",
        "query": "restaurants"
    })

    # Assert
    assert isinstance(result, PlacesSearchResult)
    assert len(result.businesses) == 1
    assert result.businesses[0].name == "Test Business"
    assert result.businesses[0].rating == 4.5

@respx.mock
@pytest.mark.asyncio
async def test_search_nearby_businesses_geocode_fail():
    # Arrange
    respx.get("https://maps.googleapis.com/maps/api/geocode/json").mock(
        return_value=httpx.Response(
            200,
            json={"status": "ZERO_RESULTS", "results": []}
        )
    )

    # Act & Assert
    with pytest.raises(ValueError, match="Geocoding failed"):
        await search_nearby_businesses.ainvoke({
            "location": "Nowhere, NA",
            "query": "anything"
        })
