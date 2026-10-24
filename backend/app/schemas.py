from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

RetailCategory = Literal["Grocery", "Fashion", "Electronics"]


class ComparisonRequest(BaseModel):
    category: RetailCategory
    cities: list[str] = Field(min_length=2, max_length=5)

    @field_validator("cities")
    @classmethod
    def validate_cities(cls, cities: list[str]) -> list[str]:
        normalized = [city.strip() for city in cities]
        if any(not city for city in normalized):
            raise ValueError("City names cannot be empty.")

        folded = [city.casefold() for city in normalized]
        if len(folded) != len(set(folded)):
            raise ValueError("City names must be unique.")

        return normalized


class FactorValues(BaseModel):
    model_config = ConfigDict(extra="forbid")

    demand: float | None = Field(default=None, ge=0, le=100)
    competition_opportunity: float | None = Field(default=None, ge=0, le=100)
    accessibility: float | None = Field(default=None, ge=0, le=100)
    cost_viability: float | None = Field(default=None, ge=0, le=100)
    category_fit: float | None = Field(default=None, ge=0, le=100)

    @field_validator("*", mode="before")
    @classmethod
    def reject_boolean_factors(cls, value: Any) -> Any:
        if isinstance(value, bool):
            raise ValueError("Factor values must be numbers or null.")
        return value


class MarketFactorInput(FactorValues):
    city: str = Field(min_length=1, max_length=120)
    category: RetailCategory
    source: str | None = Field(default=None, max_length=500)
    source_status: Literal["verified", "unverified", "user_provided"] = "user_provided"
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("city")
    @classmethod
    def trim_city(cls, city: str) -> str:
        normalized = city.strip()
        if not normalized:
            raise ValueError("City name cannot be empty.")
        return normalized

    @field_validator("source")
    @classmethod
    def trim_source(cls, source: str | None) -> str | None:
        normalized = source.strip() if source is not None else ""
        return normalized or None

    @model_validator(mode="after")
    def require_factor_value(self):
        if all(
            getattr(self, factor) is None
            for factor in (
                "demand",
                "competition_opportunity",
                "accessibility",
                "cost_viability",
                "category_fit",
            )
        ):
            raise ValueError("At least one market factor value is required.")
        if self.source_status == "verified" and not self.source:
            raise ValueError("Verified market factors require a source reference.")
        return self


class MarketFactorResponse(FactorValues):
    id: int
    city_id: int
    city: str
    category: RetailCategory
    source: str | None
    source_status: str
    notes: str | None


class ScenarioRequest(BaseModel):
    category: RetailCategory
    factors: FactorValues
    demand_change: float = Field(default=0, ge=-100, le=100)
    cost_change: float = Field(default=0, ge=-100, le=100)

    @field_validator("demand_change", "cost_change", mode="before")
    @classmethod
    def reject_boolean_changes(cls, value: Any) -> Any:
        if isinstance(value, bool):
            raise ValueError("Scenario changes must be numeric.")
        return value


class CityResult(BaseModel):
    name: str
    city_name: str
    category: RetailCategory
    total_score: float | None
    score_status: Literal["complete", "incomplete"]
    missing_factors: list[str]
    source_status: str
    source: str | None = None
    notes: str | None = None
    demand_score: float | None = None
    competition_score: float | None = None
    accessibility_score: float | None = None
    cost_score: float | None = None
    category_fit_score: float | None = None
    rank: int | None = None
    tie: bool = False


class ComparisonResponse(BaseModel):
    category: RetailCategory
    results: list[CityResult]
    data_status: Literal["available", "no_complete_scores"]
    analysis_id: int


class ExportRequest(BaseModel):
    results: list[dict[str, Any]]


class LocationResponse(BaseModel):
    id: int
    name: str
    city: str
    location_type: Literal["candidate", "competitor"]
    latitude: float
    longitude: float
    category: RetailCategory
    source_status: str
    source_name: str | None = None
    notes: str | None = None


class LocationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    city: str = Field(min_length=1, max_length=120)
    location_type: Literal["candidate", "competitor"] = "candidate"
    category: RetailCategory
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    source_name: str | None = Field(default=None, max_length=500)
    source_status: Literal["verified", "unverified", "user_provided"] = "user_provided"
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("name", "city")
    @classmethod
    def trim_required_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Name and city cannot be empty.")
        return normalized


class LocationUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    city: str | None = Field(default=None, min_length=1, max_length=120)
    location_type: Literal["candidate", "competitor"] | None = None
    category: RetailCategory | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    source_name: str | None = Field(default=None, max_length=500)
    source_status: Literal["verified", "unverified", "user_provided"] | None = None
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("name", "city")
    @classmethod
    def trim_optional_text(cls, value: str | None) -> str | None:
        return value.strip() if value is not None else value

    @field_validator(
        "name",
        "city",
        "location_type",
        "category",
        "latitude",
        "longitude",
        mode="before",
    )
    @classmethod
    def reject_null_for_required_fields(cls, value: Any) -> Any:
        if value is None:
            raise ValueError("This field cannot be null.")
        return value

    @model_validator(mode="after")
    def require_update_fields(self):
        if not self.model_fields_set:
            raise ValueError("At least one field must be supplied.")
        return self


class LocationListResponse(BaseModel):
    count: int
    locations: list[LocationResponse]
    data_status: Literal["available", "unavailable"]


class CensusIndicatorResponse(BaseModel):
    id: int
    geography_code: str
    geography_name: str
    state_code: str
    district_code: str | None
    subdistrict_code: str | None
    town_code: str | None
    ua_code: str | None
    census_level: int | None
    indicator_code: str
    indicator_name: str
    value: int | None
    unit: str
    reference_year: int
    source_name: str
    source_url: str
    download_url: str
    license_status: str


class CensusIndicatorListResponse(BaseModel):
    count: int
    total: int
    dataset_total: int
    indicators: list[CensusIndicatorResponse]
    state_codes: list[str]
    reference_year: int
    source_name: str
    source_url: str
    download_url: str
    license_status: str
    data_status: Literal["available", "unavailable"]


class GeographicPlaceResponse(BaseModel):
    geoname_id: int
    name: str
    ascii_name: str
    admin1_code: str
    admin1_name: str | None
    latitude: float
    longitude: float
    feature_code: str
    population: int
    record_modified_on: str
    snapshot_date: str
    source_name: str
    source_url: str
    license_status: str


class GeographicPlaceListResponse(BaseModel):
    count: int
    total: int
    places: list[GeographicPlaceResponse]
    state_options: list[dict[str, str]]
    snapshot_date: str | None
    source_name: str
    source_url: str
    download_url: str
    license_status: str
    license_url: str
    data_status: Literal["available", "unavailable"]


class AdministrativeBoundaryRecord(BaseModel):
    boundary_id: str
    name: str
    level: Literal["ADM2"]
    state_code: str | None
    district_code: str | None
    geometry: dict[str, Any]


class AdministrativeBoundaryListResponse(BaseModel):
    count: int
    total: int
    reported_source_count: int
    reference_year: int
    source_data_updated_on: str
    build_date: str
    source_name: str
    source_url: str
    database_download_url: str
    boundary_source: str
    download_url: str
    license_status: str
    license_url: str
    coverage_note: str
    state_options: list[dict[str, str]]
    boundaries: list[AdministrativeBoundaryRecord]
    data_status: Literal["available", "unavailable"]


class DatasetRegistryRecord(BaseModel):
    dataset_key: str
    title: str
    source_name: str
    source_url: str
    download_url: str | None
    license_status: str
    license_url: str | None
    attribution: str | None
    indicators: list[str]
    geographic_level: str
    reference_period: str | None
    units: list[str]
    coverage: dict[str, Any]
    import_status: str
    local_file_name: str | None
    expected_schema: str | None
    quality_notes: str
    blocked_reason: str | None
    downloaded_file_available: bool
    parsed_record_count: int | None
    imported_record_count: int


