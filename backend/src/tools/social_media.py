import json
from langchain_core.tools import tool
from playwright.async_api import async_playwright

@tool
async def scrape_social_media(url: str) -> str:
    """
    Scrapes visible text from a given social media profile URL (e.g., Facebook, Instagram).
    In a hackathon environment, this acts as a fallback to paid APIs by attempting to 
    extract the raw text locally. It captures authentic "voice", updates, and basic context 
    which is useful for Persona Generation. Note that social media sites may block automated headless traffic.
    
    Args:
        url (str): The social media URL to scrape.
        
    Returns:
        str: A JSON string containing extracted text or a fallback response.
    """
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            # Navigate to the social media profile
            await page.goto(url, wait_until="domcontentloaded", timeout=15000)
            
            # Extract basic text content
            text = await page.evaluate("document.body.innerText")
            await browser.close()
            
            if not text or len(text.strip()) < 10:
                # Fallback if blocked
                return json.dumps({
                    "source_url": url,
                    "extracted_text": "Unable to scrape full text directly due to bot protection, but the profile exists.",
                    "status": "blocked_or_empty"
                })

            # Clean up excessive whitespace
            lines = (line.strip() for line in text.splitlines())
            clean_text = '\n'.join(line for line in lines if line)[:3000]

            return json.dumps({
                "source_url": url,
                "extracted_text": clean_text,
                "status": "success"
            }, indent=2)

    except Exception as e:
        return json.dumps({
            "error": f"Failed to scrape {url}",
            "details": str(e),
            "status": "error"
        })
