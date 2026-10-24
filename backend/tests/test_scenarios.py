from app.services.scenario_engine import apply_scenario


def test_demand_and_cost_scenarios_recalculate_scores():
    result = apply_scenario(
        {
            "demand": 50,
            "competition_opportunity": 70,
            "accessibility": 80,
            "cost_viability": 60,
            "category_fit": 90,
        },
        "Grocery",
        demand_change=10,
        cost_change=10,
    )

    assert result["baseline"]["total_score"] == 67.0
    assert result["scenario"]["total_score"] == 68.0
    assert result["adjusted_factors"]["demand"] == 60
    assert result["adjusted_factors"]["cost_viability"] == 50
    assert result["score_change"] == 1.0


def test_missing_factors_remain_unavailable_in_scenario():
    result = apply_scenario(
        {
            "demand": 50,
            "competition_opportunity": None,
            "accessibility": 80,
            "cost_viability": 60,
            "category_fit": 90,
        },
        "Grocery",
        demand_change=10,
    )

    assert result["scenario"]["total_score"] is None
    assert result["adjusted_factors"]["competition_opportunity"] is None