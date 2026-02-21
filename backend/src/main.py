from fastapi import FastAPI
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@db:5432/sprout"


settings = Settings()
app = FastAPI(title="Sprout API")


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Welcome to Sprout API"}
