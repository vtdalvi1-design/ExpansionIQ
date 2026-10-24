from app.services.scoring import CATEGORY_WEIGHTS, calculate_score


def test_category_weights_sum_to_one():
    for weights in CATEGORY_WEIGHTS.values():
        assert abs(sum(weights.values()) - 1.0) < 1e-9


def test_complete_factors_produce_score():
    factors = {
        "demand": 80,
        "competition_opportunity": 70,
        "accessibility": 90,
        "cost_viability": 75,
        "category_fit": 85,
    }

    result = calculate_score(factors, "Grocery")

    assert result["score_status"] == "complete"
    assert result["total_score"] == 80.25
    assert result["missing_factors"] == []


def test_missing_factor_does_not_become_zero():
    factors = {
        "demand": 80,
        "competition_opportunity": 70,
        "accessibility": 90,
        "cost_viability": None,
        "category_fit": 85,
    }

    result = calculate_score(factors, "Grocery")

    assert result["total_score"] is None
    assert result["score_status"] == "incomplete"
    assert result["factor_scores"]["cost_viability"] is None
    assert result["missing_factors"] == ["cost_viability"]


def test_invalid_category_and_out_of_range_factor_are_rejected():
    factors = {
        "demand": 80,
        "competition_opportunity": 70,
        "accessibility": 90,
        "cost_viability": 75,
        "category_fit": 85,
    }

    try:
        calculate_score(factors, "Unknown")
    except ValueError as exc:
        assert "Unsupported category" in str(exc)
    else:
        raise AssertionError("Unsupported categories must be rejected.")

    factors["demand"] = 101
    try:
        calculate_score(factors, "Grocery")
    except ValueError as exc:
        assert "between 0 and 100" in str(exc)
    else:
        raise AssertionError("Out-of-range factors must be rejected.")