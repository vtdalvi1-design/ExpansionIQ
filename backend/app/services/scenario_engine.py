from typing import Any

from app.services.scoring import calculate_score


def apply_scenario(
    factors: dict[str, Any],
    category: str,
    demand_change: float = 0,
    cost_change: float = 0,
) -> dict[str, Any]:
    if not -100 <= demand_change <= 100:
        raise ValueError("Demand change must be between -100 and 100.")

    if not -100 <= cost_change <= 100:
        raise ValueError("Cost change must be between -100 and 100.")

    baseline = calculate_score(factors, category)
    adjusted = dict(factors)

    for key, score_change in (
        ("demand", demand_change),
        ("cost_viability", -cost_change),
    ):
        value = adjusted.get(key)

        if value is None:
            continue

        if isinstance(value, bool):
            raise ValueError(f"Factor '{key}' must be numeric.")

        numeric_value = float(value)

        if not 0 <= numeric_value <= 100:
            raise ValueError(f"Factor '{key}' must be between 0 and 100.")

        adjusted[key] = max(
            0.0,
            min(100.0, numeric_value + score_change),
        )

    scenario = calculate_score(adjusted, category)

    return {
        "baseline": baseline,
        "scenario": scenario,
        "demand_change": demand_change,
        "cost_change": cost_change,
        "adjusted_factors": adjusted,
        "score_change": (
            round(scenario["total_score"] - baseline["total_score"], 2)
            if baseline["total_score"] is not None
            and scenario["total_score"] is not None
            else None
        ),
    }