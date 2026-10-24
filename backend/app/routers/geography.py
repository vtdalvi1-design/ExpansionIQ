from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import GeographicPlace
from app.schemas import GeographicPlaceListResponse

router = APIRouter(prefix="/geography", tags=["Geographic reference data"])

SOURCE_NAME = "GeoNames"
SOURCE_URL = "https://www.geonames.org/"
DOWNLOAD_URL = "https://download.geonames.org/export/dump/IN.zip"
LICENSE_STATUS = "CC BY 4.0"
LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/"


@router.get("/places", response_model=GeographicPlaceListResponse)
def list_geographic_places(
    search: str | None = Query(default=None, max_length=120),
    state_code: str | None = Query(default=None, max_length=20),
    limit: int = Query(default=200, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> dict:
    base_query = db.query(GeographicPlace)
    dataset_total = base_query.count()
    query = base_query
    if search and search.strip():
        pattern = f"%{search.strip()}%"
        query = query.filter(
            GeographicPlace.name.ilike(pattern)
            | GeographicPlace.ascii_name.ilike(pattern)
        )
    if state_code and state_code.strip():
        query = query.filter(
            func.lower(GeographicPlace.admin1_code) == state_code.strip().lower()
        )

    total = query.count()
    places = (
        query.order_by(
            GeographicPlace.population.desc(),
            GeographicPlace.name,
            GeographicPlace.geoname_id,
        )
        .offset(offset)
        .limit(limit)
        .all()
    )
    state_options = [
        {"code": code, "name": name or f"Administrative code {code}"}
        for code, name in (
            db.query(
                GeographicPlace.admin1_code,
                func.max(GeographicPlace.admin1_name),
            )
            .filter(GeographicPlace.admin1_code != "")
            .group_by(GeographicPlace.admin1_code)
            .order_by(GeographicPlace.admin1_code)
            .all()
        )
    ]
    snapshot_date = db.query(func.max(GeographicPlace.snapshot_date)).scalar()

    return {
        "count": len(places),
        "total": total,
        "places": places,
        "state_options": state_options,
        "snapshot_date": snapshot_date,
        "source_name": SOURCE_NAME,
        "source_url": SOURCE_URL,
        "download_url": DOWNLOAD_URL,
        "license_status": LICENSE_STATUS,
        "license_url": LICENSE_URL,
        "data_status": "available" if dataset_total else "unavailable",
    }
