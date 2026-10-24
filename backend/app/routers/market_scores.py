from fastapi import APIRouter

from app.schemas import (
    MarketScoreEvaluationRequest,
    MarketScoreEvaluationResponse,
)
from app.services.market_opportunity import evaluate_market_opportunity

router = APIRouter(prefix="/market-scores", tags=["Proposed market scoring"])


@router.post(
    "/evaluate",
    response_model=MarketScoreEvaluationResponse,
)
def evaluate_proposed_market_score(
    request: MarketScoreEvaluationRequest,
) -> dict:
    return evaluate_market_opportunity(request.components, request.weights)
