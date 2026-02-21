from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Sprout API"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@db:5432/sprout"

    # Google Maps / Places API
    GOOGLE_MAPS_API_KEY: str = ""

    # LLM API Keys
    OPENROUTER_API_KEY: str | None = None
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

    # USDA Local Food Directories API
    # Base URL for the USDA Local Food Portal (no trailing slash).
    USDA_API_BASE_URL: str = "https://www.usdalocalfoodportal.com"
    # Optional API key — leave unset (None) to omit the apikey param entirely.
    USDA_API_KEY: str | None = None

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


settings = Settings()
