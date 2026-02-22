from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any

from src.agents.builder import builder_agent
from src.schemas.agent_builder import BuilderState

router = APIRouter()

@router.post("/build/{farm_id}", response_model=Dict[str, Any])
async def build_farm_website(farm_id: str, request: dict):
    """
    Triggers the LangGraph Phase 2 Asset Generation pipeline for a specific farm.
    Generates a Brand Persona, proposes domains, and generates a prototype React SPA layout.
    
    Request body must contain:
    - farm_name (str)
    - farm_story (str)
    - inventory_data (str)
    """
    farm_name = request.get("farm_name")
    farm_story = request.get("farm_story")
    inventory_data = request.get("inventory_data")
    
    if not farm_name or not farm_story or not inventory_data:
        raise HTTPException(
            status_code=400, 
            detail="farm_name, farm_story, and inventory_data are required fields."
        )
    
    # Initialize the LangGraph state
    initial_state: BuilderState = {
        "farm_id": farm_id,
        "farm_name": farm_name,
        "farm_story": farm_story,
        "inventory_data": inventory_data,
        "brand_persona": None,
        "suggested_domains": [],
        "website_layouts": []
    }
    
    try:
        # Run the agent pipeline
        final_state = await builder_agent.ainvoke(initial_state)
        
        # Serialize the BrandPersona Pydantic model for JSON response
        persona_dump = final_state.get("brand_persona")
        if persona_dump:
             persona_dump = persona_dump.model_dump()
        
        return {
            "status": "success",
            "data": {
                "farm_id": final_state.get("farm_id"),
                "farm_name": final_state.get("farm_name"),
                "brand_persona": persona_dump,
                "suggested_domains": final_state.get("suggested_domains", []),
                "website_layout": final_state.get("website_layouts", [""])[0] 
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
