import argparse
import csv
from datetime import date
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.database import (
    Base,
    SessionLocal,
    engine,
    migrate_district_crosswalk_schema,
)
from app.models import AdministrativeBoundary, DistrictCrosswalk

REQUIRED_COLUMNS = {
    "boundary_source_version",
    "boundary_id",
    "official_state_code",
    "official_state_name",
    "official_district_code",
    "official_district_name",
    "census_state_code",
    "census_district_code",
    "census_reference_year",
    "reference_year",
    "match_method",
    "evidence_reference",
    "reviewed_by",
    "reviewed_on",
}
ALLOWED_MATCH_METHODS = {"official_code", "manually_verified"}


def read_crosswalk_csv(path: Path) -> list[dict[str, Any]]:
    if not path.is_file():
        raise FileNotFoundError(f"District crosswalk CSV not found: {path}")

    with path.open("r", encoding="utf-8-sig", newline="") as source:
        reader = csv.DictReader(source)
        if reader.fieldnames is None or not REQUIRED_COLUMNS.issubset(
            set(reader.fieldnames)
        ):
            raise ValueError(
                "Crosswalk CSV is missing required columns: "
                + ", ".join(sorted(REQUIRED_COLUMNS - set(reader.fieldnames or [])))
            )
        records: list[dict[str, Any]] = []
        seen_boundaries: set[tuple[str, str]] = set()
        seen_official: set[tuple[str, str, str]] = set()
        seen_census: set[tuple[str, int, str, str]] = set()
        for row_number, row in enumerate(reader, start=2):
            record = {
                column: (row.get(column) or "").strip()
                for column in REQUIRED_COLUMNS
            }
            if any(not record[field] for field in REQUIRED_COLUMNS):
                raise ValueError(f"Row {row_number}: crosswalk fields cannot be blank.")
            if record["match_method"] not in ALLOWED_MATCH_METHODS:
                raise ValueError(
                    f"Row {row_number}: match_method must be official_code "
                    "or manually_verified."
                )
            try:
                record["reference_year"] = int(record["reference_year"])
                record["census_reference_year"] = int(
                    record["census_reference_year"]
                )
                record["reviewed_on"] = date.fromisoformat(
                    record["reviewed_on"]
                ).isoformat()
            except ValueError as error:
                raise ValueError(
                    f"Row {row_number}: reference_year or reviewed_on is invalid."
                ) from error
            if not 1800 <= record["reference_year"] <= 2200:
                raise ValueError(f"Row {row_number}: reference_year is out of range.")
            if not 1800 <= record["census_reference_year"] <= 2200:
                raise ValueError(
                    f"Row {row_number}: census_reference_year is out of range."
                )

            boundary_key = (
                record["boundary_source_version"],
                record["boundary_id"],
            )
            official_key = (
                record["boundary_source_version"],
                record["official_state_code"],
                record["official_district_code"],
            )

            census_key = (
                record["boundary_source_version"],
                record["census_reference_year"],
                record["census_state_code"],
                record["census_district_code"],
            )
            if boundary_key in seen_boundaries:
                raise ValueError(f"Row {row_number}: duplicate boundary crosswalk key.")
            if official_key in seen_official:
                raise ValueError(f"Row {row_number}: duplicate official district code.")
            if census_key in seen_census:
                raise ValueError(f"Row {row_number}: duplicate Census district code.")
            seen_boundaries.add(boundary_key)
            seen_official.add(official_key)
            seen_census.add(census_key)
            records.append(record)
    return records


