import csv

import pytest
from sqlalchemy import create_engine, inspect, text

from app.database import (
    Base,
    SessionLocal,
    engine,
    migrate_district_crosswalk_schema,
)
from app.models import AdministrativeBoundary, DistrictCrosswalk
from app.services.district_crosswalk import import_reviewed_crosswalk

FIELDS = [
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
]


@pytest.fixture(autouse=True)
def isolate_crosswalk_tables():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        db.query(DistrictCrosswalk).delete()
        db.query(AdministrativeBoundary).delete()
        db.commit()
    yield
    with SessionLocal() as db:
        db.query(DistrictCrosswalk).delete()
        db.query(AdministrativeBoundary).delete()
        db.commit()


def _write_csv(path, records):
    with path.open("w", encoding="utf-8", newline="") as output:
        writer = csv.DictWriter(output, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(records)


def _boundary():
    return AdministrativeBoundary(
        boundary_id="source-shape-001",
        name="Example district",
        boundary_level="ADM2",
        geometry={
            "type": "Polygon",
            "coordinates": [[[73, 19], [74, 19], [74, 20], [73, 19]]],
        },
        source_version="source-release-1",
        reference_year=2021,
        source_data_updated_on="2023-01-19",
        build_date="2023-12-12",
        source_name="geoBoundaries",
        source_url="https://example.test/metadata",
        download_url="https://example.test/boundaries.geojson",
        license_status="ODbL 1.0",
        license_url="https://opendatacommons.org/licenses/odbl/1-0/",
    )


def _record(**overrides):
    record = {
        "boundary_source_version": "source-release-1",
        "boundary_id": "source-shape-001",
        "official_state_code": "27",
        "official_state_name": "Maharashtra",
        "official_district_code": "001",
        "official_district_name": "Example district",
        "census_state_code": "27",
        "census_district_code": "001",
        "census_reference_year": "2021",
        "reference_year": "2021",
        "match_method": "manually_verified",
        "evidence_reference": "https://official.example.test/crosswalk",
        "reviewed_by": "reviewer",
        "reviewed_on": "2026-10-25",
    }
    record.update(overrides)
    return record


def test_reviewed_crosswalk_import_is_idempotent_and_requires_evidence(tmp_path):
    path = tmp_path / "crosswalk.csv"
    _write_csv(path, [_record()])
    with SessionLocal() as db:
        db.add(_boundary())
        db.commit()

        first = import_reviewed_crosswalk(db, path)
        second = import_reviewed_crosswalk(db, path)

        assert first == {"inserted": 1, "updated": 0, "total": 1}
        assert second == {"inserted": 0, "updated": 1, "total": 1}
        mapping = db.query(DistrictCrosswalk).one()
        assert mapping.boundary_id == "source-shape-001"
        assert mapping.official_state_code == "27"
        assert mapping.official_district_code == "001"
        assert mapping.census_state_code == "27"
        assert mapping.census_district_code == "001"
        assert mapping.evidence_reference == "https://official.example.test/crosswalk"


def test_crosswalk_import_rejects_unknown_boundary_without_guessing(tmp_path):
    path = tmp_path / "unknown.csv"
    _write_csv(path, [_record(boundary_id="unknown-shape")])

    with SessionLocal() as db:
        with pytest.raises(ValueError, match="unknown boundary IDs"):
            import_reviewed_crosswalk(db, path)
        assert db.query(DistrictCrosswalk).count() == 0


@pytest.mark.parametrize(
    ("overrides", "message"),
    [
        (
            {"official_district_code": "001", "census_district_code": "002"},
            "duplicate official district code",
        ),
        (
            {"official_district_code": "002", "census_district_code": "001"},
            "duplicate Census district code",
        ),
    ],
)
def test_crosswalk_import_rejects_duplicate_codes(
    tmp_path, overrides, message
):
    path = tmp_path / "duplicates.csv"
    _write_csv(
        path,
        [
            _record(),
            _record(
                boundary_id="source-shape-002",
                **overrides,
            ),
        ],
    )

    with SessionLocal() as db:
        db.add(_boundary())
        duplicate = _boundary()
        duplicate.boundary_id = "source-shape-002"
        db.add(duplicate)
        db.commit()

        with pytest.raises(ValueError, match=message):
            import_reviewed_crosswalk(db, path)
        assert db.query(DistrictCrosswalk).count() == 0


def test_existing_crosswalk_schema_migrates_additively():
    migration_engine = create_engine("sqlite://")
    with migration_engine.begin() as connection:
        connection.execute(
            text(
                "CREATE TABLE district_crosswalks ("
                "id INTEGER PRIMARY KEY, "
                "boundary_source_version VARCHAR(80) NOT NULL, "
                "boundary_id VARCHAR(80) NOT NULL, "
                "official_state_code VARCHAR(20) NOT NULL, "
                "official_district_code VARCHAR(30) NOT NULL)"
            )
        )
        connection.execute(
            text(
                "INSERT INTO district_crosswalks "
                "(id, boundary_source_version, boundary_id, "
                "official_state_code, official_district_code) "
                "VALUES (1, 'old-release', 'shape-1', '27', '001')"
            )
        )

    migrate_district_crosswalk_schema(migration_engine)

    with migration_engine.connect() as connection:
        columns = {
            column["name"]
            for column in inspect(connection).get_columns("district_crosswalks")
        }
        assert {
            "official_state_name",
            "census_state_code",
            "census_district_code",
            "census_reference_year",
        }.issubset(columns)
        assert connection.execute(
            text("SELECT COUNT(*) FROM district_crosswalks")
        ).scalar_one() == 1
    migration_engine.dispose()


@pytest.mark.parametrize(
    ("override", "message"),
    [
        ({"evidence_reference": ""}, "fields cannot be blank"),
        ({"match_method": "name_guess"}, "match_method"),
        ({"reviewed_on": "not-a-date"}, "reviewed_on is invalid"),
    ],
)
def test_crosswalk_import_rejects_unverified_mapping_rows(
    tmp_path, override, message
):
    path = tmp_path / "invalid.csv"
    _write_csv(path, [_record(**override)])

    with SessionLocal() as db:
        db.add(_boundary())
        db.commit()
        with pytest.raises(ValueError, match=message):
            import_reviewed_crosswalk(db, path)
        assert db.query(DistrictCrosswalk).count() == 0
