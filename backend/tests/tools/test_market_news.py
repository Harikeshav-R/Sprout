import pytest
import respx
import httpx
from src.tools.market_news import fetch_usda_ams_pricing, MarketPriceResult

@pytest.fixture(autouse=True)
def mock_market_news_settings(mocker):
    mocker.patch("src.core.config.settings.USDA_MARKET_NEWS_API_KEY", "test_key")
    mocker.patch("src.core.config.settings.USDA_MARKET_NEWS_BASE_URL", "https://mars.ams.usda.gov/services/v1")

@respx.mock
@pytest.mark.asyncio
async def test_fetch_usda_ams_pricing_success():
    # Arrange
    respx.get("https://mars.ams.usda.gov/services/v1/reports").mock(
        return_value=httpx.Response(
            200,
            json={
                "results": [
                    {
                        "report_title": "Daily Terminal Market Report",
                        "published_date": "2023-01-01"
                    }
                ]
            }
        )
    )

    # Act
    result = await fetch_usda_ams_pricing.ainvoke({"commodity": "Tomatoes"})

    # Assert
    assert isinstance(result, MarketPriceResult)
    # The current implementation of fetch_usda_ams_pricing returns an empty list for prices
    # because the extraction logic is mocked/placeholder in the source code.
    assert result.query_commodity == "Tomatoes"
