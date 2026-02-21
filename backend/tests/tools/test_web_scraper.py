import pytest
import json
from unittest.mock import AsyncMock, MagicMock
from src.tools.web_scraper import scrape_website_content, analyze_website_visuals

@pytest.fixture
def mock_playwright(mocker):
    # Mock the async context manager for playwright
    mock_playwright_context = AsyncMock()
    mock_browser = AsyncMock()
    mock_page = AsyncMock()
    
    mock_playwright_context.chromium.launch.return_value = mock_browser
    mock_browser.new_page.return_value = mock_page
    
    # Mock page content and evaluation
    mock_page.content.return_value = "<html><body><h1>Farm Name</h1><p>Fresh produce.</p><a href='mailto:test@farm.com'>Email</a></body></html>"
    mock_page.evaluate.return_value = "Farm Name\nFresh produce."
    mock_page.screenshot.return_value = b"fake_image_bytes"
    
    # Mock the async context manager behavior
    mock_playwright_manager = MagicMock()
    mock_playwright_manager.__aenter__ = AsyncMock(return_value=mock_playwright_context)
    mock_playwright_manager.__aexit__ = AsyncMock(return_value=None)
    
    mocker.patch("src.tools.web_scraper.async_playwright", return_value=mock_playwright_manager)
    
    return mock_page

@pytest.mark.asyncio
async def test_scrape_website_content_success(mock_playwright):
    # Act
    result_json = await scrape_website_content.ainvoke({"url": "http://example.com"})
    result = json.loads(result_json)
    
    # Assert
    assert "Farm Name" in result["extracted_text"]
    assert "mailto:test@farm.com" in result["potential_contact_links"]
    mock_playwright.goto.assert_called_with("http://example.com", wait_until="domcontentloaded", timeout=30000)

@pytest.fixture(autouse=True)
def mock_openai_settings(mocker):
    mocker.patch("src.core.config.settings.OPENROUTER_API_KEY", "test_key")

@pytest.mark.asyncio
async def test_analyze_website_visuals_success(mock_playwright, mocker):
    # Mock ChatOpenAI
    mock_llm = AsyncMock()
    mock_response = MagicMock()
    mock_response.content = "Visual analysis result"
    mock_llm.ainvoke.return_value = mock_response
    
    mocker.patch("src.tools.web_scraper.ChatOpenAI", return_value=mock_llm)
    
    # Act
    result = await analyze_website_visuals.ainvoke({"url": "http://example.com"})
    
    # Assert
    assert result == "Visual analysis result"
    mock_llm.ainvoke.assert_called_once()
    mock_playwright.screenshot.assert_called_once()
