import base64
import json

from bs4 import BeautifulSoup
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from playwright.async_api import async_playwright

from src.core.config import settings


@tool
async def scrape_website_content(url: str) -> str:
    """
    Scrapes the text content and attempts to find contact information from a given URL.
    This is useful for gathering raw information about a farm from their existing website.
    
    Args:
        url (str): The URL of the website to scrape.
        
    Returns:
        str: A JSON string containing the extracted text and potential contact info.
    """
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()

            # Navigate to the URL and wait for it to load
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)

            # Extract full HTML content
            html_content = await page.content()
            await browser.close()

            # Parse HTML with BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')

            # Remove scripts, styles, and other non-visible elements
            for element in soup(["script", "style", "meta", "noscript", "header", "footer", "nav"]):
                element.decompose()

            # Get text and clean it up
            text = soup.get_text(separator='\n')

            # Basic cleanup: remove excessive blank lines and whitespace
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            clean_text = '\n'.join(chunk for chunk in chunks if chunk)

            # Attempt to extract crude contact info (emails, phones) from hrefs
            contact_info = []
            for a_tag in BeautifulSoup(html_content, 'html.parser').find_all('a', href=True):
                href = a_tag['href']
                if href.startswith('mailto:') or href.startswith('tel:'):
                    contact_info.append(href)

            result = {
                "source_url": url,
                "extracted_text": clean_text[:5000],  # Limit text size to avoid massive contexts
                "potential_contact_links": list(set(contact_info))
            }

            return json.dumps(result, indent=2)

    except Exception as e:
        return json.dumps({"error": f"Failed to scrape {url}: {str(e)}"})


@tool
async def analyze_website_visuals(url: str) -> str:
    """
    Takes a full-page screenshot of the provided website and uses a multimodal LLM to 
    analyze its visual style, layout, and areas for improvement. It then returns a 
    structured prompt that can be fed to a code-generation LLM to build a new, modern website.
    
    Args:
        url (str): The URL of the farmer's website.
        
    Returns:
        str: A comprehensive visual critique and a generated prompt for the Website Builder agent.
    """
    try:
        if not settings.OPENROUTER_API_KEY:
            return "Error: No OPENROUTER_API_KEY provided in configuration."

        screenshot_bytes = None
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()

            # Navigate and capture a full page screenshot
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            screenshot_bytes = await page.screenshot(full_page=True, type='jpeg', quality=70)
            await browser.close()

        if not screenshot_bytes:
            return f"Error: Failed to capture snapshot of {url}."

        # Encode the image to base64
        base64_image = base64.b64encode(screenshot_bytes).decode('utf-8')

        # Use OpenRouter for multimodal analysis
        llm = ChatOpenAI(
            model=settings.OPENROUTER_DEFAULT_MODEL,
            temperature=0.2,
            openai_api_key=settings.OPENROUTER_API_KEY,
            base_url=settings.OPENROUTER_BASE_URL
        )

        prompt = f"""
        You are an expert web designer and developer analyzing an existing farm business website.
        
        Website URL: {url}
        
        Please analyze the provided screenshot and perform the following tasks:
        1. **Critique current state**: Briefly describe the website's visual style, color palette, typography, layout, and identify its major flaws (e.g., lack of mobile responsiveness, poor contrast).
        2. **Generate rebuilding prompt**: Provide a detailed, structured prompt that can be given to an AI code-generator (like a React/Tailwind expert) to completely rebuild this website into a modern, high-converting farm-to-table landing page. 
           The generated prompt must include instructions on desired aesthetics (e.g., rustic, modern, vibrant), layout structures (e.g., hero section, about us, contact), and specific color schemes inspired by agriculture.
           
        Format your response clearly.
        """

        message = HumanMessage(
            content=[
                {"type": "text", "text": prompt},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"},
                },
            ]
        )

        response = await llm.ainvoke([message])
        return str(response.content)

    except Exception as e:
        return f"Failed to visually analyze {url}: {str(e)}"
