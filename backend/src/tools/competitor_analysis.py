import json

from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI

from src.core.config import settings
from src.tools.google_places_api import search_nearby_businesses
from src.tools.web_scraper import scrape_website_content


@tool
async def analyze_competitor_gap(latitude: float, longitude: float, farm_name: str, farm_offerings: str) -> str:
    """
    Finds the 3 nearest competing farms or local food businesses, scrapes their sites
    (if they have one), and generates a competitive advantage report using an LLM.
    
    Args:
        latitude (float): The latitude of the target farm.
        longitude (float): The longitude of the target farm.
        farm_name (str): The name of the target farm.
        farm_offerings (str): What the target farm sells (e.g. "organic eggs, CSAs").
        
    Returns:
        str: A JSON string containing the competitor analysis report.
    """
    if not settings.OPENROUTER_API_KEY:
        return json.dumps({"error": "No OPENROUTER_API_KEY available for analysis.", "status": "error"})

    try:
        # 1. Broadly search for similar local businesses (competitors)
        nearby_raw = await search_nearby_businesses.ainvoke({
            "latitude": latitude,
            "longitude": longitude,
            "keyword": "farm fresh produce CSA",
            "radius_meters": 25000  # ~15 miles
        })

        try:
            competitors = json.loads(nearby_raw)
        except json.JSONDecodeError:
            return json.dumps({"error": "Failed to parse Google Places response.", "status": "error"})

        if not competitors or not isinstance(competitors, list):
            return json.dumps({"status": "success", "message": "No direct local competitors found within 15 miles."})

        # Filter out self
        targets = [c for c in competitors if farm_name.lower() not in c.get('name', '').lower()][:3]

        if not targets:
            return json.dumps({"status": "success", "message": "No other local competitors found."})

        # 2. Gather info on those competitors
        competitor_profiles = []
        for c in targets:
            profile = {
                "name": c.get("name"),
                "vicinity": c.get("vicinity"),
                "rating": c.get("rating"),
                "num_reviews": c.get("user_ratings_total"),
                "website": c.get("website")
            }

            # Scrape content if they have a website
            if profile["website"] and "http" in profile["website"]:
                scraped_raw = await scrape_website_content.ainvoke({"url": profile["website"]})
                try:
                    scraped_data = json.loads(scraped_raw)
                    if "extracted_text" in scraped_data:
                        # Just grab a snippet
                        profile["website_snippet"] = scraped_data["extracted_text"][:500]
                except:
                    pass
            competitor_profiles.append(profile)

        # 3. Analyze differences to find the "gap"
        llm = ChatOpenAI(
            model="google/gemini-2.5-flash",
            temperature=0.2,
            openai_api_key=settings.OPENROUTER_API_KEY,
            base_url=settings.OPENROUTER_BASE_URL
        )

        prompt = f"""
        You are a farm marketing strategist. You are advising "{farm_name}", which sells: "{farm_offerings}".
        
        Here is data on {len(competitor_profiles)} of their closest local competitors:
        {json.dumps(competitor_profiles, indent=2)}
        
        Analyze this competitor data and provide a concise "Competitive Advantage Report" for {farm_name}. 
        Identify gaps in the local market (e.g., poor competitor websites, low reviews, lack of specific offerings) 
        and suggest 3 clear positioning statements {farm_name} can use to stand out.
        
        Return the result as a raw JSON object (without markdown wrapping) with exactly two keys:
        "market_gaps": array of strings (e.g., "Competitor X lacks mobile website")
        "positioning_recommendations": array of strings
        """

        response = await llm.ainvoke([HumanMessage(content=prompt)])

        # Clean markdown if generated
        text = str(response.content).strip()
        if text.startswith("```json"):
            text = text[7:]
            if text.endswith("```"):
                text = text[:-3]

        report = json.loads(text.strip())

        return json.dumps({
            "target_farm": farm_name,
            "competitors_analyzed": len(competitor_profiles),
            "report": report,
            "status": "success"
        }, indent=2)

    except Exception as e:
        return json.dumps({
            "error": "Failed to analyze competitor gap.",
            "details": str(e),
            "status": "error"
        })
