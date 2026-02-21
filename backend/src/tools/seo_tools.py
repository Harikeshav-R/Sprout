import json

from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI

from src.core.config import settings


@tool
async def fetch_local_seo_keywords(zip_code: str, farm_type: str) -> str:
    """
    Acts as a mock for a localized SEO keyword API (like DataForSEO). 
    It takes the local zip code and the type of farm and uses an LLM to generate 
    a hyper-local list of relevant search keywords and their estimated search volumes, 
    so the generation agent knows exactly what to optimize the website for.
    
    Args:
        zip_code (str): The zip code of the farm area.
        farm_type (str): The type of farm or primary product (e.g., "CSA", "Grass-fed Beef").
        
    Returns:
        str: A JSON string containing suggested keywords and search volumes.
    """
    if not settings.OPENROUTER_API_KEY:
        return json.dumps({"error": "No OPENROUTER_API_KEY available for SEO generation.", "status": "error"})

    llm = ChatOpenAI(
        model="google/gemini-2.5-flash",
        temperature=0.4,
        openai_api_key=settings.OPENROUTER_API_KEY,
        base_url=settings.OPENROUTER_BASE_URL
    )

    prompt = f"""
    You are an expert SEO data platform. Provide a list of the top 5 highly localized 
    search queries that people in or near zip code "{zip_code}" would use to find a "{farm_type}".
    
    For each query, estimate a realistic monthly search volume (e.g. 50, 150, 500) and 
    a difficulty score (1-100).
    
    Return the result as a raw JSON object (without markdown wrapping) in this exact format:
    {{
      "zip_code": "{zip_code}",
      "farm_type": "{farm_type}",
      "keywords": [
         {{"query": "organic csa near me [city]", "volume": 120, "difficulty": 45}},
         ...
      ]
    }}
    """

    try:
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        text = str(response.content).strip()

        # Clean markdown if generated
        if text.startswith("```json"):
            text = text[7:]
            if text.endswith("```"):
                text = text[:-3]

        data = json.loads(text.strip())

        return json.dumps({
            "seo_data": data,
            "status": "success"
        }, indent=2)

    except Exception as e:
        return json.dumps({
            "error": "Failed to generate local SEO keywords.",
            "details": str(e),
            "status": "error"
        })
