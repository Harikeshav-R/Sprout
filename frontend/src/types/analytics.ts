export interface PricePrediction {
  crop_name: string;
  county: string;
  trend_slope: number;
  predicted_price: number;
  pi_low: number;
  pi_high: number;
  plain_language_insight: string;
}

export interface InventoryItem {
  id: string;
  farm_id: string;
  crop_name: string;
  quantity: number;
  unit: string;
  last_updated: string;
}
