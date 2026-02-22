from src.schemas.events import EventResult, EventError
from src.schemas.market_news import MarketPriceResult, MarketNewsError
from src.schemas.weather import WeatherResult, WeatherError
from src.tools.competitor_analysis import analyze_competitor_gap
from src.tools.domain_availability import check_domain_availability
from src.tools.email_finder import find_decision_maker_email
from src.tools.events import search_local_food_events
from src.tools.google_places_api import search_nearby_businesses
from src.tools.linkedin_finder import search_linkedin_profiles
# Phase 3: Market Intelligence & Weather
from src.tools.market_news import fetch_usda_ams_pricing
from src.tools.review_analyzer import analyze_restaurant_reviews
from src.tools.seo_tools import fetch_local_seo_keywords
from src.tools.social_media import scrape_social_media
from src.tools.usda_api import (
    search_all_local_food,
    search_csa,
    search_farmers_markets,
)
from src.schemas.usda import (
    # Pydantic models exported so agent nodes can type-check results directly
    CSAListing,
    CSASearchResult,
    FarmersMarketListing,
    FarmersMarketSearchResult,
    USDAToolError,
)
from src.tools.weather import fetch_agricultural_weather
from src.tools.web_scraper import scrape_website_content, analyze_website_visuals

# Export Langchain Tools
TOOLS = [
    search_all_local_food,
    search_csa,
    search_farmers_markets,
    search_nearby_businesses,
    scrape_website_content,
    analyze_website_visuals,
    scrape_social_media,
    check_domain_availability,
    analyze_competitor_gap,
    fetch_local_seo_keywords,
    find_decision_maker_email,
    analyze_restaurant_reviews,
    search_linkedin_profiles,
    # Phase 3 Tools
    fetch_usda_ams_pricing,
    fetch_agricultural_weather,
    search_local_food_events,
]

__all__ = [
    "search_all_local_food",
    "search_csa",
    "search_farmers_markets",
    "search_nearby_businesses",
    "scrape_website_content",
    "analyze_website_visuals",
    "scrape_social_media",
    "check_domain_availability",
    "analyze_competitor_gap",
    "fetch_local_seo_keywords",
    "find_decision_maker_email",
    "analyze_restaurant_reviews",
    "search_linkedin_profiles",
    "fetch_usda_ams_pricing",
    "fetch_agricultural_weather",
    "search_local_food_events",
    "TOOLS",
    "CSAListing",
    "CSASearchResult",
    "FarmersMarketListing",
    "FarmersMarketSearchResult",
    "USDAToolError",
    "MarketPriceResult",
    "MarketNewsError",
    "WeatherResult",
    "WeatherError",
    "EventResult",
    "EventError",
]
