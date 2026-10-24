import type { Geometry } from "geojson";

export type RetailCategory = string;

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

export interface BusinessAnalysisInput {
  category: RetailCategory;
  business_type: string;
  budget_inr: number;
  cities: string[];
  business_model: string;
  target_customer: string;
  floor_area_sqft: number | null;
  expected_monthly_revenue_inr: number | null;
  monthly_rent_inr: number | null;
  employee_count: number | null;
  expected_average_ticket_inr?: number | null;
  expected_customers_per_day?: number | null;
  monthly_operating_expenses_inr?: number | null;
  forecast_start_date?: string | null;
}

export interface DemoForecastMonth {
  month: number;
  revenue_inr: number;
  expense_inr: number;
  operating_profit_inr: number;
  cashflow_after_startup_inr: number;
}

export interface DemoCityForecast {
  city_name: string;
  revenue_basis: string;
  rent_basis: string;
  utilities_basis: string;
  payroll_basis: string;
  cost_of_goods_basis: string;
  marketing_basis: string;
  monthly_revenue_inr: number;
  cost_of_goods_inr: number;
  gross_profit_inr: number;
  rent_inr: number;
  utilities_inr: number;
  payroll_inr: number;
  marketing_inr: number;
  monthly_expenses_inr: number;
  operating_profit_inr: number;
  break_even_revenue_inr: number;
  payback_months: number | null;
  startup_allocation_inr: Record<string, number>;
  scenarios: Record<
    string,
    {
      monthly_revenue_inr: number;
      monthly_expenses_inr: number;
      monthly_operating_profit_inr: number;
    }
  >;
  projections: DemoForecastMonth[];
  startup_capital_required_inr?: number;
  budget_shortfall_inr?: number;
  remaining_capital_inr?: number;
  cash_runway_months?: number | null;
  break_even_months?: number | null;
  data_completeness_pct?: number;
  census_population?: number | null;
  geonames_population?: number | null;
  state_name?: string | null;
  advantages?: string[];
  disadvantages?: string[];
  risks?: string[];
  recommendation_text?: string;
  is_recommended?: boolean;
}

export interface DemoAnalysisResponse {
  analysis_id: number;
  access_token?: string | null;
  created_at: string;
  category: RetailCategory;
  business_profile: BusinessAnalysisInput;
  results: CityResult[];
  forecasts: DemoCityForecast[];
  factor_weights: Record<string, number>;
  map_places: GeographicPlaceRecord[];
  map_resolutions: Array<{
    city_name: string;
    status: "matched" | "ambiguous" | "unavailable";
    match_count: number;
    note: string;
  }>;
  competitors: LocationRecord[];
  demo_mode: true;
  disclaimer: string;
  assumptions: string[];
  recommended_city?: string | null;
  recommendation_reason?: string | null;
  pdf_report_available?: boolean;
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

export interface DatasetRegistryRecord {
  dataset_key: string;
  title: string;
  source_name: string;
  source_url: string;
  download_url: string | null;
  license_status: string;
  license_url: string | null;
  attribution: string | null;
  indicators: string[];
  geographic_level: string;
  reference_period: string | null;
  units: string[];
  coverage: Record<string, unknown>;
  import_status: string;
  local_file_name: string | null;
  expected_schema: string | null;
  quality_notes: string;
  blocked_reason: string | null;
  downloaded_file_available: boolean;
  parsed_record_count: number | null;
  imported_record_count: number;
}

export interface DatasetRegistryResponse {
  count: number;
  datasets: DatasetRegistryRecord[];
}