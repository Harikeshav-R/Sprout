from fastapi import APIRouter

from src.api.v1.endpoints import farms, inventory, pricing, transactions, outreach

api_router = APIRouter()
api_router.include_router(farms.router, prefix="/farms", tags=["farms"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(pricing.router, prefix="/pricing", tags=["pricing"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
api_router.include_router(outreach.router, prefix="/outreach", tags=["outreach"])
