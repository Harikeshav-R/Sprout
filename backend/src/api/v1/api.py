from fastapi import APIRouter
from src.api.v1.endpoints import farms

api_router = APIRouter()
api_router.include_router(farms.router, prefix="/farms", tags=["farms"])
