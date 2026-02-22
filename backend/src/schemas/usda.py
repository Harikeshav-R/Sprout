from pydantic import BaseModel, Field


class USDABaseListing(BaseModel):
    """Fields present on every USDA Local Food Directory listing type."""

    listing_id: str | None = None
    listing_name: str | None = None
    listing_description: str | None = None
    location_address: str | None = None
    location_city: str | None = None
    location_state: str | None = None
    location_zipcode: str | None = None
    # The API returns coordinates as strings ("longitude", "latitude").
    location_x: str | None = None  # longitude
    location_y: str | None = None  # latitude
    contact_email: str | None = None
    contact_phone: str | None = None
    contact_website: str | None = None

    model_config = {"extra": "ignore"}  # silently drop unknown API fields


class FarmersMarketListing(USDABaseListing):
    """
    Farmers Market–specific fields from /api/farmersmarket/.

    Season fields capture open/close dates and hours for up to four seasons.
    Payment flags are "Y" / "N" strings as returned by the USDA API.
    """

    season1date: str | None = None
    season1time: str | None = None
    season2date: str | None = None
    season2time: str | None = None
    season3date: str | None = None
    season3time: str | None = None
    season4date: str | None = None
    season4time: str | None = None
    # Payment / benefit program acceptance
    credit: str | None = None  # credit / debit cards
    wic: str | None = None  # WIC programme vouchers
    wiccash: str | None = None  # WIC FMNP cash
    snap: str | None = None  # SNAP / EBT


class CSAListing(USDABaseListing):
    """CSA-specific fields from /api/csa/."""

    brief_desc: str | None = None
    delivery_option: str | None = None
    on_farm_pickup: str | None = None
    payment_option: str | None = None
    distribution_type: str | None = None


class FarmersMarketSearchResult(BaseModel):
    """Structured result returned to the agent after a farmers-market search."""

    source: str = "farmersmarket"
    query_zip: str | None = None
    query_state: str | None = None
    query_radius_miles: int | None = None
    count: int = 0
    listings: list[FarmersMarketListing] = Field(default_factory=list)


class CSASearchResult(BaseModel):
    """Structured result returned to the agent after a CSA search."""

    source: str = "csa"
    query_zip: str | None = None
    query_state: str | None = None
    query_radius_miles: int | None = None
    count: int = 0
    listings: list[CSAListing] = Field(default_factory=list)


class USDAToolError(BaseModel):
    """
    Returned instead of raising an exception when the upstream USDA API is
    unavailable or returns an error.  The LangGraph agent can inspect this
    and decide how to recover without the graph crashing.
    """

    source: str
    error: str
    detail: str | None = None
