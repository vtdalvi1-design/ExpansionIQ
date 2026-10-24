from fastapi.testclient import TestClient

from app.database import Base, SessionLocal, engine
from app.main import app
from app.models import (
    AdministrativeBoundary,
    CensusIndicator,
    DistrictCrosswalk,
    GeographicPlace,
)


def test_registry_reports_sources_and_distinguishes_import_blockers():
    with TestClient(app) as client:
        response = client.get("/api/datasets")

    assert response.status_code == 200
    body = response.json()
    assert body["count"] >= 10
    datasets = {row["dataset_key"]: row for row in body["datasets"]}

    census = datasets["census-pca-ua-2011"]
    assert census["import_status"] == "imported_license_review"
    assert census["license_url"] is None
    assert "reuse license" in census["blocked_reason"]

    boundaries = datasets["geoboundaries-ind-adm2-2021"]
    assert boundaries["import_status"] == "imported_incomplete"
    assert boundaries["license_status"].startswith("ODbL")
    assert boundaries["coverage"]["downloaded_feature_count"] == 735

    for blocked_key in (
        "survey-of-india-boundaries",
        "bharat-maps-boundaries",
        "rbi-handbook-state-statistics",
        "mospi-hces-2023-24",
        "data-gov-in-udyam",
        "openstreetmap-india-business-poi",
    ):
        assert datasets[blocked_key]["import_status"] == "blocked"
        assert datasets[blocked_key]["blocked_reason"]


def test_registry_filter_returns_only_requested_import_status():
    with TestClient(app) as client:
        response = client.get("/api/datasets", params={"import_status": "blocked"})

    assert response.status_code == 200
    assert response.json()["count"] > 0
    assert all(
        row["import_status"] == "blocked"
        for row in response.json()["datasets"]
    )


def test_geography_audit_reports_actual_counts_without_guessing_joins():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as client:
        with SessionLocal() as db:
            db.query(CensusIndicator).delete()
            db.query(GeographicPlace).delete()
            db.query(AdministrativeBoundary).delete()
            db.add_all(
                [
                    CensusIndicator(
                        geography_code="01|010|00043|800013|500400101|1|Alpha",
                        geography_name="Alpha",
                        state_code="01",
                        district_code="010",
                        town_code="800013",
                        indicator_code="TOT_P",
                        indicator_name="Population - Total",
                        value=500,
                        unit="person",
                        reference_year=2011,
                        source_name="Census of India",
                        source_url="https://example.test/census",
                        download_url="https://example.test/census.xlsx",
                        license_status="not_specified_in_catalog",
                    ),
                    CensusIndicator(
                        geography_code="01|011|00043|800014|500400102|1|Beta",
                        geography_name="Beta",
                        state_code="01",
                        district_code="011",
                        town_code="800014",
                        indicator_code="TOT_P",
                        indicator_name="Population - Total",
                        value=None,
                        unit="person",
                        reference_year=2011,
                        source_name="Census of India",
                        source_url="https://example.test/census",
                        download_url="https://example.test/census.xlsx",
                        license_status="not_specified_in_catalog",
                    ),
                ]
            )
            db.add(
                GeographicPlace(
                    geoname_id=999001,
                    name="Alpha",
                    ascii_name="Alpha",
                    admin1_code="16",
                    admin1_name="State of Maharashtra",
                    latitude=19.0,
                    longitude=73.0,
                    feature_code="PPL",
                    population=1000,
                    record_modified_on="2025-01-01",
                    snapshot_date="2026-10-24",
                    source_name="GeoNames",
                    source_url="https://www.geonames.org/",
                    license_status="CC BY 4.0",
                )
            )
            db.add_all(
                [
                    AdministrativeBoundary(
                        boundary_id="boundary-a",
                        name="Alpha",
                        boundary_level="ADM2",
                        geometry={
                            "type": "Polygon",
                            "coordinates": [
                                [[73, 19], [74, 19], [74, 20], [73, 19]]
                            ],
                        },
                        source_version="test-release",
                        reference_year=2021,
                        source_data_updated_on="2023-01-19",
                        build_date="2023-12-12",
                        source_name="geoBoundaries",
                        source_url="https://example.test/boundaries",
                        download_url="https://example.test/boundaries.geojson",
                        license_status="ODbL 1.0",
                        license_url="https://opendatacommons.org/licenses/odbl/1-0/",
                    ),
                    AdministrativeBoundary(
                        boundary_id="boundary-b",
                        name="Alpha",
                        boundary_level="ADM2",
                        geometry={
                            "type": "Polygon",
                            "coordinates": [
                                [[75, 19], [76, 19], [76, 20], [75, 19]]
                            ],
                        },
                        source_version="test-release",
                        reference_year=2021,
                        source_data_updated_on="2023-01-19",
                        build_date="2023-12-12",
                        source_name="geoBoundaries",
                        source_url="https://example.test/boundaries",
                        download_url="https://example.test/boundaries.geojson",
                        license_status="ODbL 1.0",
                        license_url="https://opendatacommons.org/licenses/odbl/1-0/",
                    ),
                ]
            )
            db.commit()

            response = client.get("/api/geography/audit")
            audit = response.json()
            assert response.status_code == 200
            assert audit["census_observations"] == 2
            assert audit["census_geographies"] == 2
            assert audit["census_state_code_count"] == 1
            assert audit["census_district_code_pairs"] == 2
            assert audit["census_districts_by_state"] == [
                {
                    "state_code": "01",
                    "district_count": 2,
                    "district_codes": ["010", "011"],
                }
            ]
            assert audit["census_missing_values"] == 1
            assert audit["geonames_place_points"] == 1
            assert audit["geonames_unique_ids"] == 1
            assert audit["boundary_features"] == 2
            assert audit["boundary_duplicate_names"] == 1
            assert audit["boundary_features_without_official_district_code"] == 2
            assert audit["boundary_features_without_state_membership"] == 2
            assert audit["confirmed_district_crosswalk_rows"] == 0
            assert audit["exact_normalized_name_candidate_pairs"] == 1
            assert "never treated as a join" in audit["crosswalk_note"]

            boundary = db.query(AdministrativeBoundary).filter_by(
                boundary_id="boundary-b"
            ).one()
            db.add(
                DistrictCrosswalk(
                    boundary_source_version=boundary.source_version,
                    boundary_id=boundary.boundary_id,
                    official_state_code="27",
                    official_state_name="Maharashtra",
                    official_district_code="district-011",
                    official_district_name="Reviewed district",
                    census_state_code="01",
                    census_district_code="011",
                    census_reference_year=2011,
                    reference_year=2021,
                    match_method="manually_verified",
                    evidence_reference="https://official.example.test/crosswalk",
                    reviewed_by="reviewer",
                    reviewed_on="2026-10-25",
                )
            )
            db.commit()
            joined = client.get("/api/geography/audit").json()
            assert joined["confirmed_district_crosswalk_rows"] == 1
            assert joined["census_geographies_with_district_boundary_parent_match"] == 1
            assert joined["census_geographies_without_confirmed_boundary_join"] == 1

            db.query(CensusIndicator).delete()
            db.query(GeographicPlace).delete()
            db.query(DistrictCrosswalk).delete()
            db.query(AdministrativeBoundary).delete()
            db.commit()
