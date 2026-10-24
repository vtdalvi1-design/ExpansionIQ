import argparse
import json
import math
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine
from app.models import AdministrativeBoundary

SOURCE_NAME = "geoBoundaries"
SOURCE_URL = "https://www.geoboundaries.org/api/current/gbOpen/IND/ADM2/"
BOUNDARY_SOURCE = "Pathways Data Pvt. Ltd.; LGDirectory"
DOWNLOAD_URL = (
    "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/"
    "releaseData/gbOpen/IND/ADM2/geoBoundaries-IND-ADM2_simplified.geojson"
)
LICENSE_STATUS = "Open Data Commons Open Database License 1.0"
LICENSE_URL = "https://opendatacommons.org/licenses/odbl/1-0/"
SOURCE_VERSION = "geoBoundaries-IND-ADM2-9469f09"
REFERENCE_YEAR = 2021
SOURCE_DATA_UPDATED_ON = "2023-01-19"
BUILD_DATE = "2023-12-12"
REPORTED_FEATURE_COUNT = 736
VERIFIED_FEATURE_COUNT = 735


def _validate_geometry(geometry: Any, feature_number: int) -> dict[str, Any]:
    if not isinstance(geometry, dict):
        raise ValueError(f"Feature {feature_number}: geometry must be an object.")
    geometry_type = geometry.get("type")
    coordinates = geometry.get("coordinates")
    if geometry_type not in {"Polygon", "MultiPolygon"} or not isinstance(
        coordinates, list
    ):
        raise ValueError(
            f"Feature {feature_number}: expected Polygon or MultiPolygon geometry."
        )

    polygons = [coordinates] if geometry_type == "Polygon" else coordinates
    if not polygons:
        raise ValueError(f"Feature {feature_number}: geometry is empty.")
    for polygon in polygons:
        if not isinstance(polygon, list) or not polygon:
            raise ValueError(
                f"Feature {feature_number}: polygon rings are malformed."
            )
        for ring in polygon:
            if not isinstance(ring, list) or len(ring) < 4:
                raise ValueError(
                    f"Feature {feature_number}: polygon rings need at least four positions."
                )
            positions: list[list[float]] = []
            for position in ring:
                if (
                    not isinstance(position, list)
                    or len(position) < 2
                    or any(
                        isinstance(value, bool) or not isinstance(value, (int, float))
                        for value in position[:2]
                    )
                ):
                    raise ValueError(
                        f"Feature {feature_number}: geometry coordinates are malformed."
                    )
                longitude, latitude = float(position[0]), float(position[1])
                if not (math.isfinite(longitude) and math.isfinite(latitude)):
                    raise ValueError(
                        f"Feature {feature_number}: coordinates must be finite."
                    )
                if not (-180 <= longitude <= 180 and -90 <= latitude <= 90):
                    raise ValueError(
                        f"Feature {feature_number}: coordinates are outside WGS84 bounds."
                    )
                positions.append([longitude, latitude])
            if positions[0] != positions[-1]:
                raise ValueError(
                    f"Feature {feature_number}: polygon rings must be closed."
                )
    return geometry


def read_boundary_features(path: Path) -> list[dict[str, Any]]:
    if not path.is_file():
        raise FileNotFoundError(f"Boundary GeoJSON not found: {path}")
    try:
        collection = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as error:
        raise ValueError("Boundary source must be valid UTF-8 GeoJSON.") from error
    if (
        not isinstance(collection, dict)
        or collection.get("type") != "FeatureCollection"
        or not isinstance(collection.get("features"), list)
    ):
        raise ValueError("Boundary source must be a GeoJSON FeatureCollection.")

    records: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    for feature_number, feature in enumerate(collection["features"], start=1):
        if not isinstance(feature, dict) or feature.get("type") != "Feature":
            raise ValueError(f"Feature {feature_number}: invalid GeoJSON feature.")
        properties = feature.get("properties")
        if not isinstance(properties, dict):
            raise ValueError(f"Feature {feature_number}: properties are required.")
        boundary_id = properties.get("shapeID")
        name = properties.get("shapeName")
        if (
            properties.get("shapeGroup") != "IND"
            or properties.get("shapeType") != "ADM2"
            or not isinstance(boundary_id, str)
            or not boundary_id.strip()
            or not isinstance(name, str)
            or not name.strip()
        ):
            raise ValueError(
                f"Feature {feature_number}: expected India ADM2 source ID and name."
            )
        if boundary_id in seen_ids:
            raise ValueError(f"Duplicate boundary ID in source: {boundary_id}.")
        seen_ids.add(boundary_id)
        records.append(
            {
                "boundary_id": boundary_id,
                "name": name.strip(),
                "boundary_level": "ADM2",
                "geometry": _validate_geometry(
                    feature.get("geometry"), feature_number
                ),
            }
        )

    if not records:
        raise ValueError("Boundary GeoJSON contains no district features.")
    if len(records) != VERIFIED_FEATURE_COUNT:
        raise ValueError(
            f"Reviewed boundary snapshot must contain exactly "
            f"{VERIFIED_FEATURE_COUNT} features; found {len(records)}. "
            "Verify the source metadata before importing."
        )
    return records


def import_district_boundaries(db: Session, path: Path) -> dict[str, Any]:
    records = read_boundary_features(path)
    existing = {
        boundary.boundary_id: boundary
        for boundary in db.query(AdministrativeBoundary)
        .filter(AdministrativeBoundary.source_version == SOURCE_VERSION)
        .all()
    }
    inserted = 0
    updated = 0
    try:
        for record in records:
            boundary = existing.get(record["boundary_id"])
            if boundary is None:
                boundary = AdministrativeBoundary(
                    boundary_id=record["boundary_id"],
                    source_version=SOURCE_VERSION,
                )
                db.add(boundary)
                inserted += 1
            else:
                updated += 1
            for field, value in record.items():
                setattr(boundary, field, value)
            boundary.reference_year = REFERENCE_YEAR
            boundary.source_data_updated_on = SOURCE_DATA_UPDATED_ON
            boundary.build_date = BUILD_DATE
            boundary.source_name = SOURCE_NAME
            boundary.source_url = SOURCE_URL
            boundary.download_url = DOWNLOAD_URL
            boundary.license_status = LICENSE_STATUS
            boundary.license_url = LICENSE_URL
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {
        "inserted": inserted,
        "updated": updated,
        "imported": len(records),
        "reported_source_count": REPORTED_FEATURE_COUNT,
        "reference_year": REFERENCE_YEAR,
        "build_date": BUILD_DATE,
        "source_version": SOURCE_VERSION,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Import the reviewed geoBoundaries India ADM2 GeoJSON."
    )
    parser.add_argument("geojson", type=Path, help="Path to source GeoJSON.")
    args = parser.parse_args()

    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        summary = import_district_boundaries(db, args.geojson)
    print(
        "District boundary import complete: "
        f"{summary['inserted']} inserted, {summary['updated']} updated; "
        f"{summary['imported']} features imported for reference year "
        f"{summary['reference_year']} (source metadata reports "
        f"{summary['reported_source_count']})."
    )


if __name__ == "__main__":
    main()
