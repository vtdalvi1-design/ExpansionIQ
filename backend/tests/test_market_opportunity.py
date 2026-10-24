import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import MarketScoreComponentInput
from app.services.market_opportunity import (
    DEFAULT_WEIGHTS,
    evaluate_market_opportunity,
)


def _complete_components():
    return {
        name: MarketScoreComponentInput(
            score=score,
            status="available",
            source_reference=f"dataset:{name}",
            reference_period="2024",
            unit="normalized score / 100",
            explanation=f"Source-backed {name} component.",
        )
        for name, score in (
            ("demographic_demand", 80),
            ("economic_strength", 60),
            ("business_activity", 70),
            ("retail_competition_supply", 50),
            ("accessibility_connectivity", 90),
        )
    }


def test_proposed_weights_and_explanations_produce_transparent_score():
    result = evaluate_market_opportunity(_complete_components())

    assert result["score_version"] == "market-opportunity-proposed-v1"
    assert result["weights"] == DEFAULT_WEIGHTS
    assert result["eligibility_status"] == "eligible"
    assert result["total_score"] == 70
    assert result["evidence_coverage_percent"] == 100
    assert result["eligible_coverage_percent"] == 100
    assert (
        result["component_results"]["demographic_demand"]["contribution"]
        == 20
    )
    assert "not a validated prediction" in result["disclaimer"]


def test_missing_values_are_not_zero_and_coverage_is_separate():
    components = _complete_components()
    components["business_activity"] = MarketScoreComponentInput(status="missing")

    result = evaluate_market_opportunity(components)

    assert result["eligibility_status"] == "insufficient_data"
    assert result["total_score"] is None
    assert result["evidence_coverage_percent"] == 80
    assert result["eligible_coverage_percent"] == 80
    assert result["missing_components"] == ["business_activity"]
    assert result["component_results"]["business_activity"]["score"] is None
    assert result["component_results"]["business_activity"]["contribution"] is None


def test_stale_and_unverified_evidence_is_coverage_but_not_score_eligible():
    components = _complete_components()
    components["economic_strength"] = MarketScoreComponentInput(
        score=60,
        status="stale",
        source_reference="dataset:historic-economy",
        reference_period="2011",
    )
    components["business_activity"] = MarketScoreComponentInput(
        score=70,
        status="unverified",
        source_reference="unverified:user-entry",
    )

    result = evaluate_market_opportunity(components)

    assert result["total_score"] is None
    assert result["evidence_coverage_percent"] == 100
    assert result["eligible_coverage_percent"] == 55
    assert result["stale_components"] == ["economic_strength"]
    assert result["unverified_components"] == ["business_activity"]
    assert (
        result["component_results"]["economic_strength"]["contribution"] is None
    )


def test_custom_weights_must_cover_components_and_sum_to_one():
    components = _complete_components()
    with pytest.raises(ValueError, match="sum to 1"):
        evaluate_market_opportunity(components, {name: 0.1 for name in DEFAULT_WEIGHTS})

    with pytest.raises(ValueError, match="exactly the five"):
        evaluate_market_opportunity(components, {"demographic_demand": 1.0})


def test_evaluation_endpoint_returns_insufficient_data_for_empty_observations():
    with TestClient(app) as client:
        response = client.post(
            "/api/market-scores/evaluate",
            json={"components": {}},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["eligibility_status"] == "insufficient_data"
    assert body["total_score"] is None
    assert body["evidence_coverage_percent"] == 0
    assert body["missing_components"] == list(DEFAULT_WEIGHTS)


def test_evaluation_endpoint_rejects_unreferenced_available_component():
    with TestClient(app) as client:
        response = client.post(
            "/api/market-scores/evaluate",
            json={
                "components": {
                    "demographic_demand": {
                        "score": 80,
                        "status": "available",
                    }
                }
            },
        )

    assert response.status_code == 422
