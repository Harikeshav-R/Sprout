from typing import List, Optional
from pydantic import BaseModel

class Review(BaseModel):
    """A single review from Google Places."""
    author_name: str
    rating: int
    text: str
    relative_time_description: str
    original_text: str  # The raw text (often same as text)
    highlighted: bool = False  # If it matches our keywords

class ReviewAnalysisResult(BaseModel):
    """Result of the review analysis."""
    place_id: str
    total_reviews_scanned: int
    relevant_reviews_found: int
    reviews: List[Review]
    sentiment_summary: Optional[str] = None
    error: Optional[str] = None
