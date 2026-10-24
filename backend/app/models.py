from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    BigInteger,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class City(Base):
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False, unique=True, index=True)
    state = Column(String(120), nullable=True)
    country = Column(String(120), nullable=False, default="India")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    factors = relationship(
        "MarketFactor",
        back_populates="city",
        cascade="all, delete-orphan",
    )


class MarketFactor(Base):
    __tablename__ = "market_factors"
    __table_args__ = (
        UniqueConstraint("city_id", "category", name="uq_market_factor_city_category"),
    )

    id = Column(Integer, primary_key=True, index=True)
    city_id = Column(
        Integer,
        ForeignKey("cities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category = Column(String(40), nullable=False)
    demand = Column(Float, nullable=True)
    competition_opportunity = Column(Float, nullable=True)
    accessibility = Column(Float, nullable=True)
    cost_viability = Column(Float, nullable=True)
    category_fit = Column(Float, nullable=True)
    source = Column(String(500), nullable=True)
    source_status = Column(String(40), nullable=True, default="unverified")
    notes = Column(String(500), nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )

    city = relationship("City", back_populates="factors")


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(40), nullable=False)
    selected_cities = Column(JSON, nullable=False)
    results = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    scenario = Column(JSON, nullable=True)
    is_demo_data = Column(Boolean, nullable=False, default=True)
    analysis_payload = Column(JSON, nullable=True)
    analysis_access_token_hash = Column(String(64), nullable=True)


class RetailLocation(Base):
    __tablename__ = "retail_locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(160), nullable=False)
    city = Column(String(120), nullable=False, index=True)
    location_type = Column(String(20), nullable=False, default="candidate")
    category = Column(String(40), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    source_name = Column(String(500), nullable=True)
    source_status = Column(String(40), nullable=False, default="user_provided")
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class CensusIndicator(Base):
    __tablename__ = "census_indicators"
    __table_args__ = (
        UniqueConstraint(
            "geography_code",
            "indicator_code",
            "reference_year",
            "source_url",
            name="uq_census_geography_indicator_source",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    geography_code = Column(String(300), nullable=False, index=True)
    geography_name = Column(String(200), nullable=False, index=True)
    state_code = Column(String(10), nullable=False, index=True)
    district_code = Column(String(10), nullable=True)
    subdistrict_code = Column(String(10), nullable=True)
    town_code = Column(String(10), nullable=True)
    ua_code = Column(String(20), nullable=True)
    census_level = Column(Integer, nullable=True)
    indicator_code = Column(String(40), nullable=False)
    indicator_name = Column(String(160), nullable=False)
    value = Column(Integer, nullable=True)
    unit = Column(String(40), nullable=False)
    reference_year = Column(Integer, nullable=False)
    source_name = Column(String(200), nullable=False)
    source_url = Column(String(500), nullable=False)
    download_url = Column(String(500), nullable=False)
    license_status = Column(String(80), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class GeographicPlace(Base):
    __tablename__ = "geographic_places"

    id = Column(Integer, primary_key=True, index=True)
    geoname_id = Column(BigInteger, nullable=False, unique=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    ascii_name = Column(String(200), nullable=False)
    admin1_code = Column(String(20), nullable=False, index=True)
    admin1_name = Column(String(160), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    feature_code = Column(String(10), nullable=False)
    population = Column(BigInteger, nullable=False)
    record_modified_on = Column(String(10), nullable=False)
    snapshot_date = Column(String(10), nullable=False)
    source_name = Column(String(80), nullable=False)
    source_url = Column(String(500), nullable=False)
    license_status = Column(String(40), nullable=False)


class AdministrativeBoundary(Base):
    __tablename__ = "administrative_boundaries"
    __table_args__ = (
        UniqueConstraint(
            "boundary_id",
            "source_version",
            name="uq_boundary_id_source_version",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    boundary_id = Column(String(80), nullable=False, index=True)
    name = Column(String(200), nullable=False, index=True)
    boundary_level = Column(String(10), nullable=False, index=True)
    geometry = Column(JSON, nullable=False)
    source_version = Column(String(80), nullable=False)
    reference_year = Column(Integer, nullable=False)
    source_data_updated_on = Column(String(10), nullable=False)
    build_date = Column(String(10), nullable=False, index=True)
    source_name = Column(String(120), nullable=False)
    source_url = Column(String(500), nullable=False)
    download_url = Column(String(500), nullable=False)
    license_status = Column(String(120), nullable=False)
    license_url = Column(String(500), nullable=False)


class DatasetRegistryEntry(Base):
    __tablename__ = "dataset_registry"

    dataset_key = Column(String(80), primary_key=True)
    title = Column(String(240), nullable=False)
    source_name = Column(String(160), nullable=False)
    source_url = Column(String(600), nullable=False)
    download_url = Column(String(600), nullable=True)
    license_status = Column(String(160), nullable=False)
    license_url = Column(String(600), nullable=True)
    attribution = Column(String(500), nullable=True)
    indicators = Column(JSON, nullable=False)
    geographic_level = Column(String(100), nullable=False)
    reference_period = Column(String(100), nullable=True)
    units = Column(JSON, nullable=False)
    coverage = Column(JSON, nullable=False)
    import_status = Column(String(40), nullable=False)
    local_file_name = Column(String(240), nullable=True)
    expected_schema = Column(String(500), nullable=True)
    quality_notes = Column(String(1200), nullable=False)
    blocked_reason = Column(String(1000), nullable=True)


class DistrictCrosswalk(Base):
    __tablename__ = "district_crosswalks"
    __table_args__ = (
        UniqueConstraint(
            "boundary_source_version",
            "boundary_id",
            name="uq_district_crosswalk_boundary",
        ),
        UniqueConstraint(
            "boundary_source_version",
            "official_state_code",
            "official_district_code",
            name="uq_district_crosswalk_official_code",
        ),
        UniqueConstraint(
            "boundary_source_version",
            "census_reference_year",
            "census_state_code",
            "census_district_code",
            name="uq_district_crosswalk_census_code",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    boundary_source_version = Column(String(80), nullable=False, index=True)
    boundary_id = Column(String(80), nullable=False, index=True)
    official_state_code = Column(String(20), nullable=False, index=True)
    official_state_name = Column(String(160), nullable=True)
    official_district_code = Column(String(30), nullable=False, index=True)
    official_district_name = Column(String(200), nullable=False)
    census_state_code = Column(String(20), nullable=True, index=True)
    census_district_code = Column(String(30), nullable=True, index=True)
    census_reference_year = Column(Integer, nullable=True)
    reference_year = Column(Integer, nullable=False)
    match_method = Column(String(30), nullable=False)
    evidence_reference = Column(String(600), nullable=False)
    reviewed_by = Column(String(160), nullable=False)
    reviewed_on = Column(String(10), nullable=False)