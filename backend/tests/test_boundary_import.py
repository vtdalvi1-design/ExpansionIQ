import json

import pytest
from fastapi.testclient import TestClient

from app.database import Base, SessionLocal, engine
from app.main import app
from app.models import AdministrativeBoundary, DistrictCrosswalk
from app.services.boundary_import import import_district_boundaries


@pytest.fixture(autouse=True)
def isolate_boundary_rows():
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


def _feature(boundary_id="shape-1", name="Sample District", coordinates=None):
    return {
        "type": "Feature",
        "properties": {
            "shapeName": name,
            "shapeID": boundary_id,
            "shapeGroup": "IND",
            "shapeType": "ADM2",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": coordinates
            or [[[72.0, 18.0], [73.0, 18.0], [73.0, 19.0], [72.0, 18.0]]],
        },
    }


def _write_collection(path, features):
    path.write_text(
        json.dumps({"type": "FeatureCollection", "features": features}),
        encoding="utf-8",
    )


def test_boundary_import_is_idempotent_and_retrievable(tmp_path):
    source_path = tmp_path / "districts.geojson"
    _write_collection(
        source_path,
        [
            _feature(
                f"shape-{index}",
                "Sample District" if index == 0 else f"Other District {index}",
            )
            for index in range(735)
        ],
    )

    with SessionLocal() as db, TestClient(app) as client:
        first = import_district_boundaries(db, source_path)
        second = import_district_boundaries(db, source_path)

        assert first["inserted"] == 735
        assert first["updated"] == 0
        assert first["reported_source_count"] == 736
        assert second["inserted"] == 0
        assert second["updated"] == 735

        boundary = db.query(AdministrativeBoundary).filter_by(
            boundary_id="shape-0"
        ).one()
        db.add(
            DistrictCrosswalk(
                boundary_source_version=boundary.source_version,
                boundary_id=boundary.boundary_id,
                official_state_code="27",
                official_state_name="Maharashtra",
                official_district_code="001",
                official_district_name="Reviewed district",
                census_state_code="27",
                census_district_code="001",
                census_reference_year=2011,
                reference_year=2021,
                match_method="manually_verified",
                evidence_reference="https://official.example.test/crosswalk",
                reviewed_by="reviewer",
                reviewed_on="2026-10-25",
            )
        )
        db.commit()

        response = client.get(
            "/api/geography/boundaries",
            params={"search": "Sample", "limit": 1},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["count"] == body["total"] == 1
        assert body["boundaries"][0]["boundary_id"] == "shape-0"
        assert body["boundaries"][0]["level"] == "ADM2"
        assert body["boundaries"][0]["geometry"]["type"] == "Polygon"
        assert body["reference_year"] == 2021
        assert body["license_status"] == (
            "Open Data Commons Open Database License 1.0"
        )
        assert body["database_download_url"].endswith(
            "/api/geography/boundaries/geojson"
        )
        assert body["data_status"] == "available"
        assert "735 features" in body["coverage_note"]

        state_filtered = client.get(
            "/api/geography/boundaries",
            params={"state_code": "27"},
        )
        assert state_filtered.status_code == 200
        assert state_filtered.json()["total"] == 1
        assert state_filtered.json()["state_options"] == [
            {"code": "27", "name": "Maharashtra"}
        ]
        assert state_filtered.json()["boundaries"][0]["district_code"] == "001"
        assert state_filtered.json()["boundaries"][0]["state_code"] == "27"
        assert client.get(
            "/api/geography/boundaries",
            params={"state_code": "99"},
        ).json()["total"] == 0

        download = client.get("/api/geography/boundaries/geojson")
        assert download.status_code == 200
        assert download.headers["content-type"].startswith("application/geo+json")
        assert "attachment;" in download.headers["content-disposition"]
        exported = download.json()
        assert len(exported["features"]) == 735
        crosswalk_feature = next(
            feature
            for feature in exported["features"]
            if feature["properties"]["boundary_id"] == "shape-0"
        )
        assert crosswalk_feature["properties"]["state_code"] == "27"
        assert crosswalk_feature["properties"]["district_code"] == "001"
        assert exported["features"][0]["properties"]["license_url"] == (
            "https://opendatacommons.org/licenses/odbl/1-0/"
        )

        no_match = client.get(
            "/api/geography/boundaries",
            params={"search": "No Such District"},
        )
        assert no_match.json()["total"] == 0


def test_boundary_import_rejects_unverified_source_feature_count(tmp_path):
    source_path = tmp_path / "partial.geojson"
    _write_collection(source_path, [_feature()])

    with SessionLocal() as db:
        with pytest.raises(ValueError, match="must contain exactly 735 features"):
            import_district_boundaries(db, source_path)
        assert db.query(AdministrativeBoundary).count() == 0


@pytest.mark.parametrize(
    ("features", "message"),
    [
        (
            [_feature(), _feature()],
            "Duplicate boundary ID",
        ),
        (
            [
                _feature(
                    coordinates=[
                        [[181, 18], [73, 18], [73, 19], [181, 18]]
                    ]
                )
            ],
            "outside WGS84 bounds",
        ),
        (
            [
                {
                    **_feature(),
                    "properties": {
                        **_feature()["properties"],
                        "shapeType": "ADM1",
                    },
                }
            ],
            "expected India ADM2",
        ),
        (
            [_feature(coordinates=[[[72, 18], [73, 18], [72, 19], [73, 19]]])],
            "polygon rings must be closed",
        ),
    ],
)
def test_boundary_import_rejects_invalid_source_before_writing(
    tmp_path, features, message
):
    source_path = tmp_path / "invalid.geojson"
    _write_collection(source_path, features)

    with SessionLocal() as db:
        with pytest.raises(ValueError, match=message):
            import_district_boundaries(db, source_path)
        assert db.query(AdministrativeBoundary).count() == 0
