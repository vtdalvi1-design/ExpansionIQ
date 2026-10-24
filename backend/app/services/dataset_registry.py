from pathlib import Path
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import (
    AdministrativeBoundary,
    CensusIndicator,
    DatasetRegistryEntry,
    GeographicPlace,
)

PROJECT_ROOT = Path(__file__).resolve().parents[3]

SEED_DATASETS: tuple[dict[str, Any], ...] = (
    {
        "dataset_key": "census-pca-ua-2011",
        "title": "Primary Census Abstract - Urban Agglomeration India - 2011",
        "source_name": "Census of India",
        "source_url": "https://censusindia.gov.in/nada/index.php/catalog/45261",
        "download_url": None,
        "license_status": "not specified in catalog; permission unconfirmed",
        "license_url": None,
        "attribution": "Office of the Registrar General & Census Commissioner, India",
        "indicators": ["TOT_P"],
        "geographic_level": "urban agglomeration/town; source Census levels retained",
        "reference_period": "2011",
        "units": ["person"],
        "coverage": {"geographic_scope": "India", "catalog_claimed_states": None},
        "import_status": "imported_license_review",
        "local_file_name": "PCA11-UA-0000.xlsx",
        "expected_schema": "Data sheet: ST Code, DT Code, UA Name, Level, TOT_P",
        "quality_notes": (
            "3,319 observations, one null TOT_P, 31 source state codes. Historical "
            "2011 values; no current estimate. State codes include a historical "
            "jurisdiction frame and must not be treated as current-state coverage."
        ),
        "blocked_reason": (
            "Catalog does not state a reuse license; redistribution/commercial "
            "reuse requires terms confirmation."
        ),
    },
    {
        "dataset_key": "geonames-india-populated-places",
        "title": "GeoNames India country gazetteer, positive-population populated places",
        "source_name": "GeoNames",
        "source_url": "https://www.geonames.org/",
        "download_url": "https://download.geonames.org/export/dump/IN.zip",
        "license_status": "CC BY 4.0, declared in bundled readme",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
        "attribution": "GeoNames",
        "indicators": ["place coordinates", "feature code", "source population field"],
        "geographic_level": "populated place point",
        "reference_period": "archive snapshot 2026-10-24; per-record modified dates",
        "units": ["WGS84 latitude/longitude", "GeoNames source population field"],
        "coverage": {"geographic_scope": "India", "feature_class": "P"},
        "import_status": "imported",
        "local_file_name": "geonames-IN.zip",
        "expected_schema": "GeoNames 19-column country dump plus license readme",
        "quality_notes": (
            "Filtered gazetteer: only feature class P with a positive source "
            "population field and valid coordinates. Not a complete settlement "
            "inventory; source population is not current market demand."
        ),
        "blocked_reason": None,
    },
    {
        "dataset_key": "geoboundaries-ind-adm2-2021",
        "title": "geoBoundaries India ADM2 simplified district boundaries",
        "source_name": "geoBoundaries",
        "source_url": "https://www.geoboundaries.org/api/current/gbOpen/IND/ADM2/",
        "download_url": (
            "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/"
            "releaseData/gbOpen/IND/ADM2/geoBoundaries-IND-ADM2_simplified.geojson"
        ),
        "license_status": "ODbL 1.0, declared in source metadata",
        "license_url": "https://opendatacommons.org/licenses/odbl/1-0/",
        "attribution": "Pathways Data Pvt. Ltd.; LGDirectory; geoBoundaries",
        "indicators": ["district polygon geometry"],
        "geographic_level": "district (ADM2)",
        "reference_period": "represented year 2021; build 2023-12-12",
        "units": ["GeoJSON Polygon/MultiPolygon"],
        "coverage": {
            "geographic_scope": "India",
            "metadata_feature_count": 736,
            "downloaded_feature_count": 735,
        },
        "import_status": "imported_incomplete",
        "local_file_name": "geoboundaries-IND-ADM2_simplified.geojson",
        "expected_schema": (
            "GeoJSON FeatureCollection; shapeID, shapeName, shapeGroup, shapeType"
        ),
        "quality_notes": (
            "735 actual features versus 736 metadata units; seven duplicate names; "
            "zero duplicate source IDs. No official district code or state ID in "
            "features; no reliable state/district crosswalk."
        ),
        "blocked_reason": (
            "Cannot identify the missing metadata unit or establish official "
            "state/district joins; ODbL obligations apply to public database reuse."
        ),
    },
    {
        "dataset_key": "census-town-directory-2011",
        "title": "Census District Census Handbook Town Directory tables",
        "source_name": "Census of India",
        "source_url": "https://censusindia.gov.in/census.website/data/census-tables",
        "download_url": None,
        "license_status": "not verified for selected district resources",
        "license_url": None,
        "attribution": "Office of the Registrar General & Census Commissioner, India",
        "indicators": ["town amenities", "infrastructure", "services"],
        "geographic_level": "town; per handbook/table",
        "reference_period": "2011",
        "units": [],
        "coverage": {"geographic_scope": "India; resource availability varies"},
        "import_status": "blocked",
        "local_file_name": None,
        "expected_schema": "Must verify selected handbook/table schema",
        "quality_notes": "Historical town services, not a current infrastructure inventory.",
        "blocked_reason": (
            "No specific machine-readable table downloaded; per-resource coverage "
            "and reuse terms need review."
        ),
    },
    {
        "dataset_key": "rbi-handbook-state-statistics",
        "title": "RBI Handbook of Statistics on Indian States",
        "source_name": "Reserve Bank of India",
        "source_url": (
            "https://www.rbi.org.in/Scripts/AnnualPublications.aspx?"
            "head=Handbook%20of%20Statistics%20on%20Indian%20States"
        ),
        "download_url": None,
        "license_status": "not verified for selected table",
        "license_url": None,
        "attribution": "Reserve Bank of India",
        "indicators": ["state domestic product", "per-capita income", "population"],
        "geographic_level": "state/union territory",
        "reference_period": "2024-25 edition; table-specific year series",
        "units": [],
        "coverage": {"geographic_scope": "states and union territories"},
        "import_status": "blocked",
        "local_file_name": None,
        "expected_schema": "Exact downloadable table and workbook schema not selected",
        "quality_notes": "State-level context only; not district estimates.",
        "blocked_reason": (
            "No exact machine-readable table selected/downloaded and table reuse "
            "terms not reviewed."
        ),
    },
    {
        "dataset_key": "mospi-hces-2023-24",
        "title": "Household Consumption Expenditure Survey 2023-24",
        "source_name": "MoSPI",
        "source_url": "https://www.mospi.gov.in/",
        "download_url": None,
        "license_status": "not verified for selected report or microdata",
        "license_url": None,
        "attribution": "Ministry of Statistics and Programme Implementation",
        "indicators": ["household consumption expenditure"],
        "geographic_level": "state and urban/rural survey dimensions",
        "reference_period": "2023-24",
        "units": [],
        "coverage": {"geographic_scope": "survey coverage; exact table not selected"},
        "import_status": "blocked",
        "local_file_name": None,
        "expected_schema": "Exact report/microdata schema not verified",
        "quality_notes": "Survey estimates are not neighborhood-level retail demand.",
        "blocked_reason": (
            "Selected machine-readable table/microdata, access conditions, and "
            "reuse terms remain unverified."
        ),
    },
    {
        "dataset_key": "mospi-sixth-economic-census",
        "title": "Sixth Economic Census 2013-14",
        "source_name": "MoSPI",
        "source_url": "https://www.mospi.gov.in/",
        "download_url": None,
        "license_status": "not verified for selected table",
        "license_url": None,
        "attribution": "Ministry of Statistics and Programme Implementation",
        "indicators": ["establishments", "employment by economic activity"],
        "geographic_level": "administrative levels vary by publication table",
        "reference_period": "2013-14",
        "units": [],
        "coverage": {"geographic_scope": "exact table coverage not selected"},
        "import_status": "blocked",
        "local_file_name": None,
        "expected_schema": "Exact table and administrative identifier schema not verified",
        "quality_notes": "Historical establishment counts; not a current competitor census.",
        "blocked_reason": (
            "No exact downloadable machine-readable table or reuse terms verified."
        ),
    },
    {
        "dataset_key": "data-gov-in-udyam",
        "title": "Udyam/MSME registration datasets",
        "source_name": "Open Government Data Platform India",
        "source_url": "https://data.gov.in/",
        "download_url": None,
        "license_status": "not verified for a selected resource",
        "license_url": None,
        "attribution": "Open Government Data Platform India; resource-specific attribution pending",
        "indicators": ["registered MSME counts, if resource supports geography"],
        "geographic_level": "not established for a selected resource",
        "reference_period": None,
        "units": [],
        "coverage": {"geographic_scope": "not verified"},
        "import_status": "blocked",
        "local_file_name": None,
        "expected_schema": "No resource selected; API/download schema not verified",
        "quality_notes": "MSME registrations are not equivalent to retail shops.",
        "blocked_reason": (
            "No specific resource or usable API/download acquired; API credentials "
            "and licensing must be verified for any chosen resource."
        ),
    },
    {
        "dataset_key": "openstreetmap-india-business-poi",
        "title": "OpenStreetMap mapped business points of interest",
        "source_name": "OpenStreetMap contributors",
        "source_url": "https://www.openstreetmap.org/copyright",
        "download_url": None,
        "license_status": "ODbL 1.0; OSM Foundation attribution requirements apply",
        "license_url": "https://opendatacommons.org/licenses/odbl/1-0/",
        "attribution": "© OpenStreetMap contributors",
        "indicators": ["mapped retail/business points; incomplete volunteered coverage"],
        "geographic_level": "mapped point of interest",
        "reference_period": "snapshot date required for any extract",
        "units": ["point"],
        "coverage": {"geographic_scope": "not acquired"},
        "import_status": "blocked",
        "local_file_name": None,
        "expected_schema": "No India extract downloaded or validated",
        "quality_notes": (
            "Mapped POIs are incomplete volunteered data, not a business census or "
            "proof of demand; avoid bulk repeated live browser queries."
        ),
        "blocked_reason": (
            "No permitted cached extract chosen; attribution, extract date, and "
            "refresh workflow must be selected before import."
        ),
    },
    {
        "dataset_key": "survey-of-india-boundaries",
        "title": "Survey of India administrative boundaries",
        "source_name": "Survey of India",
        "source_url": "https://surveyofindia.gov.in/",
        "download_url": None,
        "license_status": "not verified",
        "license_url": None,
        "attribution": "Survey of India; dataset-level terms not established",
        "indicators": ["state and district boundary geometries"],
        "geographic_level": "state/district",
        "reference_period": None,
        "units": [],
        "coverage": {"geographic_scope": "not verified"},
        "import_status": "blocked",
        "local_file_name": None,
        "expected_schema": "No boundary file available for inspection",
        "quality_notes": "No source file parsed or imported.",
        "blocked_reason": (
            "Source endpoint/download could not be retrieved in this environment; "
            "dataset-specific license and vintage remain unknown."
        ),
    },
    {
        "dataset_key": "bharat-maps-boundaries",
        "title": "Bharat Maps administrative boundaries",
        "source_name": "Bharat Maps",
        "source_url": "https://bharatmaps.gov.in/",
        "download_url": None,
        "license_status": "not verified",
        "license_url": None,
        "attribution": "Bharat Maps; dataset-level terms not established",
        "indicators": ["state and district boundary geometries"],
        "geographic_level": "state/district",
        "reference_period": None,
        "units": [],
        "coverage": {"geographic_scope": "not verified"},
        "import_status": "blocked",
        "local_file_name": None,
        "expected_schema": "No boundary file available for inspection",
        "quality_notes": "No source file parsed or imported.",
        "blocked_reason": (
            "Source endpoint/download could not be retrieved in this environment; "
            "dataset-specific license and vintage remain unknown."
        ),
    },
)


