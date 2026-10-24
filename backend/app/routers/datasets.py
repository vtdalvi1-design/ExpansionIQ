import re
import unicodedata
from collections import Counter

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    AdministrativeBoundary,
    CensusIndicator,
    DatasetRegistryEntry,
    DistrictCrosswalk,
    GeographicPlace,
)
from app.schemas import DatasetRegistryResponse, GeographyAuditResponse
from app.services.dataset_registry import (
    PROJECT_ROOT,
    registry_entry_payload,
    seed_dataset_registry,
)
from app.services.boundary_import import REPORTED_FEATURE_COUNT, SOURCE_NAME

router = APIRouter(tags=["Datasets and coverage"])


@router.get("/datasets", response_model=DatasetRegistryResponse)
def list_datasets(
    import_status: str | None = Query(default=None, max_length=40),
    db: Session = Depends(get_db),
) -> dict:
    seed_dataset_registry(db)
    query = db.query(DatasetRegistryEntry)
    if import_status:
        query = query.filter(DatasetRegistryEntry.import_status == import_status)
    entries = query.order_by(DatasetRegistryEntry.dataset_key).all()
    return {
        "count": len(entries),
        "datasets": [registry_entry_payload(entry, db) for entry in entries],
    }


def _normalized_name(value: str) -> str:
    ascii_value = (
        unicodedata.normalize("NFKD", value)
        .encode("ascii", "ignore")
        .decode("ascii")
        .casefold()
    )
    return re.sub(r"[^a-z0-9]+", "", ascii_value)


