import json

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AdministrativeBoundary, DistrictCrosswalk
from app.schemas import AdministrativeBoundaryListResponse
from app.services.boundary_import import (
    BOUNDARY_SOURCE,
    BUILD_DATE,
    DOWNLOAD_URL,
    LICENSE_STATUS,
    LICENSE_URL,
    REFERENCE_YEAR,
    REPORTED_FEATURE_COUNT,
    SOURCE_DATA_UPDATED_ON,
    SOURCE_NAME,
    SOURCE_URL,
)

router = APIRouter(prefix="/geography", tags=["Administrative boundaries"])

COVERAGE_NOTE = (
    "District boundaries only. 735 features are present although source metadata "
    "reports 736. The source itself does not provide official district codes or "
    "state membership; only separately reviewed crosswalk entries are surfaced. "
    "Do not treat this snapshot as complete or use its internal shape IDs as "
    "official administrative codes."
)


@router.get("/boundaries", response_model=AdministrativeBoundaryListResponse)
def list_district_boundaries(
    request: Request,
    search: str | None = Query(default=None, max_length=120),
    state_code: str | None = Query(default=None, max_length=20),
    limit: int = Query(default=800, ge=1, le=800),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> dict:
    latest_build_date = (
        db.query(func.max(AdministrativeBoundary.build_date))
        .filter(AdministrativeBoundary.source_name == SOURCE_NAME)
        .scalar()
    )
    query = (
        db.query(AdministrativeBoundary, DistrictCrosswalk)
        .outerjoin(
            DistrictCrosswalk,
            (DistrictCrosswalk.boundary_source_version == AdministrativeBoundary.source_version)
            & (DistrictCrosswalk.boundary_id == AdministrativeBoundary.boundary_id),
        )
        .filter(
            AdministrativeBoundary.source_name == SOURCE_NAME,
            AdministrativeBoundary.build_date == latest_build_date,
        )
    )
    if search and search.strip():
        query = query.filter(
            AdministrativeBoundary.name.ilike(f"%{search.strip()}%")
        )
    if state_code and state_code.strip():
        query = query.filter(
            DistrictCrosswalk.official_state_code == state_code.strip()
        )

    total = query.count()
    boundary_rows = (
        query.order_by(
            AdministrativeBoundary.name,
            AdministrativeBoundary.boundary_id,
        )
        .offset(offset)
        .limit(limit)
        .all()
    )
    state_options = [
        {"code": code, "name": name}
        for code, name in (
            db.query(
                DistrictCrosswalk.official_state_code,
                func.min(DistrictCrosswalk.official_state_name),
            )
            .join(
                AdministrativeBoundary,
                (DistrictCrosswalk.boundary_source_version == AdministrativeBoundary.source_version)
                & (DistrictCrosswalk.boundary_id == AdministrativeBoundary.boundary_id),
            )
            .filter(
                AdministrativeBoundary.source_name == SOURCE_NAME,
                AdministrativeBoundary.build_date == latest_build_date,
                DistrictCrosswalk.official_state_name.is_not(None),
            )
            .group_by(DistrictCrosswalk.official_state_code)
            .order_by(DistrictCrosswalk.official_state_code)
            .all()
        )
    ]
    return {
        "count": len(boundary_rows),
        "total": total,
        "reported_source_count": REPORTED_FEATURE_COUNT,
        "reference_year": REFERENCE_YEAR,
        "source_data_updated_on": SOURCE_DATA_UPDATED_ON,
        "build_date": BUILD_DATE,
        "source_name": SOURCE_NAME,
        "source_url": SOURCE_URL,
        "database_download_url": str(
            request.url_for("download_district_boundaries")
        ),
        "boundary_source": BOUNDARY_SOURCE,
        "download_url": DOWNLOAD_URL,
        "license_status": LICENSE_STATUS,
        "license_url": LICENSE_URL,
        "coverage_note": COVERAGE_NOTE,
        "state_options": state_options,
        "boundaries": [
            {
                "boundary_id": boundary.boundary_id,
                "name": boundary.name,
                "level": boundary.boundary_level,
                "state_code": crosswalk.official_state_code if crosswalk else None,
                "district_code": crosswalk.official_district_code if crosswalk else None,
                "geometry": boundary.geometry,
            }
            for boundary, crosswalk in boundary_rows
        ],
        "data_status": "available" if total else "unavailable",
    }


@router.get("/boundaries/geojson", name="download_district_boundaries")
def download_district_boundaries(
    db: Session = Depends(get_db),
) -> Response:
    latest_build_date = (
        db.query(func.max(AdministrativeBoundary.build_date))
        .filter(AdministrativeBoundary.source_name == SOURCE_NAME)
        .scalar()
    )
    boundary_rows = (
        db.query(AdministrativeBoundary, DistrictCrosswalk)
        .outerjoin(
            DistrictCrosswalk,
            (DistrictCrosswalk.boundary_source_version == AdministrativeBoundary.source_version)
            & (DistrictCrosswalk.boundary_id == AdministrativeBoundary.boundary_id),
        )
        .filter(
            AdministrativeBoundary.source_name == SOURCE_NAME,
            AdministrativeBoundary.build_date == latest_build_date,
        )
        .order_by(
            AdministrativeBoundary.name,
            AdministrativeBoundary.boundary_id,
        )
        .all()
    )
    boundaries = [boundary for boundary, _ in boundary_rows]
    crosswalk_by_boundary = {
        (mapping.boundary_source_version, mapping.boundary_id): mapping
        for _, mapping in boundary_rows
        if mapping is not None
    }
    if not boundaries:
        raise HTTPException(
            status_code=404,
            detail="No district boundary dataset has been imported.",
        )

    collection = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "boundary_id": item.boundary_id,
                    "shapeName": item.name,
                    "shapeType": item.boundary_level,
                    "reference_year": item.reference_year,
                    "source_name": item.source_name,
                    "source_url": item.source_url,
                    "license": item.license_status,
                    "license_url": item.license_url,
                    "state_code": (
                        crosswalk_by_boundary[
                            (item.source_version, item.boundary_id)
                        ].official_state_code
                        if (item.source_version, item.boundary_id)
                        in crosswalk_by_boundary
                        else None
                    ),
                    "district_code": (
                        crosswalk_by_boundary[
                            (item.source_version, item.boundary_id)
                        ].official_district_code
                        if (item.source_version, item.boundary_id)
                        in crosswalk_by_boundary
                        else None
                    ),
                },
                "geometry": item.geometry,
            }
            for item in boundaries
        ],
    }
    return Response(
        content=json.dumps(collection, ensure_ascii=False, separators=(",", ":")),
        media_type="application/geo+json",
        headers={
            "Content-Disposition": (
                'attachment; filename="expansioniq-india-district-boundaries.geojson"'
            )
        },
    )
