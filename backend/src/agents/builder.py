import json
import logging
from typing import Dict, Any

from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END

from src.core.config import settings
from src.schemas.agent_builder import BuilderState, BrandPersona
from src.tools.domain_availability import check_domain_availability

logger = logging.getLogger(__name__)


async def generate_persona_node(state: BuilderState) -> Dict[str, Any]:
    """
    Generates a brand persona based on the farm's story and inventory.
    """
    logger.info("Executing generate_persona_node...")

    llm = ChatOpenAI(
        model=settings.OPENROUTER_DEFAULT_MODEL,
        temperature=0.7,
        openai_api_key=settings.OPENROUTER_API_KEY,
        base_url=settings.OPENROUTER_BASE_URL
    )

    prompt = f"""
    You are an expert agricultural marketing consultant.
    I need you to generate a 'Brand Persona' for a farm.

    Farm Name: {state.farm_name}
    Their Story: {state.farm_story}
    Current Inventory/Products: {state.inventory_data}

    Based on this, suggest:
    1. A 2-3 sentence narrative crafted to appeal to their target demographic (farm_story_summary).
    2. A catchy, short marketing tagline (tagline).
    3. Who this farm should be marketing to (target_audience).
    4. The recommended marketing voice, e.g., 'Warm, family-oriented' (tone_and_voice).
    5. A list of 2-3 marketing channels to focus on (recommended_channels).

    Return ONLY a valid JSON object matching this schema:
    {{
        "farm_story_summary": "string",
        "tagline": "string",
        "target_audience": "string",
        "tone_and_voice": "string",
        "recommended_channels": ["string", "string"]
    }}
    """

    try:
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        content = response.content.replace("```json", "").replace("```", "").strip()
        persona_dict = json.loads(content)
        persona = BrandPersona(**persona_dict)
        return {"brand_persona": persona}
    except Exception as e:
        logger.error(f"Error generating persona: {e}")
        # Return a fallback persona
        fallback = BrandPersona(
            farm_story_summary=f"{state.farm_name} provides fresh local produce.",
            tagline="Fresh from our farm to your table.",
            target_audience="Local community",
            tone_and_voice="Friendly and authentic",
            recommended_channels=["Local Farmers Market"]
        )
        return {"brand_persona": fallback}


async def propose_domains_node(state: BuilderState) -> Dict[str, Any]:
    """
    Suggests available domain names based on the farm name and tagline.
    """
    logger.info("Executing propose_domains_node...")
    
    farm_desc = state.brand_persona.tagline if state.brand_persona else "Local farm"
    
    # Tool returns a JSON string
    result_str = await check_domain_availability.ainvoke({
        "farm_name": state.farm_name,
        "farm_description": farm_desc
    })
    
    suggested = []
    try:
        result = json.loads(result_str)
        if result.get("status") == "success":
            suggestions = result.get("suggestions", [])
            # Prioritize available domains
            suggested = [s["domain"] for s in suggestions if s["status"] == "available"]
            # If not enough available, just suggest the first few
            if len(suggested) < 3:
                 suggested.extend([s["domain"] for s in suggestions if s["status"] != "available"])
                 suggested = suggested[:3]
        else:
            logger.warning(f"Domain tool returned error: {result}")
    except json.JSONDecodeError:
        logger.error("Failed to parse domain availability results")
        
    # Fallback if empty
    if not suggested:
        safe_name = state.farm_name.lower().replace(" ", "")
        suggested = [f"{safe_name}.com", f"{safe_name}farm.com", f"buy{safe_name}.com"]
        
    return {"suggested_domains": suggested}


async def generate_website_node(state: BuilderState) -> Dict[str, Any]:
    """
    Generates a complete HTML + Tailwind CSS landing page for the farm.
    """
    logger.info("Executing generate_website_node...")

    llm = ChatOpenAI(
        model="anthropic/claude-sonnet-4",
        temperature=0.2, # Lower temperature for code generation
        openai_api_key=settings.OPENROUTER_API_KEY,
        base_url=settings.OPENROUTER_BASE_URL
    )

    persona = state.brand_persona

    prompt = f"""
    You are an expert frontend developer and designer specializing in Tailwind CSS.
    Your task is to generate a complete, self-contained HTML page for a farm's landing page.

    Here is the farm's information:
    Farm Name: {state.farm_name}
    Tagline: {persona.tagline if persona else ''}
    Story: {persona.farm_story_summary if persona else state.farm_story}
    Voice/Tone: {persona.tone_and_voice if persona else ''}
    Inventory Items: {state.inventory_data}

    Requirements:
    1. Return a COMPLETE HTML document starting with <!DOCTYPE html>.
    2. Include the Tailwind CSS CDN via <script src="https://cdn.tailwindcss.com"></script> in the <head>.
    3. Create a beautiful, modern, responsive landing page using only plain HTML and Tailwind CSS classes.
    4. Include sections for: Hero, About Us (Story), Our Inventory (Products), and a Contact/Footer.
    5. Use placeholder images via `https://placehold.co/600x400` or similar reliable services, styled beautifully.
    6. Use inline SVG icons where needed. Do NOT use any JavaScript frameworks or external libraries besides Tailwind.
    7. Ensure the design matches the requested "Voice/Tone" (e.g. rustic, modern, boutique).
    8. Return ONLY the raw HTML. Do NOT wrap it in markdown code fences.
    """

    try:
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        # Clean up any markdown formatting just in case the LLM ignores instructions
        content = response.content
        if content.startswith("```"):
            lines = content.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            content = "\n".join(lines)

        return {"website_layouts": [content]}
    except Exception as e:
        logger.error(f"Error generating website: {e}")
        # Minimal fallback
        fallback = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><script src="https://cdn.tailwindcss.com"></script></head>
<body><div class="p-8 text-center text-red-500">Error generating layout. Please try again.</div></body></html>"""
        return {"website_layouts": [fallback]}


# --- Graph Construction ---

def build_builder_graph():
    workflow = StateGraph(BuilderState)

    workflow.add_node("generate_persona", generate_persona_node)
    workflow.add_node("propose_domains", propose_domains_node)
    workflow.add_node("generate_website", generate_website_node)

    workflow.set_entry_point("generate_persona")

    workflow.add_edge("generate_persona", "propose_domains")
    workflow.add_edge("propose_domains", "generate_website")
    workflow.add_edge("generate_website", END)

    return workflow.compile()


# For easy import and running
builder_agent = build_builder_graph()
