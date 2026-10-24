from app.services.validation import validate_category, validate_factor_value


def test_valid_categories():
    assert validate_category("Grocery")
    assert validate_category("Fashion")
    assert validate_category("Electronics")
    assert validate_category("grocery")


def test_invalid_category_is_rejected():
    assert not validate_category("Unknown")


def test_factor_values_must_be_numeric_and_in_range():
    assert validate_factor_value(75)
    assert not validate_factor_value(-1)
    assert not validate_factor_value(101)
    assert not validate_factor_value("unknown")