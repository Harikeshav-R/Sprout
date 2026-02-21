from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import SQLModel
from typing import AsyncGenerator
from src.core.config import settings

# Engine configuration for async postgres via psycopg3
engine = create_async_engine(settings.DATABASE_URL, echo=False)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSession(engine) as session:
        yield session

async def init_db():
    # Only for local dev testing
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
