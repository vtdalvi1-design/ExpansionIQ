from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CensusIndicator
from app.schemas import CensusIndicatorListResponse

router = APIRouter(prefix="/census", tags=["Census data"])

SOURCE_NAME = "Office of the Registrar General & Census Commissioner, India"
SOURCE_URL = "https://censusindia.gov.in/nada/index.php/catalog/45261"
DOWNLOAD_URL = (
    "https://censusindia.gov.in/nada/index.php/catalog/45261/download/"
    "48987/PCA11-UA-0000.xlsx"
)
REFERENCE_YEAR = 2011
LICENSE_STATUS = "not_specified_in_catalog"


@router.get("/indicators", response_model=CensusIndicatorListResponse)
def list_census_indicators(
    search: str | None = Query(default=None, max_length=120),
    state_code: str | None = Query(default=None, max_length=10),
    census_level: int | None = Query(default=None, ge=0, le=3),
    level_unreported: bool = False,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> dict:
    base_query = db.query(CensusIndicator).filter(
        CensusIndicator.indicator_code == "TOT_P",
        CensusIndicator.reference_year == REFERENCE_YEAR,
    )
    dataset_total = base_query.count()
    query = base_query
    if search and search.strip():
        query = query.filter(
            CensusIndicator.geography_name.ilike(f"%{search.strip()}%")
        )
    if state_code and state_code.strip():
        query = query.filter(
            func.lower(CensusIndicator.state_code) == state_code.strip().lower()
        )
    if census_level is not None:
        query = query.filter(CensusIndicator.census_level == census_level)
    if level_unreported:
        query = query.filter(CensusIndicator.census_level.is_(None))

    total = query.count()
    indicators = (
        query.order_by(
            CensusIndicator.geography_name,
            CensusIndicator.state_code,
            CensusIndicator.id,
        )
        .offset(offset)
        .limit(limit)
        .all()
    )
    state_codes = [
        row[0]
        for row in db.query(CensusIndicator.state_code)
        .filter(
            CensusIndicator.indicator_code == "TOT_P",
            CensusIndicator.reference_year == REFERENCE_YEAR,
        )
        .distinct()
        .order_by(CensusIndicator.state_code)
        .all()
    ]

    return {
        "count": len(indicators),
        "total": total,
        "dataset_total": dataset_total,
        "indicators": indicators,
        "state_codes": state_codes,
        "reference_year": REFERENCE_YEAR,
        "source_name": SOURCE_NAME,
        "source_url": SOURCE_URL,
        "download_url": DOWNLOAD_URL,
        "license_status": LICENSE_STATUS,
        "data_status": "available" if dataset_total else "unavailable",
    }
