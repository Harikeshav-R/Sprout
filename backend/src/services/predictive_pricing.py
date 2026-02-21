"""
Predictive Pricing Analytics Service (Phase 4)

Performs regression analysis and confidence interval calculations on
historical CommodityPricing data using scipy.stats and numpy.
Inspired by: https://nbviewer.org/github/Mo-Khalifa96/Data-Analysis-and-Machine-Learning-for-Predictive-Pricing
"""

from datetime import date as datetime_date

import numpy as np
from pydantic import BaseModel
from scipy.stats import linregress, t
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.models.pricing import CommodityPricing


class PricingAnalyticsResult(BaseModel):
    """Output schema for predictive pricing analytics."""

    crop_name: str
    county: str
    data_points: int
    trend_slope: float
    current_average: float
    predicted_next_price: float
    confidence_interval_low: float
    confidence_interval_high: float
    moving_averages: list[float]


class InsufficientDataResult(BaseModel):
    """Returned when there is not enough historical data."""

    crop_name: str
    county: str
    data_points: int
    message: str = "Not enough data for statistical significance"


class PricingAnalyticsService:
    """Async service that fetches historical commodity prices and produces
    trend analysis, moving-average smoothing, and confidence intervals."""

    MIN_DATA_POINTS = 3
    MOVING_AVERAGE_WINDOW = 3
    CONFIDENCE_LEVEL = 0.95

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def _fetch_prices(
        self, crop_name: str, county: str
    ) -> list[CommodityPricing]:
        """Fetch all historical prices for a crop/county pair, ordered by date."""
        statement = (
            select(CommodityPricing)
            .where(CommodityPricing.crop_name == crop_name)
            .where(CommodityPricing.county == county)
            .order_by(CommodityPricing.date)
        )
        result = await self._session.exec(statement)
        return list(result.all())

    async def analyze(
        self, crop_name: str, county: str
    ) -> PricingAnalyticsResult | InsufficientDataResult:
        """Run full predictive analytics pipeline for a crop in a county.

        Steps:
        1. Fetch historical prices from the database.
        2. If fewer than MIN_DATA_POINTS, return an insufficient-data response.
        3. Convert dates to ordinal numbers for regression.
        4. Compute linear regression (trend slope + predicted next price).
        5. Compute moving averages over a rolling window.
        6. Compute 95% confidence interval for the next predicted price using
           the t-distribution and the standard error of the residuals.
        """
        records = await self._fetch_prices(crop_name, county)

        if len(records) < self.MIN_DATA_POINTS:
            return InsufficientDataResult(
                crop_name=crop_name,
                county=county,
                data_points=len(records),
            )

        prices = np.array([r.price for r in records], dtype=np.float64)
        dates_ordinal = np.array(
            [r.date.toordinal() for r in records], dtype=np.float64
        )

        # --- Linear Regression ---
        slope, intercept, r_value, p_value, std_err = linregress(
            dates_ordinal, prices
        )

        # Predict next price: one day after the last observed date
        last_date = records[-1].date
        next_ordinal = float(last_date.toordinal() + 1)
        predicted_next_price = intercept + slope * next_ordinal

        # --- Moving Averages ---
        moving_averages = self._moving_average(prices, self.MOVING_AVERAGE_WINDOW)

        # --- Current Average ---
        current_average = float(np.mean(prices))

        # --- Confidence Interval ---
        ci_low, ci_high = self._confidence_interval(
            prices, dates_ordinal, slope, intercept, next_ordinal
        )

        return PricingAnalyticsResult(
            crop_name=crop_name,
            county=county,
            data_points=len(records),
            trend_slope=round(slope, 6),
            current_average=round(current_average, 2),
            predicted_next_price=round(predicted_next_price, 2),
            confidence_interval_low=round(ci_low, 2),
            confidence_interval_high=round(ci_high, 2),
            moving_averages=[round(v, 2) for v in moving_averages],
        )

    @staticmethod
    def _moving_average(prices: np.ndarray, window: int) -> list[float]:
        """Compute simple moving average with the given window size."""
        if len(prices) < window:
            return prices.tolist()
        cumsum = np.cumsum(prices)
        cumsum[window:] = cumsum[window:] - cumsum[:-window]
        return (cumsum[window - 1 :] / window).tolist()

    @staticmethod
    def _confidence_interval(
        prices: np.ndarray,
        x: np.ndarray,
        slope: float,
        intercept: float,
        x_next: float,
    ) -> tuple[float, float]:
        """Calculate 95% confidence interval for the predicted next price.

        Uses the t-distribution to account for small-sample uncertainty.
        Handles the zero-variance edge case (all prices identical) by
        returning the predicted price as both bounds.
        """
        n = len(prices)
        residuals = prices - (intercept + slope * x)
        residual_std = float(np.std(residuals, ddof=2)) if n > 2 else 0.0

        # Zero-variance / constant-price edge case
        if residual_std == 0.0:
            predicted = intercept + slope * x_next
            return (float(predicted), float(predicted))

        # Degrees of freedom for a 2-parameter linear model
        df = n - 2

        # Standard error of the prediction at x_next
        x_mean = float(np.mean(x))
        ss_x = float(np.sum((x - x_mean) ** 2))

        # Guard against degenerate x data (all same date)
        if ss_x == 0.0:
            predicted = intercept + slope * x_next
            return (float(predicted), float(predicted))

        se_pred = residual_std * np.sqrt(
            1.0 + 1.0 / n + (x_next - x_mean) ** 2 / ss_x
        )

        predicted = intercept + slope * x_next

        # t critical value for 95% two-tailed interval
        t_crit = t.ppf((1 + 0.95) / 2, df)
        margin = t_crit * se_pred

        return (float(predicted - margin), float(predicted + margin))
