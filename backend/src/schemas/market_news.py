from typing import List, Optional
from pydantic import BaseModel

class MarketNewsError(BaseModel):
    source: str = "usda_market_news"
    error: str
    detail: Optional[str] = None

class MarketPrice(BaseModel):
    commodity: str
    variety: Optional[str] = None
    unit: str
    low_price: float
    high_price: float
    avg_price: Optional[float] = None
    date: str
    location: str

class MarketPriceResult(BaseModel):
    prices: List[MarketPrice] = []
    count: int = 0
    query_commodity: str
