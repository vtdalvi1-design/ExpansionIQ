import csv
from io import StringIO
from zipfile import ZIP_DEFLATED, ZipFile

import pytest
from fastapi.testclient import TestClient

from app.database import Base, SessionLocal, engine
from app.main import app
from app.models import GeographicPlace
from app.services.geonames_import import (
    EXPECTED_LICENSE,
    import_geonames_india_archive,
)


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def _row(
    geoname_id: int,
    name: str,
    latitude: str,
    longitude: str,
    feature_class: str,
    feature_code: str,
    admin1_code: str,
    population: str,
) -> list[str]:
    return [
        str(geoname_id),
        name,
        name,
        "",
        latitude,
        longitude,
        feature_class,
        feature_code,
        "IN",
        "",
        admin1_code,
        "",
        "",
        "",
        population,
        "",
        "",
        "Asia/Kolkata",
        "2025-04-01",
    ]


def _archive(path, rows, license_text=EXPECTED_LICENSE):
    content = StringIO()
    writer = csv.writer(content, delimiter="\t", lineterminator="\n")
    writer.writerows(rows)
    with ZipFile(path, "w", ZIP_DEFLATED) as archive:
        archive.writestr("readme.txt", f"Work licensed under {license_text}.")
        archive.writestr("IN.txt", content.getvalue())


def test_geonames_import_filters_valid_places_and_api_supports_search(tmp_path, client):
    Base.metadata.create_all(bind=engine)
    archive_path = tmp_path / "IN.zip"
    _archive(
        archive_path,
        [
            _row(100, "Maharashtra", "19.75", "75.71", "A", "ADM1", "16", "112374333"),
            _row(101, "Pune", "18.51957", "73.85535", "P", "PPLA", "16", "3124458"),
            _row(102, "Nashik", "19.9975", "73.7898", "P", "PPL", "16", "1486053"),
            _row(103, "Unpopulated village", "18.0", "73.0", "P", "PPL", "16", "0"),
        ],
    )

    with SessionLocal() as db:
        db.query(GeographicPlace).delete()
        db.commit()
        first = import_geonames_india_archive(db, archive_path)
        assert first["inserted"] == 2
        assert first["updated"] == 0
        assert first["excluded_nonpositive_population"] == 1
        assert first["snapshot_date"] is not None
        second = import_geonames_india_archive(db, archive_path)
        assert second["inserted"] == 0
        assert second["updated"] == 2
        try:
            response = client.get(
                "/api/geography/places",
                params={"search": "Pune", "state_code": "16"},
            )
            assert response.status_code == 200
            body = response.json()
            assert body["count"] == body["total"] == 1
            assert body["places"][0]["geoname_id"] == 101
            assert body["places"][0]["admin1_name"] == "Maharashtra"
            assert body["places"][0]["latitude"] == pytest.approx(18.51957)
            assert body["places"][0]["longitude"] == pytest.approx(73.85535)
            assert body["places"][0]["feature_code"] == "PPLA"
            assert body["places"][0]["license_status"] == "CC BY 4.0"
            assert body["license_url"] == "https://creativecommons.org/licenses/by/4.0/"
            assert body["data_status"] == "available"

            filtered = client.get(
                "/api/geography/places",
                params={"state_code": "16", "limit": 1},
            )
            assert filtered.json()["total"] == 2
            assert filtered.json()["count"] == 1
        finally:
            db.query(GeographicPlace).delete()
            db.commit()


@pytest.mark.parametrize(
    ("latitude", "longitude"),
    [
        ("91", "75"),
        ("18", "181"),
    ],
)
def test_geonames_import_rejects_out_of_range_coordinates(
    latitude, longitude, tmp_path
):
    archive_path = tmp_path / "invalid-coordinates.zip"
    _archive(
        archive_path,
        [_row(201, "Invalid Point", latitude, longitude, "P", "PPL", "16", "1")],
    )

    with SessionLocal() as db:
        with pytest.raises(ValueError, match="coordinates are outside WGS84 bounds"):
            import_geonames_india_archive(db, archive_path)


def test_geonames_import_requires_declared_license(tmp_path):
    archive_path = tmp_path / "missing-license.zip"
    _archive(
        archive_path,
        [_row(301, "Pune", "18.51957", "73.85535", "P", "PPLA", "16", "1")],
        license_text="Unspecified license",
    )

    with SessionLocal() as db:
        with pytest.raises(ValueError, match="does not declare the expected CC BY 4.0"):
            import_geonames_india_archive(db, archive_path)
