import pytest
import json
from unittest.mock import AsyncMock, MagicMock
from src.tools.competitor_analysis import analyze_competitor_gap

@pytest.fixture
def mock_competitor_dependencies(mocker):
    # Mock settings
    mocker.patch("src.core.config.settings.OPENROUTER_API_KEY", "test_key")
    
    # Mock search_nearby_businesses tool
    mock_search = AsyncMock()
    mock_search.ainvoke.return_value = json.dumps([
        {"name": "Competitor Farm 1", "vicinity": "Nearby", "rating": 4.5, "user_ratings_total": 10, "website": "http://comp1.com"},
        {"name": "Competitor Farm 2", "vicinity": "Far away", "rating": 3.0, "user_ratings_total": 5, "website": "http://comp2.com"}
    ])
    mocker.patch("src.tools.competitor_analysis.search_nearby_businesses", mock_search)
    
    # Mock scrape_website_content tool
    mock_scrape = AsyncMock()
    mock_scrape.ainvoke.return_value = json.dumps({"extracted_text": "Competitor content snippet..."})
    mocker.patch("src.tools.competitor_analysis.scrape_website_content", mock_scrape)
    
    # Mock ChatOpenAI
    mock_llm = AsyncMock()
    mock_response = MagicMock()
    mock_response.content = json.dumps({
        "market_gaps": ["Gap 1"],
        "positioning_recommendations": ["Rec 1"]
    })
    mock_llm.ainvoke.return_value = mock_response
    mocker.patch("src.tools.competitor_analysis.ChatOpenAI", return_value=mock_llm)

@pytest.mark.asyncio
async def test_analyze_competitor_gap_success(mock_competitor_dependencies):
    # Act
    result_json = await analyze_competitor_gap.ainvoke({
        "latitude": 37.7749,
        "longitude": -122.4194,
        "farm_name": "My Farm",
        "farm_offerings": "Organic Veggies"
    })
    
    result = json.loads(result_json)
    
    # Assert
    assert result["status"] == "success"
    assert result["target_farm"] == "My Farm"
    assert "report" in result
    assert result["report"]["market_gaps"] == ["Gap 1"]
