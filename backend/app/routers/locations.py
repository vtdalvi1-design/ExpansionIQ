from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import RetailLocation
from app.schemas import (
    LocationCreate,
    LocationListResponse,
    LocationResponse,
    LocationUpdate,
)
from app.services.geo_analysis import haversine_distance

router = APIRouter(prefix="/locations", tags=["Locations"])


def serialize_location(location: RetailLocation) -> dict:
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


@router.get("", response_model=LocationListResponse)
def list_locations(
    city: str | None = None,
    category: str | None = None,
    location_type: str | None = None,
    db: Session = Depends(get_db),
) -> dict:
    query = db.query(RetailLocation)
    if city:
        query = query.filter(func.lower(RetailLocation.city) == city.strip().casefold())
    if category:
        query = query.filter(
            func.lower(RetailLocation.category) == category.strip().casefold()
        )
    if location_type:
        if location_type not in {"candidate", "competitor"}:
            raise HTTPException(
                status_code=422,
                detail="Location type must be candidate or competitor.",
            )
        query = query.filter(RetailLocation.location_type == location_type)

    locations = query.order_by(RetailLocation.name).all()
    return {
        "count": len(locations),
        "locations": [serialize_location(location) for location in locations],
        "data_status": "available" if locations else "unavailable",
    }


@router.post("", response_model=LocationResponse, status_code=201)
def create_location(
    request: LocationCreate,
    db: Session = Depends(get_db),
) -> dict:
    location = RetailLocation(**request.model_dump())
    db.add(location)
    db.commit()
    db.refresh(location)
    return serialize_location(location)


@router.get("/{location_id}/nearby")
def nearby_locations(
    location_id: int,
    radius_km: float = Query(default=10, gt=0, le=1000),
    db: Session = Depends(get_db),
) -> dict:
    origin = db.get(RetailLocation, location_id)
    if origin is None:
        raise HTTPException(status_code=404, detail="Location not found.")

    nearby = []
    nearby_type = "competitor" if origin.location_type == "candidate" else "candidate"
    for location in (
        db.query(RetailLocation)
        .filter(
            RetailLocation.id != location_id,
            RetailLocation.location_type == nearby_type,
        )
    ):
        distance_km = haversine_distance(
            origin.latitude,
            origin.longitude,
            location.latitude,
            location.longitude,
        )
        if distance_km <= radius_km:
            nearby.append({**serialize_location(location), "distance_km": distance_km})

    nearby.sort(key=lambda item: item["distance_km"])
    return {
        "origin": serialize_location(origin),
        "radius_km": radius_km,
        "count": len(nearby),
        "locations": nearby,
        "nearby_type": nearby_type,
        "disclaimer": "Distances are straight-line calculations between supplied coordinates, not road travel distances.",
    }


@router.get("/{location_id}", response_model=LocationResponse)
def get_location(
    location_id: int,
    db: Session = Depends(get_db),
) -> dict:
    location = db.get(RetailLocation, location_id)
    if location is None:
        raise HTTPException(status_code=404, detail="Location not found.")
    return serialize_location(location)


@router.put("/{location_id}", response_model=LocationResponse)
def update_location(
    location_id: int,
    request: LocationUpdate,
    db: Session = Depends(get_db),
) -> dict:
    location = db.get(RetailLocation, location_id)
    if location is None:
        raise HTTPException(status_code=404, detail="Location not found.")

    for field, value in request.model_dump(exclude_unset=True).items():
        setattr(location, field, value)
    db.commit()
    db.refresh(location)
    return serialize_location(location)


@router.delete("/{location_id}", status_code=204)
def delete_location(
    location_id: int,
    db: Session = Depends(get_db),
) -> None:
    location = db.get(RetailLocation, location_id)
    if location is None:
        raise HTTPException(status_code=404, detail="Location not found.")
    db.delete(location)
    db.commit()
