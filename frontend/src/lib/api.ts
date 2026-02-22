import type { PricePrediction, InventoryItem } from '../types/analytics';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// --- Phase 3: Predictive Analytics ---

export async function fetchPredictivePricing(cropName: string, county: string): Promise<PricePrediction> {
  const res = await fetch(
    `${API_BASE}/api/v1/analytics/predictive-pricing?crop_name=${encodeURIComponent(cropName)}&county=${encodeURIComponent(county)}`
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchInventory(farmId: string): Promise<InventoryItem[]> {
  const res = await fetch(`${API_BASE}/api/v1/inventory/?farm_id=${encodeURIComponent(farmId)}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// --- Phase 1: Discovery & Audit ---

export interface CompetitorFarm {
  farm_name: string;
  location_state: string;
  location_zip: string;
  source: string;
  google_places_id?: string;
  website_url?: string;
  digital_health_score?: number;
  audit_notes?: string;
}

export interface DiscoveryResponse {
  message: string;
  total_found: number;
  audited: number;
  leads: CompetitorFarm[];
  market_gap_report: Record<string, any> | null;
  seo_report: Record<string, any> | null;
}

export async function fetchDiscovery(params: {
  farm_name: string;
  farm_offerings: string;
  zip_code: string;
  state: string;
}): Promise<DiscoveryResponse> {
  const res = await fetch(`${API_BASE}/api/v1/farms/discover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${res.status}`);
  }
  return res.json();
}

// --- Phase 2: Builder ---

export interface BrandPersona {
  farm_story_summary: string;
  tagline: string;
  target_audience: string;
  tone_and_voice: string;
  recommended_channels: string[];
}

export interface BuilderResponse {
  status: string;
  data: {
    farm_id: string;
    farm_name: string;
    brand_persona: BrandPersona;
    suggested_domains: string[];
    website_layout: string;
  };
}

export async function buildFarmWebsite(
  farmId: string,
  farmName: string,
  farmStory: string,
  inventoryData: string
): Promise<BuilderResponse> {
  const res = await fetch(`${API_BASE}/api/v1/builder/build/${encodeURIComponent(farmId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      farm_name: farmName,
      farm_story: farmStory,
      inventory_data: inventoryData,
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `${res.status}`);
  }
  return res.json();
}
