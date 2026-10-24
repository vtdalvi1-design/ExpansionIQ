from app.services.normalization import normalize_values


def test_higher_is_better():
    result = normalize_values([10, 20, 30], higher_is_better=True)

    assert result == [0.0, 50.0, 100.0]


def test_lower_is_better():
    result = normalize_values([10, 20, 30], higher_is_better=False)

    assert result == [100.0, 50.0, 0.0]


def test_constant_values_normalize_to_fifty():
    result = normalize_values([5, 5, 5], higher_is_better=True)

    assert result == [50.0, 50.0, 50.0]


def test_missing_values_remain_missing():
    assert normalize_values([10, None, 30]) == [0.0, None, 100.0]


def test_non_finite_values_are_rejected():
    try:
        normalize_values([1, float("nan")])
    except ValueError:
        pass
    else:
        raise AssertionError("Non-finite values must be rejected.")