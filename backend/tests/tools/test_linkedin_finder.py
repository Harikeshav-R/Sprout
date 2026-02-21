import pytest
import respx
import httpx
from src.tools.linkedin_finder import search_linkedin_profiles, LinkedInSearchResult

@pytest.fixture(autouse=True)
def mock_serper_settings(mocker):
    mocker.patch("src.core.config.settings.SERP_API_KEY", "test_key")

@respx.mock
@pytest.mark.asyncio
async def test_search_linkedin_profiles_success():
    # Arrange
    respx.post("https://google.serper.dev/search").mock(
        return_value=httpx.Response(
            200,
            json={
                "organic": [
                    {
                        "title": "Chef John - LinkedIn",
                        "link": "https://www.linkedin.com/in/chefjohn",
                        "snippet": "Experienced chef..."
                    }
                ]
            }
        )
    )

    # Act
    result = await search_linkedin_profiles.ainvoke({"name": "Chef John", "company": "Test Resto"})

    # Assert
    assert isinstance(result, LinkedInSearchResult)
    assert len(result.profiles) == 1
    assert result.profiles[0].link == "https://www.linkedin.com/in/chefjohn"
