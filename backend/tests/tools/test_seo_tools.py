import pytest
import json
from unittest.mock import AsyncMock, MagicMock
from src.tools.seo_tools import fetch_local_seo_keywords

@pytest.fixture
def mock_seo_dependencies(mocker):
    # Mock settings
    mocker.patch("src.core.config.settings.OPENROUTER_API_KEY", "test_key")
    
    # Mock ChatOpenAI
    mock_llm = AsyncMock()
    mock_response = MagicMock()
    mock_response.content = json.dumps({
        "zip_code": "94103",
        "farm_type": "CSA",
        "keywords": [
            {"query": "organic csa san francisco", "volume": 500, "difficulty": 40}
        ]
    })
    mock_llm.ainvoke.return_value = mock_response
    mocker.patch("src.tools.seo_tools.ChatOpenAI", return_value=mock_llm)

@pytest.mark.asyncio
async def test_fetch_local_seo_keywords_success(mock_seo_dependencies):
    # Act
    result_json = await fetch_local_seo_keywords.ainvoke({
        "zip_code": "94103",
        "farm_type": "CSA"
    })
    
    result = json.loads(result_json)
    
    # Assert
    assert result["status"] == "success"
    assert result["seo_data"]["keywords"][0]["query"] == "organic csa san francisco"
