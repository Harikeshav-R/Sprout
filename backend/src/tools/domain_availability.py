import json
import socket

from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI

from src.core.config import settings


def _domain_resolves(domain: str) -> bool:
    """Helper to check if a domain has any DNS A/AAAA records resolving."""
    try:
        # If it resolves, it's taken or parked.
        socket.gethostbyname(domain)
        return True
    except socket.gaierror:
        # If we get a Name or service not known, it's likely available
        return False


@tool
async def check_domain_availability(farm_name: str, farm_description: str) -> str:
    """
    Proactively proposes 3 available, catchy '.com' domain names based on the 
    farm's name and a brief description of what they sell. 
    It generates candidates using an LLM and then verifies basic availability 
    via DNS resolution checks.
    
    Args:
        farm_name (str): The name of the farm.
        farm_description (str): A brief description of the farm (e.g., "Organic heirloom tomatoes and CSA").
        
    Returns:
        str: A JSON string containing suggested domains and their availability status.
    """
    if not settings.OPENROUTER_API_KEY:
        return json.dumps({"error": "No OPENROUTER_API_KEY available for domain generation.", "status": "error"})

    llm = ChatOpenAI(
        model="google/gemini-2.5-flash",
        temperature=0.7,
        openai_api_key=settings.OPENROUTER_API_KEY,
        base_url=settings.OPENROUTER_BASE_URL
    )

    prompt = f"""
    You are an expert branding consultant. A farm named "{farm_name}" needs a new website. 
    They specialize in: "{farm_description}".
    
    Please suggest exact 5 creative, short, and memorable .com domain names for them. 
    Do not include any prefixes like https:// or www., just the domain (e.g., sunnyfarms.com).
    Return ONLY a comma-separated list of the 5 domains, nothing else.
    """

    try:
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        raw_domains = str(response.content).strip().split(",")

        # Clean up output
        candidate_domains = [d.strip().lower() for d in raw_domains if ".com" in d][:5]

        results = []
        available_count = 0

        for domain in candidate_domains:
            # Check if domain resolves
            is_taken = _domain_resolves(domain)
            results.append({
                "domain": domain,
                "status": "taken" if is_taken else "available"
            })
            if not is_taken:
                available_count += 1

            # Stop early if we found 3 available domains
            if available_count >= 3:
                break

        return json.dumps({
            "farm_name": farm_name,
            "suggestions": results,
            "status": "success"
        }, indent=2)

    except Exception as e:
        return json.dumps({
            "error": "Failed to generate or check domains.",
            "details": str(e),
            "status": "error"
        })
