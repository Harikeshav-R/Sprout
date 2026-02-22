import pytest
import respx
import httpx
from src.tools.email_finder import find_decision_maker_email, EmailSearchResult

@pytest.fixture(autouse=True)
def mock_hunter_settings(mocker):
    mocker.patch("src.core.config.settings.HUNTER_API_KEY", "test_key")

@respx.mock
@pytest.mark.asyncio
async def test_find_decision_maker_email_success():
    # Arrange
    respx.get("https://api.hunter.io/v2/domain-search").mock(
        return_value=httpx.Response(
            200,
            json={
                "data": {
                    "domain": "test.com",
                    "organization": "Test Org",
                    "emails": [
                        {
                            "value": "ceo@test.com",
                            "first_name": "Test",
                            "last_name": "CEO",
                            "position": "CEO",
                            "confidence": 99,
                            "type": "personal",
                            "linkedin": "http://linkedin.com/test",
                            "twitter": "http://twitter.com/test"
                        }
                    ]
                }
            }
        )
    )

    # Act
    result = await find_decision_maker_email.ainvoke({"domain": "test.com"})

    # Assert
    assert isinstance(result, EmailSearchResult)
    assert result.domain == "test.com"
    assert result.contacts[0].email == "ceo@test.com"
    assert result.contacts[0].position == "CEO"

@respx.mock
@pytest.mark.asyncio
async def test_find_decision_maker_email_rate_limit():
    # Arrange
    respx.get("https://api.hunter.io/v2/domain-search").mock(
        return_value=httpx.Response(429)
    )

    # Act
    result = await find_decision_maker_email.ainvoke({"domain": "test.com"})

    # Assert
    assert result.error == "Hunter.io rate limit exceeded."
