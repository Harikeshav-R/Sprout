import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlmodel.ext.asyncio.session import AsyncSession

from src import crud
from src.agents.discovery import discovery_agent
from src.db.session import get_session
from src.schemas.farm import FarmCreate, FarmRead

router = APIRouter()


@router.post("/discover", response_model=dict)
async def discover_farms(
        zip_code: Optional[str] = Body(None),
        state: Optional[str] = Body(None),
):
    """
    Trigger the autonomous Discovery Agent to find farms in a specific location.
    This process:
    1. Queries USDA databases (Farmers Markets & CSAs).
    2. Enriches data with Google Places (Business info, Websites).
    3. Audits digital presence (Score < 50 = Target Lead).
    4. Saves high-priority targets to the database.
    """
    if not zip_code and not state:
        raise HTTPException(status_code=400, detail="Must provide zip_code or state.")

    # Input state can still be a dict; LangGraph will coerce it or we can pass a model
    initial_state = {
        "search_criteria": {"zip_code": zip_code, "state": state},
        "raw_leads": [],
        "enriched_leads": [],
        "audited_leads": [],
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
        "total_found": len(final_state_dict.get("raw_leads", [])),
        "audited": len(final_state_dict.get("audited_leads", [])),
        "leads": final_state_dict.get("audited_leads", [])
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