def seed_dataset_registry(db: Session) -> None:
    """Insert reviewed registry metadata without overwriting later edits."""
    existing_keys = {
        key for (key,) in db.query(DatasetRegistryEntry.dataset_key).all()
    }
    changed = False
    for seed in SEED_DATASETS:
        if seed["dataset_key"] not in existing_keys:
            db.add(DatasetRegistryEntry(**seed))
            changed = True
    if changed:
        db.commit()


def count_dataset_records(db: Session, key: str) -> int:
    if key == "census-pca-ua-2011":
        return db.query(CensusIndicator).count()
    if key == "geonames-india-populated-places":
        return db.query(GeographicPlace).count()
    if key == "geoboundaries-ind-adm2-2021":
        latest_build_date = (
            db.query(func.max(AdministrativeBoundary.build_date))
            .filter(AdministrativeBoundary.source_name == "geoBoundaries")
            .scalar()
        )
        if latest_build_date is None:
            return 0
        return (
            db.query(AdministrativeBoundary)
            .filter(
                AdministrativeBoundary.source_name == "geoBoundaries",
                AdministrativeBoundary.build_date == latest_build_date,
            )
            .count()
        )
    return 0


def registry_entry_payload(entry: DatasetRegistryEntry, db: Session) -> dict[str, Any]:
    file_exists = (
        bool(entry.local_file_name)
        and (PROJECT_ROOT / "data" / entry.local_file_name).is_file()
    )
    imported_count = count_dataset_records(db, entry.dataset_key)
    parsed_counts = {
        "census-pca-ua-2011": 3319,
        "geonames-india-populated-places": 660041,
        "geoboundaries-ind-adm2-2021": 735,
    }
    payload = {
        column.name: getattr(entry, column.name)
        for column in DatasetRegistryEntry.__table__.columns
    }
    payload.update(
        {
            "downloaded_file_available": file_exists,
            "parsed_record_count": (
                parsed_counts.get(entry.dataset_key) if file_exists else None
            ),
            "imported_record_count": imported_count,
        }
    )
    return payload
