from typing import List, Optional
from pydantic import BaseModel, Field


class BrandPersona(BaseModel):
    """
    Generated marketing persona based on farm's story and inventory.
    """
    farm_story_summary: str = Field(description="A 2-3 sentence narrative crafted to appeal to their target demographic.")
    tagline: str = Field(description="A catchy, short marketing tagline (e.g., 'Pasture-raised, neighbor-trusted').")
    target_audience: str = Field(description="Who this farm should be marketing to.")
    tone_and_voice: str = Field(description="The recommended marketing voice (e.g., 'Warm, family-oriented').")
    recommended_channels: List[str] = Field(description="A list of marketing channels to focus on.")


class BuilderState(BaseModel):
    """
    The state for the Builder LangGraph agent.
    """
    farm_id: str
    farm_name: str
    farm_story: str
    inventory_data: str
    
    # Internal agent data passed between nodes
    brand_persona: Optional[BrandPersona] = None
    suggested_domains: List[str] = []
    
    # Final generated React SPA component code
    website_layouts: List[str] = []
