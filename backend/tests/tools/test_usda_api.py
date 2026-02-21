import pytest
import respx
import httpx
from src.tools.usda_api import search_farmers_markets, search_csa, search_all_local_food
from src.schemas.usda import USDAToolError, FarmersMarketSearchResult, CSASearchResult

# Mock settings
@pytest.fixture(autouse=True)
def mock_settings(mocker):
    mocker.patch("src.core.config.settings.USDA_API_KEY", "test_key")
    mocker.patch("src.core.config.settings.USDA_API_BASE_URL", "https://www.usdalocalfoodportal.com")

@respx.mock
@pytest.mark.asyncio
async def test_search_farmers_markets_success():
    # Arrange
    respx.get("https://www.usdalocalfoodportal.com/api/farmersmarket/").mock(
        return_value=httpx.Response(
            200,
            json={
                "count": 1,
                "results": [
                    {
                        "id": 1,
                        "directory_type": "farmersmarket",
                        "listing_name": "Test Market",
                        "listing_desc": "A test market",
                        "location_x": "-122.4194",
                        "location_y": "37.7749",
                        "location_address": "123 Market St",
                        "location_city": "San Francisco",
                        "location_state": "CA",
                        "location_zipcode": "94103"
                    }
                ]
            }
        )
    )

    # Act
    result = await search_farmers_markets.ainvoke({"zip_code": "94103", "radius_miles": 10})

    # Assert
    assert isinstance(result, FarmersMarketSearchResult)
    assert result.count == 1
    assert result.listings[0].listing_name == "Test Market"
    assert result.listings[0].location_city == "San Francisco"

@respx.mock
@pytest.mark.asyncio
async def test_search_farmers_markets_error():
    # Arrange
    respx.get("https://www.usdalocalfoodportal.com/api/farmersmarket/").mock(
        return_value=httpx.Response(500)
    )

    # Act
    result = await search_farmers_markets.ainvoke({"zip_code": "94103"})

    # Assert
    assert isinstance(result, USDAToolError)
    assert "HTTP 500" in result.error

@respx.mock
@pytest.mark.asyncio
async def test_search_csa_success():
    # Arrange
    respx.get("https://www.usdalocalfoodportal.com/api/csa/").mock(
        return_value=httpx.Response(
            200,
            json={
                "count": 1,
                "results": [
                    {
                        "id": 101,
                        "directory_type": "csa",
                        "listing_name": "Test CSA",
                        "listing_desc": "Fresh veggies",
                        "location_x": "-122.4194",
                        "location_y": "37.7749",
                        "location_address": "456 Farm Rd",
                        "location_city": "San Francisco",
                        "location_state": "CA",
                        "location_zipcode": "94103"
                    }
                ]
            }
        )
    )

    # Act
    result = await search_csa.ainvoke({"state": "CA"})

    # Assert
    assert isinstance(result, CSASearchResult)
    assert result.count == 1
    assert result.listings[0].listing_name == "Test CSA"

@respx.mock
@pytest.mark.asyncio
async def test_search_all_local_food_integration():
    # Arrange
    # Mock both endpoints
    respx.get("https://www.usdalocalfoodportal.com/api/farmersmarket/").mock(
        return_value=httpx.Response(200, json={"count": 0, "results": []})
    )
    respx.get("https://www.usdalocalfoodportal.com/api/csa/").mock(
        return_value=httpx.Response(200, json={"count": 0, "results": []})
    )

    # Act
    result = await search_all_local_food.ainvoke({"zip_code": "94103"})

    # Assert
    assert "farmersmarket" in result
    assert "csa" in result
    assert isinstance(result["farmersmarket"], FarmersMarketSearchResult)
    assert isinstance(result["csa"], CSASearchResult)
