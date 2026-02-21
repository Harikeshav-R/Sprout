"""Outreach service: AI-powered email drafting for restaurant matchmaking.

Generates personalized cold outreach emails from farm data and target restaurant
information, then saves them as DRAFT records for human approval.
"""

import uuid
from typing import Optional

from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession

from src.models.outreach import OutreachEmail, OutreachEmailRead, OutreachStatus


class FarmContext(BaseModel):
    """Farm data used to personalize the outreach email."""
    farm_name: str
    location_state: str
    location_zip: str
    crops: list[str]
    website_url: Optional[str] = None


class RestaurantTarget(BaseModel):
    """Target restaurant data discovered from Google Places / menu scraping."""
    name: str
    location: str
    email: str
    menu_keywords_matched: Optional[list[str]] = None
    match_score: Optional[float] = None


def _build_email_subject(farm: FarmContext, restaurant: RestaurantTarget) -> str:
    """Build a compelling subject line."""
    return f"Fresh from {farm.farm_name} — Local Partnership Opportunity"


def _build_email_body(farm: FarmContext, restaurant: RestaurantTarget) -> str:
    """Build a personalized cold outreach email body.

    This is the AI-drafting function. In the future, this can be replaced with
    a LangGraph node that calls an LLM for even more personalized copy.
    """
    crop_list = ", ".join(farm.crops) if farm.crops else "seasonal produce"

    keyword_line = ""
    if restaurant.menu_keywords_matched:
        keywords = ", ".join(restaurant.menu_keywords_matched)
        keyword_line = (
            f"\n\nWe noticed your menu features items like {keywords} — "
            f"that aligns perfectly with what we grow."
        )

    website_line = ""
    if farm.website_url:
        website_line = f"\n\nLearn more about us at {farm.website_url}."

    body = (
        f"Hi {restaurant.name} Team,\n\n"
        f"My name is the owner of {farm.farm_name}, a local farm based in "
        f"{farm.location_state} ({farm.location_zip}). We specialize in "
        f"{crop_list} and are looking to partner with quality-focused "
        f"restaurants in the area."
        f"{keyword_line}\n\n"
        f"We'd love to set up a quick call or drop off some samples so you "
        f"can experience the freshness and quality firsthand. Our farm is "
        f"committed to sustainable practices, and we believe a partnership "
        f"would be mutually beneficial."
        f"{website_line}\n\n"
        f"Would you be open to a brief conversation this week?\n\n"
        f"Best regards,\n"
        f"{farm.farm_name}"
    )
    return body


async def draft_outreach_email(
    session: AsyncSession,
    farm_id: uuid.UUID,
    farm: FarmContext,
    restaurant: RestaurantTarget,
) -> OutreachEmailRead:
    """Generate a personalized outreach email and save it as a DRAFT.

    This is Function A of the human-in-the-loop constraint:
    it drafts but never sends.

    Args:
        session: Async database session.
        farm_id: UUID of the farm in the database.
        farm: Farm context data for personalization.
        restaurant: Target restaurant data.

    Returns:
        The newly created OutreachEmail record (status=DRAFT).
    """
    subject = _build_email_subject(farm, restaurant)
    body = _build_email_body(farm, restaurant)

    keywords_str = (
        ", ".join(restaurant.menu_keywords_matched)
        if restaurant.menu_keywords_matched
        else None
    )

    outreach = OutreachEmail(
        farm_id=farm_id,
        recipient_email=restaurant.email,
        subject=subject,
        body=body,
        restaurant_name=restaurant.name,
        restaurant_location=restaurant.location,
        match_score=restaurant.match_score,
        status=OutreachStatus.drafted,
        menu_keywords_matched=keywords_str,
    )

    session.add(outreach)
    await session.commit()
    await session.refresh(outreach)
    return OutreachEmailRead.model_validate(outreach)
