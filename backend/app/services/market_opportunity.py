import math
from typing import Any

from app.schemas import MarketScoreComponentInput

SCORE_VERSION = "market-opportunity-proposed-v1"
DEFAULT_WEIGHTS: dict[str, float] = {
    "demographic_demand": 0.25,
    "economic_strength": 0.25,
    "business_activity": 0.20,
    "retail_competition_supply": 0.15,
    "accessibility_connectivity": 0.15,
}
COMPONENTS = tuple(DEFAULT_WEIGHTS)
MINIMUM_AVAILABLE_COMPONENTS = len(COMPONENTS)
METHODOLOGY = (
    "Weighted sum of five pre-normalized 0-100 component opportunity scores. "
    "The initial weights are business assumptions, not statistically validated. "
    "Each component must be backed by sourced, non-stale evidence; no missing "
    "input is imputed."
)
DISCLAIMER = (
    "This proposed score is not a validated prediction of sales, demand, or "
    "profitability. Competition/supply must be interpreted for the selected "
    "category during source-specific normalization; higher component scores "
    "must consistently mean greater opportunity."
)


def _validate_weights(weights: dict[str, float] | None) -> dict[str, float]:
    if weights is None:
        return dict(DEFAULT_WEIGHTS)
    if set(weights) != set(COMPONENTS):
        raise ValueError("Weights must define exactly the five score components.")
    normalized: dict[str, float] = {}
    for component, weight in weights.items():
        if isinstance(weight, bool):
            raise ValueError(f"Weight for {component} must be numeric.")
        try:
            numeric_weight = float(weight)
        except (TypeError, ValueError) as error:
            raise ValueError(f"Weight for {component} must be numeric.") from error
        if not math.isfinite(numeric_weight) or numeric_weight < 0:
            raise ValueError(f"Weight for {component} must be finite and nonnegative.")
        normalized[component] = numeric_weight
    if not math.isclose(sum(normalized.values()), 1.0, abs_tol=1e-9):
        raise ValueError("Component weights must sum to 1.")
    return normalized


def evaluate_market_opportunity(
    components: dict[str, MarketScoreComponentInput],
    weights: dict[str, float] | None = None,
) -> dict[str, Any]:
    active_weights = _validate_weights(weights)
    normalized_components = {
        name: components.get(name, MarketScoreComponentInput(status="missing"))
        for name in COMPONENTS
    }
    component_results: dict[str, dict[str, Any]] = {}
    evidence_coverage = 0.0
    eligible_coverage = 0.0
    missing: list[str] = []
    stale: list[str] = []
    unverified: list[str] = []
    complete = True
    total = 0.0

    for name in COMPONENTS:
        evidence = normalized_components[name]
        weight = active_weights[name]
        observed = evidence.score is not None and evidence.status in {
            "available",
            "stale",
            "unverified",
        }
        eligible = (
            evidence.status == "available"
            and evidence.score is not None
            and evidence.source_reference is not None
        )
        contribution = (
            round(float(evidence.score) * weight, 4) if eligible else None
        )
        if observed:
            evidence_coverage += weight
        if eligible:
            eligible_coverage += weight
            total += float(evidence.score) * weight
        else:
            complete = False
            if evidence.status in {"missing", "suppressed"} or evidence.score is None:
                missing.append(name)
            if evidence.status == "stale":
                stale.append(name)
            if evidence.status == "unverified":
                unverified.append(name)

        component_results[name] = {
            "score": evidence.score,
            "status": evidence.status,
            "weight": weight,
            "contribution": contribution,
            "source_reference": evidence.source_reference,
            "reference_period": evidence.reference_period,
            "unit": evidence.unit,
            "explanation": evidence.explanation,
            "included_in_score": eligible,
        }

    return {
        "score_version": SCORE_VERSION,
        "methodology": METHODOLOGY,
        "weights": active_weights,
        "minimum_available_components": MINIMUM_AVAILABLE_COMPONENTS,
        "required_components": list(COMPONENTS),
        "total_score": round(total, 2) if complete else None,
        "eligibility_status": "eligible" if complete else "insufficient_data",
        "evidence_coverage_percent": round(evidence_coverage * 100, 2),
        "eligible_coverage_percent": round(eligible_coverage * 100, 2),
        "missing_components": missing,
        "stale_components": stale,
        "unverified_components": unverified,
        "component_results": component_results,
        "disclaimer": DISCLAIMER,
    }