class DatasetRegistryResponse(BaseModel):
    count: int
    datasets: list[DatasetRegistryRecord]


class GeographyStateCoverage(BaseModel):
    code: str
    name: str | None
    record_count: int


class CensusDistrictCoverage(BaseModel):
    state_code: str
    district_count: int
    district_codes: list[str]


class GeographyAuditResponse(BaseModel):
    census_observations: int
    census_geographies: int
    census_state_code_count: int
    census_district_code_pairs: int
    census_districts_by_state: list[CensusDistrictCoverage]
    census_missing_values: int
    census_by_state: list[GeographyStateCoverage]
    geonames_place_points: int
    geonames_unique_ids: int
    geonames_duplicate_ids: int
    geonames_admin1_code_count: int
    geonames_missing_admin1_code_records: int
    geonames_by_admin1: list[GeographyStateCoverage]
    boundary_features: int
    boundary_unique_source_ids: int
    boundary_duplicate_source_ids: int
    boundary_duplicate_names: int
    boundary_features_without_official_district_code: int
    boundary_features_without_state_membership: int
    boundary_metadata_reported_features: int
    boundary_metadata_count_gap: int
    census_geographies_without_confirmed_boundary_join: int
    census_geographies_with_district_boundary_parent_match: int
    confirmed_district_crosswalk_rows: int
    exact_normalized_name_candidate_pairs: int
    crosswalk_note: str
    files: list[dict[str, Any]]


ScoreComponentName = Literal[
    "demographic_demand",
    "economic_strength",
    "business_activity",
    "retail_competition_supply",
    "accessibility_connectivity",
]
ScoreInputStatus = Literal["available", "missing", "suppressed", "stale", "unverified"]


class MarketScoreComponentInput(BaseModel):
    score: float | None = Field(default=None, ge=0, le=100)
    status: ScoreInputStatus
    source_reference: str | None = Field(default=None, max_length=600)
    reference_period: str | None = Field(default=None, max_length=100)
    unit: str | None = Field(default=None, max_length=80)
    explanation: str | None = Field(default=None, max_length=500)

    @field_validator("score", mode="before")
    @classmethod
    def reject_boolean_score(cls, value: Any) -> Any:
        if isinstance(value, bool):
            raise ValueError("Component scores must be numeric or null.")
        return value

    @model_validator(mode="after")
    def validate_evidence(self):
        if self.status == "available" and (
            self.score is None or not self.source_reference
        ):
            raise ValueError(
                "Available score components require a score and source reference."
            )
        if self.status in {"missing", "suppressed"} and self.score is not None:
            raise ValueError(
                "Missing or suppressed components cannot contain a score."
            )
        if self.status == "stale" and self.score is None:
            raise ValueError("Stale components must retain their observed score.")
        return self


class MarketScoreEvaluationRequest(BaseModel):
    components: dict[ScoreComponentName, MarketScoreComponentInput] = Field(
        default_factory=dict
    )
    weights: dict[ScoreComponentName, float] | None = None

    @field_validator("weights", mode="before")
    @classmethod
    def reject_boolean_weights(cls, value: Any) -> Any:
        if isinstance(value, dict) and any(
            isinstance(weight, bool) for weight in value.values()
        ):
            raise ValueError("Component weights must be numeric.")
        return value


class MarketScoreComponentResult(BaseModel):
    score: float | None
    status: ScoreInputStatus
    weight: float
    contribution: float | None
    source_reference: str | None
    reference_period: str | None
    unit: str | None
    explanation: str | None
    included_in_score: bool


class MarketScoreEvaluationResponse(BaseModel):
    score_version: str
    methodology: str
    weights: dict[str, float]
    minimum_available_components: int
    required_components: list[str]
    total_score: float | None
    eligibility_status: Literal["eligible", "insufficient_data"]
    evidence_coverage_percent: float
    eligible_coverage_percent: float
    missing_components: list[str]
    stale_components: list[str]
    unverified_components: list[str]
    component_results: dict[str, MarketScoreComponentResult]
    disclaimer: str
