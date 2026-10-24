from datetime import timezone
import hashlib
import hmac
import secrets
import unicodedata

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AnalysisRun, CensusIndicator, GeographicPlace, RetailLocation
from app.schemas import DemoAnalysisRequest, DemoAnalysisResponse
from app.services.demo_analysis import build_demo_analysis
from app.services.pdf_report import generate_feasibility_pdf

router = APIRouter(prefix="/analyses", tags=["Demo analyses"])


def _place_record(place: GeographicPlace) -> dict:
    return {
        "geoname_id": place.geoname_id,
        "name": place.name,
        "ascii_name": place.ascii_name,
        "admin1_code": place.admin1_code,
        "admin1_name": place.admin1_name,
        "latitude": place.latitude,
        "longitude": place.longitude,
        "feature_code": place.feature_code,
        "population": place.population,
        "record_modified_on": place.record_modified_on,
        "snapshot_date": place.snapshot_date,
        "source_name": place.source_name,
        "source_url": place.source_url,
        "license_status": place.license_status,
    }


def _competitor_record(location: RetailLocation) -> dict:
    return {
        "id": location.id,
        "name": location.name,
        "city": location.city,
        "location_type": location.location_type,
        "latitude": location.latitude,
        "longitude": location.longitude,
        "category": location.category,
        "source_status": location.source_status,
        "source_name": location.source_name,
        "notes": location.notes,
    }


def _normalize_place_label(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value.casefold())
    return "".join(
        character
        for character in decomposed
        if not unicodedata.combining(character)
    )


def _serialized_analysis(analysis: AnalysisRun) -> dict:
    payload = analysis.analysis_payload
    if not payload:
        raise HTTPException(
            status_code=404,
            detail="This stored analysis does not contain a demo analysis payload.",
        )
    return {
        **payload,
        "analysis_id": analysis.id,
        "created_at": (
            analysis.created_at.replace(tzinfo=timezone.utc).isoformat()
            if analysis.created_at.tzinfo is None
            else analysis.created_at.isoformat()
        ),
    }


@router.post("/demo", response_model=DemoAnalysisResponse)
def create_demo_analysis(
    request: DemoAnalysisRequest,
    db: Session = Depends(get_db),
) -> dict:
    payload = build_demo_analysis(request)
    access_token = secrets.token_urlsafe(32)

    map_places: list[dict] = []
    map_resolutions: list[dict] = []
    for city in request.cities:
        parts = [part.strip() for part in city.rsplit(",", maxsplit=1)]
        place_name = parts[0]
        query = db.query(GeographicPlace).filter(
            or_(
                func.lower(GeographicPlace.name) == place_name.casefold(),
                func.lower(GeographicPlace.ascii_name) == place_name.casefold(),
            )
        )
        matches = (
            query.order_by(
                GeographicPlace.population.desc(),
                GeographicPlace.geoname_id,
            )
            .all()
        )
        if len(parts) == 2:
            state_filter = _normalize_place_label(parts[1])
            matches = [
                place
                for place in matches
                if state_filter
                in _normalize_place_label(place.admin1_name or "")
            ]
        if len(matches) == 1:
            matched_place = matches[0]
            map_places.append(_place_record(matched_place))
            map_resolutions.append(
                {
                    "city_name": city,
                    "status": "matched",
                    "match_count": 1,
                    "note": "One exact GeoNames place matched this city input.",
                }
            )
            # Find Census population if available
            census_match = (
                db.query(CensusIndicator)
                .filter(CensusIndicator.geography_name.ilike(f"%{place_name}%"))
                .first()
            )
            for f in payload.get("forecasts", []):
                if f.get("city_name") == city:
                    f["geonames_population"] = matched_place.population
                    f["state_name"] = matched_place.admin1_name
                    if census_match:
                        f["census_population"] = census_match.value
        elif matches:
            map_resolutions.append(
                {
                    "city_name": city,
                    "status": "ambiguous",
                    "match_count": len(matches),
                    "note": "Multiple exact place-name matches exist. Add a state or union territory after a comma to disambiguate.",
                }
            )
        else:
            map_resolutions.append(
                {
                    "city_name": city,
                    "status": "unavailable",
                    "match_count": 0,
                    "note": "No exact GeoNames place match was found. No coordinates were invented.",
                }
            )

    competitors = (
        db.query(RetailLocation)
        .filter(
            func.lower(RetailLocation.city).in_(
                {
                    city.rsplit(",", maxsplit=1)[0].strip().casefold()
                    for city in request.cities
                }
            ),
            RetailLocation.location_type == "competitor",
            func.lower(RetailLocation.category) == request.category.casefold(),
        )
        .order_by(RetailLocation.city, RetailLocation.name)
        .all()
    )
    payload["map_places"] = map_places
    payload["map_resolutions"] = map_resolutions
    payload["competitors"] = [_competitor_record(item) for item in competitors]

    analysis = AnalysisRun(
        category=request.category,
        selected_cities=request.cities,
        results=payload["results"],
        is_demo_data=True,
        analysis_payload=payload,
        analysis_access_token_hash=hashlib.sha256(
            access_token.encode("utf-8")
        ).hexdigest(),
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return {
        **_serialized_analysis(analysis),
        "access_token": access_token,
    }


@router.get("/{analysis_id}", response_model=DemoAnalysisResponse)
def get_demo_analysis(
    analysis_id: int,
    authorization: str = Header(),
    db: Session = Depends(get_db),
) -> dict:
    analysis = db.get(AnalysisRun, analysis_id)
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    if not analysis.analysis_access_token_hash:
        raise HTTPException(
            status_code=404,
            detail="This analysis is not available through the demo retrieval endpoint.",
        )
    token_parts = authorization.split(" ", maxsplit=1)
    if len(token_parts) != 2 or token_parts[0].casefold() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="A valid analysis access token is required.",
        )
    provided_hash = hashlib.sha256(token_parts[1].encode("utf-8")).hexdigest()
    if not hmac.compare_digest(
        provided_hash,
        analysis.analysis_access_token_hash,
    ):
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return _serialized_analysis(analysis)


@router.get("/{analysis_id}/pdf")
def download_analysis_pdf(
    analysis_id: int,
    token: str | None = Query(default=None),
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> Response:
    analysis = db.get(AnalysisRun, analysis_id)
    if analysis is None or not analysis.analysis_payload:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    access_token = token
    if not access_token and authorization:
        parts = authorization.split(" ", maxsplit=1)
        if len(parts) == 2 and parts[0].casefold() == "bearer":
            access_token = parts[1]

    if not access_token:
        raise HTTPException(status_code=401, detail="Valid access token required to download report.")

    provided_hash = hashlib.sha256(access_token.encode("utf-8")).hexdigest()
    if not hmac.compare_digest(provided_hash, analysis.analysis_access_token_hash or ""):
        raise HTTPException(status_code=403, detail="Invalid access token.")

    payload = dict(analysis.analysis_payload)
    payload["analysis_id"] = analysis.id
    payload["created_at"] = analysis.created_at.isoformat()

    pdf_bytes = generate_feasibility_pdf(payload)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="ExpansionIQ_Feasibility_Report_{analysis.id}.pdf"',
            "Content-Type": "application/pdf",
        },
    )
