from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AnalysisRun
from app.schemas import ComparisonRequest, ComparisonResponse
from app.services.data_service import get_cities_for_category
from app.services.scoring import calculate_score, rank_results

router = APIRouter(prefix="/comparisons", tags=["Comparisons"])


@router.post("", response_model=ComparisonResponse)
def compare_cities(
    request: ComparisonRequest,
    db: Session = Depends(get_db),
) -> dict:
    dataset = get_cities_for_category(request.category, db=db)
    by_city = {row["city"].casefold(): row for row in dataset}

    results = []

    for city_name in request.cities:
        row = by_city.get(city_name.casefold())

        if row is None:
            results.append(
                {
                    "name": city_name,
                    "city_name": city_name,
                    "category": request.category,
                    "total_score": None,
                    "score_status": "incomplete",
                    "missing_factors": [
                        "demand",
                        "competition_opportunity",
                        "accessibility",
                        "cost_viability",
                        "category_fit",
                    ],
                    "source_status": "no_matching_data",
                    "source": None,
                    "notes": None,
                }
            )
            continue

        factors = {
            "demand": row.get("demand"),
            "competition_opportunity": row.get("competition_opportunity"),
            "accessibility": row.get("accessibility"),
            "cost_viability": row.get("cost_viability"),
            "category_fit": row.get("category_fit"),
        }

        scored = calculate_score(factors, request.category)
        source_status = row.get("source_status", "unverified")
        source = row.get("source")
        missing_factors = list(scored["missing_factors"])
        if source_status != "verified" or not source:
            missing_factors.append("verified_source")

        results.append({
            "name": city_name,
            "city_name": city_name,
            "category": request.category,
            "total_score": (
                scored["total_score"]
                if not missing_factors
                else None
            ),
            "score_status": "complete" if not missing_factors else "incomplete",
            "missing_factors": missing_factors,
            "source_status": source_status,
            "source": source,
            "notes": row.get("notes"),
            "demand_score": scored["factor_scores"]["demand"],
            "competition_score": scored["factor_scores"]["competition_opportunity"],
            "accessibility_score": scored["factor_scores"]["accessibility"],
            "cost_score": scored["factor_scores"]["cost_viability"],
            "category_fit_score": scored["factor_scores"]["category_fit"],
        })

    ranked = rank_results(results)

    response = {
        "category": request.category,
        "results": ranked,
        "data_status": (
            "available"
            if any(item["total_score"] is not None for item in ranked)
            else "no_complete_scores"
        ),
    }

    analysis = AnalysisRun(
        category=request.category,
        selected_cities=request.cities,
        results=ranked,
        is_demo_data=any(
            item.get("source_status") != "verified"
            for item in ranked
        ),
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return {**response, "analysis_id": analysis.id}