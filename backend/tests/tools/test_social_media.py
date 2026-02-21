import pytest
import json
from unittest.mock import AsyncMock, MagicMock
from src.tools.social_media import scrape_social_media

@pytest.fixture
def mock_playwright(mocker):
    # Mock the async context manager for playwright
    mock_playwright_context = AsyncMock()
    mock_browser = AsyncMock()
    mock_page = AsyncMock()
    
    # Setup chain: async_playwright() yields mock_playwright_context
    # mock_playwright_context.chromium.launch returns mock_browser
    # mock_browser.new_page returns mock_page
    
    mock_playwright_context.chromium.launch.return_value = mock_browser
    mock_browser.new_page.return_value = mock_page
    
    # Mock page content and evaluation
    mock_page.evaluate.return_value = "Social Media Post Content\\nUpdate 2"
    
    # When async_playwright() is called, it returns an object that has __aenter__
    # returning mock_playwright_context
    mock_playwright_manager = MagicMock()
    mock_playwright_manager.__aenter__ = AsyncMock(return_value=mock_playwright_context)
    mock_playwright_manager.__aexit__ = AsyncMock(return_value=None)
    
    mocker.patch("src.tools.social_media.async_playwright", return_value=mock_playwright_manager)
    
    return mock_page

@pytest.mark.asyncio
async def test_scrape_social_media_success(mock_playwright):
    # Act
    result_json = await scrape_social_media.ainvoke({"url": "http://facebook.com/farm"})
    result = json.loads(result_json)
    
    # Assert
    assert result["status"] == "success"
    assert "Social Media Post Content" in result["extracted_text"]
    mock_playwright.goto.assert_called_with("http://facebook.com/farm", wait_until="domcontentloaded", timeout=15000)
