from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import City, MarketFactor
from app.schemas import MarketFactorInput, MarketFactorResponse
from app.services.data_service import load_city_data

router = APIRouter(prefix="/cities", tags=["Cities"])


@router.get("")
def list_cities(db: Session = Depends(get_db)) -> dict[str, list[str]]:
    cities = {
        row["city"].casefold(): row["city"]
        for row in load_city_data()
    }
    for city in db.query(City).join(MarketFactor).distinct().all():
        cities.setdefault(city.name.casefold(), city.name)
    return {"cities": sorted(cities.values(), key=str.casefold)}


def serialize_factor(factor: MarketFactor) -> dict:
    return {
        "id": factor.id,
        "city_id": factor.city_id,
        "city": factor.city.name,
        "category": factor.category,
        "demand": factor.demand,
        "competition_opportunity": factor.competition_opportunity,
        "accessibility": factor.accessibility,
        "cost_viability": factor.cost_viability,
        "category_fit": factor.category_fit,
        "source": factor.source,
        "source_status": factor.source_status or "unverified",
        "notes": factor.notes,
    }


@router.get("/factors", response_model=list[MarketFactorResponse])
def list_factors(db: Session = Depends(get_db)) -> list[dict]:
    return [
        serialize_factor(factor)
        for factor in db.query(MarketFactor).join(City).order_by(City.name).all()
    ]


@router.post("/factors", response_model=MarketFactorResponse)
def save_factor(
    request: MarketFactorInput,
    db: Session = Depends(get_db),
) -> dict:
    city = (
        db.query(City)
        .filter(func.lower(City.name) == request.city.casefold())
        .first()
    )
    if city is None:
        city = City(name=request.city)
        db.add(city)
        db.flush()

    factor = (
        db.query(MarketFactor)
        .filter(
            MarketFactor.city_id == city.id,
            func.lower(MarketFactor.category) == request.category.casefold(),
        )
        .first()
    )
    if factor is None:
        factor = MarketFactor(city_id=city.id, category=request.category)
        db.add(factor)

    for field in (
        "demand",
        "competition_opportunity",
        "accessibility",
        "cost_viability",
        "category_fit",
        "source",
        "source_status",
        "notes",
    ):
        setattr(factor, field, getattr(request, field))

    db.commit()
    db.refresh(factor)
    return serialize_factor(factor)


@router.delete("/factors/{factor_id}", status_code=204)
def delete_factor(factor_id: int, db: Session = Depends(get_db)) -> None:
    factor = db.get(MarketFactor, factor_id)
    if factor is None:
        raise HTTPException(status_code=404, detail="Market factor not found.")
    db.delete(factor)
    db.commit()
