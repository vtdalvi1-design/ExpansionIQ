import math
from collections.abc import Sequence


def normalize_values(
    values: Sequence[float | int | None],
    *,
    higher_is_better: bool = True,
) -> list[float | None]:
    present_values: list[float] = []

    for value in values:
        if value is None:
            continue
        if isinstance(value, bool):
            raise ValueError("Values must be finite numbers or None.")

        try:
            numeric_value = float(value)
        except (TypeError, ValueError) as exc:
            raise ValueError("Values must be finite numbers or None.") from exc

        if not math.isfinite(numeric_value):
            raise ValueError("Values must be finite numbers or None.")
        present_values.append(numeric_value)

    if not present_values:
        return [None for _ in values]

    minimum = min(present_values)
    maximum = max(present_values)
    if minimum == maximum:
        return [None if value is None else 50.0 for value in values]

    normalized: list[float | None] = []
    for value in values:
        if value is None:
            normalized.append(None)
            continue

        score = (float(value) - minimum) / (maximum - minimum) * 100
        normalized.append(round(score if higher_is_better else 100 - score, 2))

    return normalized