import math
from typing import Any

CATEGORY_WEIGHTS: dict[str, dict[str, float]] = {
    "Grocery": {
        "demand": 0.30,
        "competition_opportunity": 0.15,
        "accessibility": 0.20,
        "cost_viability": 0.20,
        "category_fit": 0.15,
    },
    "Grocery store": {
        "demand": 0.30,
        "competition_opportunity": 0.15,
        "accessibility": 0.20,
        "cost_viability": 0.20,
        "category_fit": 0.15,
    },
    "Fashion": {
        "demand": 0.25,
        "competition_opportunity": 0.20,
        "accessibility": 0.15,
        "cost_viability": 0.15,
        "category_fit": 0.25,
    },
    "Clothing store": {
        "demand": 0.25,
        "competition_opportunity": 0.20,
        "accessibility": 0.15,
        "cost_viability": 0.15,
        "category_fit": 0.25,
    },
    "Electronics": {
        "demand": 0.25,
        "competition_opportunity": 0.20,
        "accessibility": 0.15,
        "cost_viability": 0.15,
        "category_fit": 0.25,
    },
    "Café or restaurant": {
        "demand": 0.30,
        "competition_opportunity": 0.20,
        "accessibility": 0.20,
        "cost_viability": 0.15,
        "category_fit": 0.15,
    },
    "Retail store": {
        "demand": 0.25,
        "competition_opportunity": 0.20,
        "accessibility": 0.20,
        "cost_viability": 0.20,
        "category_fit": 0.15,
    },
    "Pharmacy": {
        "demand": 0.30,
        "competition_opportunity": 0.15,
        "accessibility": 0.25,
        "cost_viability": 0.15,
        "category_fit": 0.15,
    },
    "Fitness centre": {
        "demand": 0.30,
        "competition_opportunity": 0.15,
        "accessibility": 0.20,
        "cost_viability": 0.15,
        "category_fit": 0.20,
    },
    "Salon": {
        "demand": 0.25,
        "competition_opportunity": 0.20,
        "accessibility": 0.25,
        "cost_viability": 0.15,
        "category_fit": 0.15,
    },
    "Educational institute": {
        "demand": 0.25,
        "competition_opportunity": 0.10,
        "accessibility": 0.25,
        "cost_viability": 0.15,
        "category_fit": 0.25,
    },
    "Service business": {
        "demand": 0.25,
        "competition_opportunity": 0.20,
        "accessibility": 0.20,
        "cost_viability": 0.20,
        "category_fit": 0.15,
    },
    "Other business": {
        "demand": 0.25,
        "competition_opportunity": 0.20,
        "accessibility": 0.20,
        "cost_viability": 0.20,
        "category_fit": 0.15,
    },
}


def calculate_score(
    factors: dict[str, Any],
    category: str,
) -> dict[str, Any]:
    if category not in CATEGORY_WEIGHTS:
        raise ValueError(f"Unsupported category: {category}")

    weights = CATEGORY_WEIGHTS[category]
    scores: dict[str, float | None] = {}
    missing: list[str] = []

    for factor in weights:
        value = factors.get(factor)

        if value is None:
            scores[factor] = None
            missing.append(factor)
            continue
        if isinstance(value, bool):
            raise ValueError(f"Factor '{factor}' must be numeric or None.")

        try:
            numeric_value = float(value)
        except (TypeError, ValueError) as exc:
            raise ValueError(
                f"Factor '{factor}' must be numeric or None."
            ) from exc

        if not math.isfinite(numeric_value) or not 0 <= numeric_value <= 100:
            raise ValueError(
                f"Factor '{factor}' must be between 0 and 100."
            )

        scores[factor] = numeric_value

    if missing:
        return {
            "category": category,
            "factor_scores": scores,
            "weights": weights,
            "total_score": None,
            "missing_factors": missing,
            "score_status": "incomplete",
        }

    total = sum(
        float(scores[factor]) * weight
        for factor, weight in weights.items()
    )

    return {
        "category": category,
        "factor_scores": scores,
        "weights": weights,
        "total_score": round(total, 2),
        "missing_factors": [],
        "score_status": "complete",
    }


def rank_results(results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    ranked = [dict(result) for result in results]

    ranked.sort(
        key=lambda result: (
            result.get("total_score") is None,
            -(result.get("total_score") or 0),
            str(result.get("name", "")),
        )
    )

    previous_score = None
    current_rank = 0

    for index, result in enumerate(ranked):
        score = result.get("total_score")

        if score is None:
            result["rank"] = None
            result["tie"] = False
            continue

        if previous_score is None or abs(score - previous_score) > 0.01:
            current_rank = index + 1

        result["rank"] = current_rank
        result["tie"] = (
            previous_score is not None
            and abs(score - previous_score) <= 0.01
        )
        previous_score = score

    return ranked