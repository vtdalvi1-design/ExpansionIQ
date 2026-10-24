import argparse
import csv
from datetime import date, datetime
from pathlib import Path
from typing import Any
from zipfile import BadZipFile, ZipFile

from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine
from app.models import GeographicPlace

SOURCE_NAME = "GeoNames"
SOURCE_URL = "https://www.geonames.org/"
DOWNLOAD_URL = "https://download.geonames.org/export/dump/IN.zip"
LICENSE_STATUS = "CC BY 4.0"
EXPECTED_LICENSE = "Creative Commons Attribution 4.0 License"
FIELD_COUNT = 19


def _parse_row(row: list[str], row_number: int) -> dict[str, Any]:
    if len(row) != FIELD_COUNT:
        raise ValueError(
            f"Row {row_number}: expected {FIELD_COUNT} tab-separated fields, "
            f"found {len(row)}."
        )
    if row[8] != "IN":
        raise ValueError(f"Row {row_number}: country code must be IN.")

    try:
        latitude = float(row[4])
        longitude = float(row[5])
        population = int(row[14])
        geoname_id = int(row[0])
        modified_on = date.fromisoformat(row[18]).isoformat()
    except (ValueError, TypeError) as error:
        raise ValueError(
            f"Row {row_number}: invalid ID, coordinates, population, or modification date."
        ) from error

    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        raise ValueError(f"Row {row_number}: coordinates are outside WGS84 bounds.")
    if population <= 0:
        raise ValueError(f"Row {row_number}: population must be positive.")
    if not row[1].strip() or not row[2].strip() or not row[7].strip():
        raise ValueError(f"Row {row_number}: place name or feature code is blank.")

    return {
        "geoname_id": geoname_id,
        "name": row[1].strip(),
        "ascii_name": row[2].strip(),
        "admin1_code": row[10].strip(),
        "latitude": latitude,
        "longitude": longitude,
        "feature_code": row[7].strip(),
        "population": population,
        "record_modified_on": modified_on,
    }


def import_geonames_india_archive(
    db: Session,
    archive_path: Path,
) -> dict[str, Any]:
    if not archive_path.is_file():
        raise FileNotFoundError(f"GeoNames archive not found: {archive_path}")

    try:
        archive = ZipFile(archive_path)
    except BadZipFile as error:
        raise ValueError("GeoNames source must be a valid ZIP archive.") from error

    with archive:
        names = set(archive.namelist())
        if "readme.txt" not in names or "IN.txt" not in names:
            raise ValueError("GeoNames India archive must contain readme.txt and IN.txt.")
        license_text = archive.read("readme.txt").decode("utf-8")
        if EXPECTED_LICENSE not in license_text:
            raise ValueError("GeoNames archive does not declare the expected CC BY 4.0 license.")

        file_info = archive.getinfo("IN.txt")
        snapshot_date = datetime(*file_info.date_time).date().isoformat()
        admin1_names: dict[str, str] = {}
        places: list[dict[str, Any]] = []
        invalid_rows: list[str] = []
        excluded_rows = 0

        with archive.open("IN.txt") as data_file:
            rows = csv.reader(
                (line.decode("utf-8").rstrip("\r\n") for line in data_file),
                delimiter="\t",
            )
            for row_number, row in enumerate(rows, start=1):
                if len(row) != FIELD_COUNT:
                    invalid_rows.append(
                        f"Row {row_number}: expected {FIELD_COUNT} fields, found {len(row)}."
                    )
                    continue
                if row[8] != "IN":
                    invalid_rows.append(
                        f"Row {row_number}: country code must be IN."
                    )
                    continue
                if row[6] == "A" and row[7] == "ADM1" and row[10] and row[1]:
                    admin1_names[row[10]] = row[1].strip()
                if row[6] != "P":
                    continue
                try:
                    population = int(row[14])
                except ValueError:
                    invalid_rows.append(
                        f"Row {row_number}: populated-place population is not an integer."
                    )
                    continue
                if population <= 0:
                    excluded_rows += 1
                    continue
                try:
                    places.append(_parse_row(row, row_number))
                except ValueError as error:
                    invalid_rows.append(str(error))

        if invalid_rows:
            raise ValueError(
                f"GeoNames archive validation failed for {len(invalid_rows)} rows; "
                f"first issue: {invalid_rows[0]}"
            )
        if not places:
            raise ValueError("GeoNames India archive contains no eligible populated places.")

    existing = {
        place.geoname_id: place
        for place in db.query(GeographicPlace).all()
    }
    seen_ids: set[int] = set()
    inserted = 0
    updated = 0
    try:
        for record in places:
            geoname_id = record["geoname_id"]
            if geoname_id in seen_ids:
                raise ValueError(f"Duplicate GeoNames ID in archive: {geoname_id}.")
            seen_ids.add(geoname_id)

            place = existing.get(geoname_id)
            if place is None:
                place = GeographicPlace(geoname_id=geoname_id)
                db.add(place)
                inserted += 1
            else:
                updated += 1

            for field, value in record.items():
                setattr(place, field, value)
            place.admin1_name = admin1_names.get(record["admin1_code"])
            place.snapshot_date = snapshot_date
            place.source_name = SOURCE_NAME
            place.source_url = SOURCE_URL
            place.license_status = LICENSE_STATUS
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {
        "inserted": inserted,
        "updated": updated,
        "excluded_nonpositive_population": excluded_rows,
        "total_imported": len(places),
        "state_codes": sorted(
            {place["admin1_code"] for place in places if place["admin1_code"]}
        ),
        "snapshot_date": snapshot_date,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Import GeoNames populated-place coordinates for India."
    )
    parser.add_argument(
        "archive",
        type=Path,
        help="Path to the official GeoNames IN.zip archive.",
    )
    args = parser.parse_args()

    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        summary = import_geonames_india_archive(db, args.archive)
    print(
        "GeoNames import complete: "
        f"{summary['inserted']} inserted, {summary['updated']} updated; "
        f"{summary['excluded_nonpositive_population']} records with no positive "
        "population field excluded; "
        f"{summary['total_imported']} place points in snapshot "
        f"{summary['snapshot_date']}."
    )


if __name__ == "__main__":
    main()