def import_reviewed_crosswalk(db: Session, path: Path) -> dict[str, int]:
    records = read_crosswalk_csv(path)
    if not records:
        raise ValueError("Crosswalk CSV contains no reviewed mappings.")

    source_versions = {row["boundary_source_version"] for row in records}
    boundary_ids = {row["boundary_id"] for row in records}
    existing_boundaries = {
        (item.source_version, item.boundary_id)
        for item in db.query(
            AdministrativeBoundary.source_version,
            AdministrativeBoundary.boundary_id,
        )
        .filter(
            AdministrativeBoundary.source_version.in_(source_versions),
            AdministrativeBoundary.boundary_id.in_(boundary_ids),
        )
        .all()
    }
    unknown = [
        (row["boundary_source_version"], row["boundary_id"])
        for row in records
        if (
            row["boundary_source_version"],
            row["boundary_id"],
        )
        not in existing_boundaries
    ]
    if unknown:
        raise ValueError(
            "Crosswalk references unknown boundary IDs; first missing key: "
            f"{unknown[0][0]} / {unknown[0][1]}."
        )

    existing = {
        (item.boundary_source_version, item.boundary_id): item
        for item in db.query(DistrictCrosswalk)
        .filter(
            DistrictCrosswalk.boundary_source_version.in_(source_versions),
            DistrictCrosswalk.boundary_id.in_(boundary_ids),
        )
        .all()
    }
    existing_official = {
        (
            item.boundary_source_version,
            item.official_state_code,
            item.official_district_code,
        ): (item.boundary_source_version, item.boundary_id)
        for item in db.query(DistrictCrosswalk)
        .filter(
            DistrictCrosswalk.boundary_source_version.in_(source_versions),
            DistrictCrosswalk.official_state_code.in_(
                {row["official_state_code"] for row in records}
            ),
        )
        .all()
    }
    existing_census = {
        (
            item.boundary_source_version,
            item.census_reference_year,
            item.census_state_code,
            item.census_district_code,
        ): (item.boundary_source_version, item.boundary_id)
        for item in db.query(DistrictCrosswalk)
        .filter(
            DistrictCrosswalk.boundary_source_version.in_(source_versions),
            DistrictCrosswalk.census_state_code.in_(
                {row["census_state_code"] for row in records}
            ),
        )
        .all()
    }
    for row in records:
        official_key = (
            row["boundary_source_version"],
            row["official_state_code"],
            row["official_district_code"],
        )
        mapped_boundary = existing_official.get(official_key)
        boundary_key = (row["boundary_source_version"], row["boundary_id"])
        if mapped_boundary is not None and mapped_boundary != boundary_key:
            raise ValueError(
                "Official district code is already assigned to a different "
                f"boundary: {row['official_state_code']} / "
                f"{row['official_district_code']}."
            )
        census_key = (
            row["boundary_source_version"],
            row["census_reference_year"],
            row["census_state_code"],
            row["census_district_code"],
        )
        mapped_boundary = existing_census.get(census_key)
        if mapped_boundary is not None and mapped_boundary != boundary_key:
            raise ValueError(
                "Census district code is already assigned to a different "
                f"boundary: {row['census_state_code']} / "
                f"{row['census_district_code']}."
            )
    inserted = 0
    updated = 0
    try:
        for record in records:
            key = (record["boundary_source_version"], record["boundary_id"])
            mapping = existing.get(key)
            if mapping is None:
                mapping = DistrictCrosswalk(
                    boundary_source_version=record["boundary_source_version"],
                    boundary_id=record["boundary_id"],
                )
                db.add(mapping)
                inserted += 1
            else:
                updated += 1
            for field, value in record.items():
                setattr(mapping, field, value)
        db.commit()
    except Exception:
        db.rollback()
        raise
    return {"inserted": inserted, "updated": updated, "total": len(records)}


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Import a reviewed official district identifier crosswalk."
    )
    parser.add_argument("csv_path", type=Path, help="Reviewed crosswalk CSV.")
    args = parser.parse_args()

    Base.metadata.create_all(bind=engine)
    migrate_district_crosswalk_schema()
    with SessionLocal() as db:
        summary = import_reviewed_crosswalk(db, args.csv_path)
    print(
        f"Crosswalk import complete: {summary['inserted']} inserted, "
        f"{summary['updated']} updated."
    )


if __name__ == "__main__":
    main()
