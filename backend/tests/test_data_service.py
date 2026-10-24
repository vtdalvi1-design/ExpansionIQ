import pytest

from app.services.data_service import get_cities_for_category, load_city_data


def test_project_dataset_has_header_but_no_fabricated_market_rows():
    assert load_city_data() == []
    assert get_cities_for_category("Grocery") == []


def test_missing_dataset_is_reported(tmp_path):
    with pytest.raises(FileNotFoundError, match="City data CSV not found"):
        load_city_data(tmp_path / "missing.csv")


def test_duplicate_city_category_rows_are_rejected(tmp_path):
    data_file = tmp_path / "city_factors.csv"
    data_file.write_text(
        "city,category,demand,competition_opportunity,accessibility,"
        "cost_viability,category_fit\n"
        "Pune,Grocery,50,50,50,50,50\n"
        "pune,grocery,60,60,60,60,60\n",
        encoding="utf-8",
    )

    with pytest.raises(ValueError, match="duplicate data"):
        load_city_data(data_file)


def test_incomplete_data_rows_are_rejected(tmp_path):
    data_file = tmp_path / "city_factors.csv"
    data_file.write_text(
        "city,category,demand,competition_opportunity,accessibility,"
        "cost_viability,category_fit\n"
        ",Grocery,50,50,50,50,50\n",
        encoding="utf-8",
    )

    with pytest.raises(ValueError, match="must include a city and category"):
        load_city_data(data_file)


def test_optional_csv_provenance_fields_are_preserved(tmp_path):
    data_file = tmp_path / "city_factors.csv"
    data_file.write_text(
        "city,category,demand,competition_opportunity,accessibility,"
        "cost_viability,category_fit,source,source_status,notes\n"
        "Pune,Grocery,50,50,50,50,50,Market study,verified,Checked 2025\n",
        encoding="utf-8",
    )

    row = load_city_data(data_file)[0]
    assert row["source"] == "Market study"
    assert row["source_status"] == "verified"
    assert row["notes"] == "Checked 2025"
