import pytest
import respx
import httpx
from src.tools.review_analyzer import analyze_restaurant_reviews, ReviewAnalysisResult

@pytest.fixture(autouse=True)
def mock_google_settings(mocker):
    mocker.patch("src.core.config.settings.GOOGLE_MAPS_API_KEY", "test_key")

@respx.mock
@pytest.mark.asyncio
async def test_analyze_restaurant_reviews_success():
    # Arrange
    respx.get("https://places.googleapis.com/v1/places/place_123").mock(
        return_value=httpx.Response(
            200,
            json={
                "reviews": [
                    {
                        "text": {"text": "Great farm-to-table experience with local ingredients."},
                        "rating": 5,
                        "authorAttribution": {"displayName": "Alice"},
                        "relativePublishTimeDescription": "a week ago"
                    },
                    {
                        "text": {"text": "Just okay, nothing special."},
                        "rating": 3,
                        "authorAttribution": {"displayName": "Bob"},
                        "relativePublishTimeDescription": "a month ago"
                    }
                ]
            }
        )
    )

    # Act
    result = await analyze_restaurant_reviews.ainvoke({"place_id": "place_123"})

    # Assert
    assert isinstance(result, ReviewAnalysisResult)
    assert result.total_reviews_scanned == 2
    assert result.relevant_reviews_found == 1
    assert result.reviews[0].highlighted is True
    assert result.reviews[0].author_name == "Alice"
