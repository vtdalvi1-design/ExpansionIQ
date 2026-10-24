import type { Geometry } from "geojson";

export type RetailCategory = "Grocery" | "Fashion" | "Electronics";

export interface ComparisonRequest {
  category: RetailCategory;
  cities: string[];
}

export interface CityResult {
  name: string;
  city_name: string;
  category: RetailCategory;
  total_score: number | null;
  score_status: "complete" | "incomplete";
  missing_factors: string[];
  source_status: string;
  source: string | null;
  notes: string | null;
  demand_score: number | null;
  competition_score: number | null;
  accessibility_score: number | null;
  cost_score: number | null;
  category_fit_score: number | null;
  rank: number | null;
  tie: boolean;
}

export interface ComparisonResult {
  analysis_id: number;
  category: RetailCategory;
  results: CityResult[];
  data_status: "available" | "no_complete_scores";
}

export interface ScenarioSettings {
  demand_change: number;
  cost_change: number;
}

export interface FactorValues {
  demand: number | null;
  competition_opportunity: number | null;
  accessibility: number | null;
  cost_viability: number | null;
  category_fit: number | null;
}

export interface ScenarioScore {
  category: RetailCategory;
  factor_scores: FactorValues;
  weights: Record<string, number>;
  total_score: number | null;
  missing_factors: string[];
  score_status: "complete" | "incomplete";
}

export interface ScenarioResult {
  baseline: ScenarioScore;
  scenario: ScenarioScore;
  demand_change: number;
  cost_change: number;
  adjusted_factors: FactorValues;
  score_change: number | null;
}

export interface LocationRecord {
  id: number;
  name: string;
  city: string;
  location_type: "candidate" | "competitor";
  latitude: number;
  longitude: number;
  category: RetailCategory;
  source_status: string;
  source_name: string | null;
  notes: string | null;
}

export interface LocationListResult {
  count: number;
  locations: LocationRecord[];
  data_status: "available" | "unavailable";
}

export interface LocationInput {
  name: string;
  city: string;
  location_type: "candidate" | "competitor";
  category: RetailCategory;
  latitude: number;
  longitude: number;
  source_name: string | null;
  source_status: "verified" | "unverified" | "user_provided";
  notes: string | null;
}

export interface NearbyLocationsResult {
  radius_km: number;
  count: number;
  nearby_type: "candidate" | "competitor";
  locations: Array<LocationRecord & { distance_km: number }>;
  disclaimer: string;
}

export interface MarketFactorRecord extends FactorValues {
  id: number;
  city_id: number;
  city: string;
  category: RetailCategory;
  source: string | null;
  source_status: "verified" | "unverified" | "user_provided";
  notes: string | null;
}

export interface MarketFactorInput extends FactorValues {
  city: string;
  category: RetailCategory;
  source: string | null;
  source_status: "verified" | "unverified" | "user_provided";
  notes: string | null;
}

export interface DataSource {
  name: string;
  description: string;
  status: "verified" | "demo" | "unavailable";
  updatedAt?: string;
  url?: string;
}

export interface ApiError {
  detail: string;
}

export interface CensusPopulationRecord {
  id: number;
  geography_code: string;
  geography_name: string;
  state_code: string;
  district_code: string | null;
  subdistrict_code: string | null;
  town_code: string | null;
  ua_code: string | null;
  census_level: number | null;
  indicator_code: string;
  indicator_name: string;
  value: number | null;
  unit: string;
  reference_year: number;
  source_name: string;
  source_url: string;
  download_url: string;
  license_status: string;
}

export interface CensusPopulationResponse {
  count: number;
  total: number;
  dataset_total: number;
  indicators: CensusPopulationRecord[];
  state_codes: string[];
  reference_year: number;
  source_name: string;
  source_url: string;
  download_url: string;
  license_status: string;
  data_status: "available" | "unavailable";
}

export interface GeographicPlaceRecord {
  geoname_id: number;
  name: string;
  ascii_name: string;
  admin1_code: string;
  admin1_name: string | null;
  latitude: number;
  longitude: number;
  feature_code: string;
  population: number;
  record_modified_on: string;
  snapshot_date: string;
  source_name: string;
  source_url: string;
  license_status: string;
}

export interface GeographicPlaceResponse {
  count: number;
  total: number;
  places: GeographicPlaceRecord[];
  state_options: Array<{ code: string; name: string }>;
  snapshot_date: string | null;
  source_name: string;
  source_url: string;
  download_url: string;
  license_status: string;
  license_url: string;
  data_status: "available" | "unavailable";
}

export interface AdministrativeBoundary {
  boundary_id: string;
  name: string;
  level: "ADM2";
  state_code: string | null;
  district_code: string | null;
  geometry: Geometry;
}

export interface AdministrativeBoundaryResponse {
  count: number;
  total: number;
  reported_source_count: number;
  reference_year: number;
  source_data_updated_on: string;
  build_date: string;
  source_name: string;
  source_url: string;
  database_download_url: string;
  boundary_source: string;
  download_url: string;
  license_status: string;
  license_url: string;
  coverage_note: string;
  state_options: Array<{ code: string; name: string }>;
  boundaries: AdministrativeBoundary[];
  data_status: "available" | "unavailable";
}