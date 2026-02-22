import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession

from src import crud
from src.agents.discovery import discovery_agent
from src.db.session import get_session
from src.schemas.farm import FarmCreate, FarmRead

router = APIRouter()


class DiscoverRequest(BaseModel):
    farm_name: str = "My Farm"
    farm_offerings: str = "organic produce"
    zip_code: Optional[str] = None
    state: Optional[str] = None


@router.post("/discover", response_model=dict)
async def discover_farms(body: DiscoverRequest):
    """
    Trigger the autonomous Discovery Agent to find farms in a specific location.
    This process:
    1. Queries USDA databases (Farmers Markets & CSAs).
    2. Enriches data with Google Places (Business info, Websites).
    3. Audits digital presence (Score < 50 = Target Lead).
    4. Analyzes market gaps and generates SEO keywords.
    """
    if not body.zip_code and not body.state:
        raise HTTPException(status_code=400, detail="Must provide zip_code or state.")

    initial_state = {
        "search_criteria": {
            "farm_name": body.farm_name,
            "farm_offerings": body.farm_offerings,
            "zip_code": body.zip_code,
            "state": body.state,
        },
        "raw_competitors": [],
        "enriched_competitors": [],
        "audited_competitors": [],
        "errors": []
    }

    # Run the LangGraph agent
    final_state = await discovery_agent.ainvoke(initial_state)

    # Ensure we're working with a dict
    if hasattr(final_state, "model_dump"):
        final_state_dict = final_state.model_dump()
    else:
        final_state_dict = final_state

    return {
        "message": "Discovery complete",
        "total_found": len(final_state_dict.get("raw_competitors", [])),
        "audited": len(final_state_dict.get("audited_competitors", [])),
        "leads": final_state_dict.get("audited_competitors", []),
        "market_gap_report": final_state_dict.get("market_gap_report"),
        "seo_report": final_state_dict.get("seo_report"),
    }


@router.post("/", response_model=FarmRead)
async def create_farm(*, session: AsyncSession = Depends(get_session), farm_in: FarmCreate):
    return await crud.create_farm(session, farm_in)


@router.get("/", response_model=List[FarmRead])
async def read_farms(session: AsyncSession = Depends(get_session), offset: int = 0, limit: int = 100):
    return await crud.get_farms(session, offset=offset, limit=limit)


@router.get("/{id}", response_model=FarmRead)
async def read_farm(*, session: AsyncSession = Depends(get_session), id: uuid.UUID):
    farm = await crud.get_farm(session, id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return farm
