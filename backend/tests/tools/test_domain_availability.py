import pytest
import json
from unittest.mock import AsyncMock, MagicMock
from src.tools.domain_availability import check_domain_availability
import socket

@pytest.fixture
def mock_domain_dependencies(mocker):
    # Mock settings
    mocker.patch("src.core.config.settings.OPENROUTER_API_KEY", "test_key")
    
    # Mock ChatOpenAI
    mock_llm = AsyncMock()
    mock_response = MagicMock()
    mock_response.content = "farm1.com, farm2.com, farm3.com, farm4.com, farm5.com"
    mock_llm.ainvoke.return_value = mock_response
    mocker.patch("src.tools.domain_availability.ChatOpenAI", return_value=mock_llm)
    
    # Mock socket.gethostbyname
    mock_socket = mocker.patch("src.tools.domain_availability.socket.gethostbyname")
    return mock_socket

@pytest.mark.asyncio
async def test_check_domain_availability_success(mock_domain_dependencies):
    # Arrange
    # Simulate first domain taken (raises nothing), second available (raises gaierror)
    mock_domain_dependencies.side_effect = [
        "1.2.3.4",          # farm1.com resolves -> taken
        socket.gaierror,    # farm2.com fails -> available
        "1.2.3.4",          # farm3.com -> taken
        socket.gaierror,    # farm4.com -> available
        socket.gaierror     # farm5.com -> available
    ]
    
    # Act
    result_json = await check_domain_availability.ainvoke({
        "farm_name": "My Farm",
        "farm_description": "Organic"
    })
    
    result = json.loads(result_json)
    
    # Assert
    assert result["status"] == "success"
    suggestions = result["suggestions"]
    assert len(suggestions) >= 3 # Tool stops after finding 3 available? No, stops after checking 5 or finding 3 available.
    
    # farm1 -> taken
    assert suggestions[0]["domain"] == "farm1.com"
    assert suggestions[0]["status"] == "taken"
    
    # farm2 -> available
    assert suggestions[1]["domain"] == "farm2.com"
    assert suggestions[1]["status"] == "available"
