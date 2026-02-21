"""
Mock predictive pricing service.

This module will eventually use scipy.stats to perform regression analysis
and confidence interval calculations on historical CommodityPricing data.
For now it returns hard-coded results so the API layer can be developed
independently of the math service.
"""

from sqlmodel.ext.asyncio.session import AsyncSession


async def get_price_prediction(
    session: AsyncSession, crop_name: str, county: str
) -> dict | None:
    """
    Return a prediction dictionary for the given crop and county.

    Returns None when there is not enough historical data to produce a
    meaningful prediction (the endpoint should treat this as a 404).
    """

    # --- Mock data keyed by (crop_name_lower, county_lower) ---
    _mock_predictions: dict[tuple[str, str], dict] = {
        ("tomatoes", "fresno"): {
            "trend_slope": 0.12,
            "predicted_price": 4.50,
            "ci_low": 4.10,
            "ci_high": 4.90,
        },
        ("strawberries", "monterey"): {
            "trend_slope": -0.08,
            "predicted_price": 3.20,
            "ci_low": 2.85,
            "ci_high": 3.55,
        },
        ("corn", "kern"): {
            "trend_slope": 0.05,
            "predicted_price": 6.75,
            "ci_low": 6.30,
            "ci_high": 7.20,
        },
    }

    key = (crop_name.strip().lower(), county.strip().lower())
    return _mock_predictions.get(key)
