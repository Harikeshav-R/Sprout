import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Sprout API"
    API_V1_STR: str = "/api/v1"

    # Database
    POSTGRES_SERVER: str = "db"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "sprout"
    POSTGRES_PORT: str = "5432"

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+psycopg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Google Maps / Places API
    GOOGLE_MAPS_API_KEY: str = ""
    GOOGLE_MAPS_GEOCODING_URL: str = "https://maps.googleapis.com/maps/api/geocode/json"
    GOOGLE_PLACES_TEXT_SEARCH_URL: str = "https://places.googleapis.com/v1/places:searchText"
    GOOGLE_PLACES_DETAILS_BASE_URL: str = "https://places.googleapis.com/v1/places"

    # LLM API Keys
    OPENROUTER_API_KEY: str | None = None
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_DEFAULT_MODEL: str = "google/gemini-2.5-flash-lite"

    # USDA Local Food Directories API
    # Base URL for the USDA Local Food Portal (no trailing slash).
    USDA_API_BASE_URL: str = "https://www.usdalocalfoodportal.com"
    # Optional API key — leave unset (None) to omit the apikey param entirely.
    USDA_API_KEY: str | None = None

    # Gmail API (for outreach email sending)
    GMAIL_CREDENTIALS_PATH: str = "credentials.json"
    GMAIL_TOKEN_PATH: str = "token.json"
    # Third-party Enrichment APIs (Phase 2 SDR)
    HUNTER_API_KEY: str | None = None
    HUNTER_API_BASE_URL: str = "https://api.hunter.io/v2"
    
    SERPAPI_API_KEY: str | None = None  # For LinkedIn/Google Search/Events
    SERPAPI_BASE_URL: str = "https://serpapi.com"

    # Phase 3: Market Intelligence & Weather
    USDA_MARKET_NEWS_API_KEY: str | None = None
    USDA_MARKET_NEWS_BASE_URL: str = "https://marsapi.ams.usda.gov/services/v1.2"
    WEATHER_API_KEY: str | None = None  # OpenWeatherMap or similar
    WEATHER_API_BASE_URL: str = "https://api.openweathermap.org/data/2.5"

    _env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
    if not os.path.exists(_env_file):
        _env_file = None

    model_config = SettingsConfigDict(
        env_file=_env_file,
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
