import type {
  ComparisonRequest,
  ComparisonResult,
  CensusPopulationResponse,
  AdministrativeBoundaryResponse,
  FactorValues,
  GeographicPlaceResponse,
  LocationListResult,
  LocationInput,
  LocationRecord,
  MarketFactorInput,
  MarketFactorRecord,
  NearbyLocationsResult,
  RetailCategory,
  ScenarioResult,
  ScenarioSettings,
} from "../types";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"
).replace(/\/$/, "");
const REQUEST_TIMEOUT_MS = 10_000;

async function fetchWithTimeout(
  url: string,
  options: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  );

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("The backend request timed out. Please try again.");
    }
    throw new Error(
      "Cannot connect to the ExpansionIQ backend. Start the backend server and try again."
    );
  } finally {
    window.clearTimeout(timeout);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const body = (await response.json()) as {
        detail?: string | { msg?: string }[];
      };

      if (typeof body.detail === "string") {
        message = body.detail;
      } else if (Array.isArray(body.detail)) {
        message = body.detail
          .map((item) => item.msg || "Invalid request")
          .join(", ");
      }
    } catch {
      // Keep the fallback message if the response is not JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const api = {
  health: () =>
    request<{ status: string }>("/health"),

  getCities: () =>
    request<{ cities: string[] }>("/cities"),

  getCensusPopulation: (filters: {
    search?: string;
    state_code?: string;
    census_level?: number;
    level_unreported?: boolean;
    limit?: number;
    offset?: number;
  } = {}) => {
    const query = new URLSearchParams();
    if (filters.search) query.set("search", filters.search);
    if (filters.state_code) query.set("state_code", filters.state_code);
    if (filters.census_level !== undefined) {
      query.set("census_level", filters.census_level.toString());
    }
    if (filters.level_unreported) query.set("level_unreported", "true");
    if (filters.limit !== undefined) query.set("limit", filters.limit.toString());
    if (filters.offset !== undefined) query.set("offset", filters.offset.toString());
    const suffix = query.size > 0 ? `?${query.toString()}` : "";
    return request<CensusPopulationResponse>(`/census/indicators${suffix}`);
  },

  getGeographicPlaces: (filters: {
    search?: string;
    state_code?: string;
    limit?: number;
    offset?: number;
  } = {}) => {
    const query = new URLSearchParams();
    if (filters.search) query.set("search", filters.search);
    if (filters.state_code) query.set("state_code", filters.state_code);
    if (filters.limit !== undefined) query.set("limit", filters.limit.toString());
    if (filters.offset !== undefined) query.set("offset", filters.offset.toString());
    const suffix = query.size > 0 ? `?${query.toString()}` : "";
    return request<GeographicPlaceResponse>(`/geography/places${suffix}`);
  },

  getAdministrativeBoundaries: (filters: {
    search?: string;
    state_code?: string;
    limit?: number;
    offset?: number;
  } = {}) => {
    const query = new URLSearchParams();
    if (filters.search) query.set("search", filters.search);
    if (filters.state_code) query.set("state_code", filters.state_code);
    if (filters.limit !== undefined) query.set("limit", filters.limit.toString());
    if (filters.offset !== undefined) query.set("offset", filters.offset.toString());
    const suffix = query.size > 0 ? `?${query.toString()}` : "";
    return request<AdministrativeBoundaryResponse>(
      `/geography/boundaries${suffix}`
    );
  },

  getMarketFactors: () =>
    request<MarketFactorRecord[]>("/cities/factors"),

  saveMarketFactor: (payload: MarketFactorInput) =>
    request<MarketFactorRecord>("/cities/factors", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  deleteMarketFactor: (factorId: number) =>
    request<void>(`/cities/factors/${factorId}`, { method: "DELETE" }),

  getLocations: (filters: {
    city?: string;
    category?: RetailCategory;
    location_type?: "candidate" | "competitor";
  } = {}) => {
    const query = new URLSearchParams();
    if (filters.city) query.set("city", filters.city);
    if (filters.category) query.set("category", filters.category);
    if (filters.location_type) query.set("location_type", filters.location_type);
    const suffix = query.size > 0 ? `?${query.toString()}` : "";
    return request<LocationListResult>(`/locations${suffix}`);
  },

  createLocation: (payload: LocationInput) =>
    request<LocationRecord>("/locations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getNearbyLocations: (locationId: number) =>
    request<NearbyLocationsResult>(`/locations/${locationId}/nearby`),

  deleteLocation: (locationId: number) =>
    request<void>(`/locations/${locationId}`, { method: "DELETE" }),

  compareLocations: (payload: ComparisonRequest) =>
    request<ComparisonResult>("/comparisons", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  runScenario: (
    category: RetailCategory,
    factors: FactorValues,
    settings: ScenarioSettings
  ) =>
    request<ScenarioResult>("/scenarios/analyze", {
      method: "POST",
      body: JSON.stringify({ category, factors, ...settings }),
    }),

  exportComparison: async (results: ComparisonResult["results"]) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/exports/csv`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ results }),
    });

    if (!response.ok) {
      let message = `Unable to export the comparison (${response.status}).`;
      try {
        const body = (await response.json()) as { detail?: string };
        if (body.detail) message = body.detail;
      } catch {
        // Keep the status message when the error response is not JSON.
      }
      throw new Error(message);
    }

    return response.blob();
  },
};