@router.get("/geography/audit", response_model=GeographyAuditResponse)
def geography_audit(db: Session = Depends(get_db)) -> dict:
    census_rows = db.query(
        CensusIndicator.geography_code,
        CensusIndicator.geography_name,
        CensusIndicator.state_code,
        CensusIndicator.district_code,
        CensusIndicator.reference_year,
        CensusIndicator.value,
    ).all()
    census_by_state = Counter(row.state_code for row in census_rows)
    census_geographies = {row.geography_code for row in census_rows}
    census_district_pairs = {
        (row.state_code, row.district_code)
        for row in census_rows
        if row.district_code
    }
    census_district_codes_by_state: dict[str, set[str]] = {}
    for state_code, district_code in census_district_pairs:
        census_district_codes_by_state.setdefault(state_code, set()).add(
            district_code
        )
    latest_build_date = (
        db.query(func.max(AdministrativeBoundary.build_date))
        .filter(AdministrativeBoundary.source_name == SOURCE_NAME)
        .scalar()
    )
    crosswalk_rows = (
        db.query(
            DistrictCrosswalk.boundary_id,
            DistrictCrosswalk.official_state_code,
            DistrictCrosswalk.official_district_code,
            DistrictCrosswalk.census_state_code,
            DistrictCrosswalk.census_district_code,
            DistrictCrosswalk.census_reference_year,
        )
        .join(
            AdministrativeBoundary,
            (DistrictCrosswalk.boundary_source_version == AdministrativeBoundary.source_version)
            & (DistrictCrosswalk.boundary_id == AdministrativeBoundary.boundary_id),
        )
        .filter(
            AdministrativeBoundary.source_name == SOURCE_NAME,
            AdministrativeBoundary.build_date == latest_build_date,
        )
        .distinct()
        .all()
    )
    crosswalk_pairs = {
        (row.census_state_code, row.census_district_code, row.census_reference_year)
        for row in crosswalk_rows
        if row.census_state_code
        and row.census_district_code
        and row.census_reference_year
    }
    crosswalk_state_boundary_ids = {
        row.boundary_id for row in crosswalk_rows if row.official_state_code
    }
    crosswalk_district_boundary_ids = {
        row.boundary_id for row in crosswalk_rows if row.official_district_code
    }
    confirmed_crosswalk_rows = [
        row
        for row in crosswalk_rows
        if row.official_state_code
        and row.official_district_code
        and row.census_state_code
        and row.census_district_code
        and row.census_reference_year
    ]
    census_geo_district_pairs = {
        (row.state_code, row.district_code, row.reference_year)
        for row in census_rows
        if row.district_code
    }
    matched_census_pairs = census_geo_district_pairs & crosswalk_pairs
    matched_census_geographies = {
        row.geography_code
        for row in census_rows
        if (
            row.state_code,
            row.district_code,
            row.reference_year,
        )
        in matched_census_pairs
    }

    place_rows = db.query(
        GeographicPlace.geoname_id,
        GeographicPlace.admin1_code,
        GeographicPlace.admin1_name,
    ).all()
    place_ids = [row.geoname_id for row in place_rows]
    places_by_state: dict[str, dict[str, object]] = {}
    for row in place_rows:
        if not row.admin1_code:
            continue
        item = places_by_state.setdefault(
            row.admin1_code,
            {"name": row.admin1_name, "count": 0},
        )
        item["count"] = int(item["count"]) + 1

    boundary_rows = (
        db.query(
            AdministrativeBoundary.boundary_id,
            AdministrativeBoundary.name,
        )
        .filter(
            AdministrativeBoundary.source_name == SOURCE_NAME,
            AdministrativeBoundary.build_date == latest_build_date,
        )
        .all()
        if latest_build_date
        else []
    )
    boundary_ids = [row.boundary_id for row in boundary_rows]
    boundary_names = [row.name for row in boundary_rows]
    census_normalized_names = {
        _normalized_name(row.geography_name) for row in census_rows
    }
    boundary_normalized_names = {
        _normalized_name(name) for name in boundary_names
    }
    normalized_name_candidate_pairs = len(
        census_normalized_names & boundary_normalized_names
    )

    registry = db.query(DatasetRegistryEntry).order_by(
        DatasetRegistryEntry.dataset_key
    ).all()
    registry_file_payload = []
    for entry in registry:
        if not entry.local_file_name:
            continue
        path = PROJECT_ROOT / "data" / entry.local_file_name
        registry_payload = registry_entry_payload(entry, db)
        registry_file_payload.append(
            {
                "dataset_key": entry.dataset_key,
                "file_name": entry.local_file_name,
                "downloaded_file_available": path.is_file(),
                "parsed_record_count": registry_payload["parsed_record_count"],
                "imported_record_count": registry_payload["imported_record_count"],
                "import_status": entry.import_status,
            }
        )

    unique_place_ids = set(place_ids)
    unique_boundary_ids = set(boundary_ids)
    return {
        "census_observations": len(census_rows),
        "census_geographies": len(census_geographies),
        "census_state_code_count": len(census_by_state),
        "census_district_code_pairs": len(census_district_pairs),
        "census_districts_by_state": [
            {
                "state_code": state_code,
                "district_count": len(district_codes),
                "district_codes": sorted(district_codes),
            }
            for state_code, district_codes in sorted(
                census_district_codes_by_state.items()
            )
        ],
        "census_missing_values": sum(row.value is None for row in census_rows),
        "census_by_state": [
            {"code": code, "name": None, "record_count": count}
            for code, count in sorted(census_by_state.items())
        ],
        "geonames_place_points": len(place_rows),
        "geonames_unique_ids": len(unique_place_ids),
        "geonames_duplicate_ids": len(place_ids) - len(unique_place_ids),
        "geonames_admin1_code_count": len(places_by_state),
        "geonames_missing_admin1_code_records": sum(
            not row.admin1_code for row in place_rows
        ),
        "geonames_by_admin1": [
            {
                "code": code,
                "name": str(value["name"]) if value["name"] is not None else None,
                "record_count": int(value["count"]),
            }
            for code, value in sorted(places_by_state.items())
        ],
        "boundary_features": len(boundary_rows),
        "boundary_unique_source_ids": len(unique_boundary_ids),
        "boundary_duplicate_source_ids": len(boundary_ids)
        - len(unique_boundary_ids),
        "boundary_duplicate_names": len(boundary_names)
        - len({name.casefold() for name in boundary_names}),
        "boundary_features_without_official_district_code": len(boundary_rows)
        - len(crosswalk_district_boundary_ids),
        "boundary_features_without_state_membership": len(boundary_rows)
        - len(crosswalk_state_boundary_ids),
        "boundary_metadata_reported_features": REPORTED_FEATURE_COUNT,
        "boundary_metadata_count_gap": max(
            REPORTED_FEATURE_COUNT - len(boundary_rows), 0
        ),
        "census_geographies_without_confirmed_boundary_join": len(
            census_geographies - matched_census_geographies
        ),
        "census_geographies_with_district_boundary_parent_match": len(
            matched_census_geographies
        ),
        "confirmed_district_crosswalk_rows": len(confirmed_crosswalk_rows),
        "exact_normalized_name_candidate_pairs": normalized_name_candidate_pairs,
        "crosswalk_note": (
            (
                "No confirmed district crosswalk exists. Census rows are urban "
                "agglomeration/town observations with Census district codes; the "
                "boundary source has no official district or state codes. "
            )
            if not confirmed_crosswalk_rows
            else (
                f"{len(confirmed_crosswalk_rows)} reviewed district crosswalk "
                "rows currently link source features to separately recorded "
                "official and Census codes. "
            )
        )
        + (
            "Normalized name overlap is diagnostic only and is never treated as "
            "a join. Any code crosswalk identifies the containing district "
            "only, not a town/UA geometry match."
        ),
        "files": registry_file_payload,
    }
