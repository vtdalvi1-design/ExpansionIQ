import math

from app.services.scoring import CATEGORY_WEIGHTS


def validate_category(category: str) -> bool:
    return isinstance(category, str) and category.casefold() in {
        supported.casefold() for supported in CATEGORY_WEIGHTS
    }


def validate_factor_value(value: object) -> bool:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return False

    return math.isfinite(value) and 0 <= value <= 100