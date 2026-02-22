"""
Seed script to populate CommodityPricing with realistic historical pricing data.

Usage:
    DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5432/sprout" \
        uv run python -m scripts.seed_pricing_data

Idempotent — uses ON CONFLICT DO NOTHING on the (crop_name, county, date) unique constraint.
"""

import asyncio
import random
from datetime import date, timedelta

from sqlalchemy import text
from sqlmodel.ext.asyncio.session import AsyncSession

from src.db.session import engine, init_db
from src.models.pricing import CommodityPricing


# Realistic organic produce price ranges and seasonal patterns
CROPS = {
    "Tomatoes": {"base": 3.00, "amplitude": 0.60, "trend": 0.005, "noise": 0.15},
    "Zucchini": {"base": 2.50, "amplitude": 0.50, "trend": 0.008, "noise": 0.12},
    "Bell Peppers": {"base": 3.50, "amplitude": 0.40, "trend": 0.003, "noise": 0.18},
    "Cucumbers": {"base": 2.20, "amplitude": 0.35, "trend": 0.006, "noise": 0.10},
}

COUNTY = "Multnomah"
UNIT = "lb"
DAYS_OF_HISTORY = 60


def generate_price(cfg: dict, day_index: int) -> float:
    """Generate a realistic price with seasonal variation, trend, and noise."""
    import math

    seasonal = cfg["amplitude"] * math.sin(2 * math.pi * day_index / 90)
    trend = cfg["trend"] * day_index
    noise = random.gauss(0, cfg["noise"])
    price = cfg["base"] + seasonal + trend + noise
    return round(max(0.50, price), 2)


async def seed():
    # Ensure tables exist (for local dev)
    await init_db()

    today = date.today()
    start_date = today - timedelta(days=DAYS_OF_HISTORY)

    records = []
    for crop_name, cfg in CROPS.items():
        for day_offset in range(DAYS_OF_HISTORY + 1):
            record_date = start_date + timedelta(days=day_offset)
            price = generate_price(cfg, day_offset)
            records.append(
                {
                    "crop_name": crop_name,
                    "county": COUNTY,
                    "date": record_date,
                    "price": price,
                    "unit": UNIT,
                }
            )

    async with AsyncSession(engine) as session:
        # Bulk upsert using ON CONFLICT DO NOTHING for idempotency
        stmt = text("""
            INSERT INTO commoditypricing (id, crop_name, county, date, price, unit)
            VALUES (gen_random_uuid(), :crop_name, :county, :date, :price, :unit)
            ON CONFLICT ON CONSTRAINT uq_commodity_pricing DO NOTHING
        """)
        await session.exec(stmt, params=records)  # type: ignore[arg-type]
        await session.commit()

    total = len(records)
    print(f"Seeded {total} pricing records for {len(CROPS)} crops in {COUNTY} county.")
    print(f"Date range: {start_date} to {today}")
    print("Done! (Duplicates were skipped.)")


if __name__ == "__main__":
    asyncio.run(seed())
