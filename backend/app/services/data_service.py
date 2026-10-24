import csv
from pathlib import Path
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import MarketFactor
from app.services.validation import validate_category

DATA_FILE = Path(__file__).resolve().parents[3] / "data" / "city_factors.csv"

REQUIRED_COLUMNS = {
    "city",
    "category",
    "demand",
    "competition_opportunity",
    "accessibility",
    "cost_viability",
    "category_fit",
}


def load_city_data(
    file_path: Path | None = None,
) -> list[dict[str, Any]]:
    path = file_path or DATA_FILE

    if not path.is_file():
        raise FileNotFoundError(f"City data CSV not found: {path}")

    with path.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)

        if not reader.fieldnames:
            raise ValueError("The city data CSV has no header row.")

        missing = REQUIRED_COLUMNS - set(reader.fieldnames)

        if missing:
            raise ValueError(
                "City data CSV is missing columns: "
                + ", ".join(sorted(missing))
            )

        rows: list[dict[str, Any]] = []

        seen_records: set[tuple[str, str]] = set()

        for row_number, row in enumerate(reader, start=2):
            city = (row.get("city") or "").strip()
            category = (row.get("category") or "").strip()

            if not city or not category:
                raise ValueError(
                    f"City data CSV row {row_number} must include a city and category."
                )
            if not validate_category(category):
                raise ValueError(
                    f"City data CSV row {row_number} has unsupported category "
                    f"'{category}'."
                )

            record_key = (city.casefold(), category.casefold())
            if record_key in seen_records:
                raise ValueError(
                    f"City data CSV contains duplicate data for {city} "
                    f"and {category}."
                )
            seen_records.add(record_key)

            parsed: dict[str, Any] = {
                "city": city,
                "category": category,
                "source": (row.get("source") or "").strip() or None,
                "source_status": (
                    (row.get("source_status") or "").strip() or "unverified"
                ),
                "notes": (row.get("notes") or "").strip() or None,
            }

            for factor in REQUIRED_COLUMNS - {"city", "category"}:
                raw = row.get(factor)

                if raw is None or not raw.strip():
                    parsed[factor] = None
                    continue

                try:
                    value = float(raw)
                except ValueError as exc:
                    raise ValueError(
                        f"Invalid numeric value for {city}: {factor}."
                    ) from exc

                if not 0 <= value <= 100:
                    raise ValueError(
                        f"{city}: {factor} must be between 0 and 100."
                    )

                parsed[factor] = value

            rows.append(parsed)

        return rows


def get_cities_for_category(
    category: str,
    file_path: Path | None = None,
    db: Session | None = None,
) -> list[dict[str, Any]]:
    rows = {
        row["city"].casefold(): row
        for row in load_city_data(file_path)
        if row["category"].casefold() == category.casefold()
    }

    if db is not None:
        factors = (
            db.query(MarketFactor)
            .filter(func.lower(MarketFactor.category) == category.casefold())
            .all()
        )
        for factor in factors:
            rows[factor.city.name.casefold()] = {
                "city": factor.city.name,
                "category": factor.category,
                "demand": factor.demand,
                "competition_opportunity": factor.competition_opportunity,
                "accessibility": factor.accessibility,
                "cost_viability": factor.cost_viability,
                "category_fit": factor.category_fit,
                "source": factor.source,
                "source_status": factor.source_status or "unverified",
                "notes": factor.notes,
            }

    return list(rows.values())