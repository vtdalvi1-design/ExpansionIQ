from fastapi import APIRouter, HTTPException

from app.schemas import ScenarioRequest
from app.services.scenario_engine import apply_scenario

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])


@router.post("/analyze")
def analyze_scenario(request: ScenarioRequest):
    try:
        return apply_scenario(
            factors=request.factors.model_dump(),
            category=request.category,
            demand_change=request.demand_change,
            cost_change=request.cost_change,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc