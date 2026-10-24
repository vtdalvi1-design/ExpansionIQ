import { useState, type FormEvent } from "react";
import { ArrowRight, Plus, X } from "lucide-react";
import type { RetailCategory } from "../types";

export type CityComparisonInput = {
  cities: string[];
  category: RetailCategory;
};

type Props = {
  onSubmit: (payload: CityComparisonInput) => void;
  loading?: boolean;
  cityOptions?: string[];
  cityOptionsError?: string | null;
};

export default function CityComparisonForm({
  onSubmit,
  loading = false,
  cityOptions = [],
  cityOptionsError,
}: Props) {
  const [category, setCategory] = useState<RetailCategory>("Grocery");
  const [cities, setCities] = useState<string[]>(["", ""]);

  function updateCity(index: number, value: string) {
    setCities((current) =>
      current.map((city, cityIndex) =>
        cityIndex === index ? value : city,
      ),
    );
  }

  function addCity() {
    if (cities.length < 5) {
      setCities((current) => [...current, ""]);
    }
  }

  function removeCity(index: number) {
    setCities((current) => current.filter((_, i) => i !== index));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedCities = cities.map((city) => city.trim());
    const uniqueCities = new Set(
      normalizedCities.map((city) => city.toLocaleLowerCase())
    );
    if (
      normalizedCities.some((city) => !city) ||
      uniqueCities.size !== normalizedCities.length
    ) {
      return;
    }
    onSubmit({ cities: normalizedCities, category });
  }

  const citiesValid =
    cities.every((city) => city.trim()) &&
    new Set(cities.map((city) => city.trim().toLocaleLowerCase())).size ===
      cities.length;

  return (
    <form className="panel comparison-form" onSubmit={handleSubmit}>
      <div className="panel-heading">
        <div>
          <span className="eyebrow">MARKET EXPLORER</span>
          <h2>Compare retail markets</h2>
          <p className="panel-description">
            Select a retail category and enter candidate cities. Available
            dataset cities appear as suggestions.
          </p>
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="comparison-category">Retail category</label>
        <select
          id="comparison-category"
          value={category}
          onChange={(event) =>
            setCategory(event.target.value as RetailCategory)
          }
        >
          <option>Grocery</option>
          <option>Fashion</option>
          <option>Electronics</option>
        </select>
      </div>

      <div className="form-field">
        <div className="field-label-row">
          <label>Cities to compare</label>
          <span className="muted-label">{cities.length} selected</span>
        </div>

        <div className="city-selection-list">
          {cities.map((city, index) => (
            <div className="city-selection-row" key={`${index}-${city}`}>
              <span className="city-selection-index">
                {String(index + 1).padStart(2, "0")}
              </span>

              <input
                aria-label={`City ${index + 1}`}
                type="text"
                list="available-city-options"
                value={city}
                onChange={(event) => updateCity(index, event.target.value)}
                placeholder="Enter a city name"
                required
                maxLength={120}
              />
              {index === 0 && (
                <datalist id="available-city-options">
                  {cityOptions.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              )}

              {cities.length > 2 && (
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Remove ${city}`}
                  onClick={() => removeCity(index)}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        {cityOptionsError ? (
          <p className="field-help error-text" role="status">
            City suggestions could not be loaded. You can still enter candidate
            city names manually.
          </p>
        ) : cityOptions.length === 0 ? (
          <p className="field-help">
            No cities are currently listed in the market dataset. Entering a
            name without matching data will return unavailable scores.
          </p>
        ) : null}
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={addCity}
          disabled={cities.length >= 5}
        >
          <Plus size={16} /> Add city
        </button>

        <button
          type="submit"
          className="primary-button"
          disabled={loading || !citiesValid}
        >
          {loading ? "Analyzing..." : "Compare markets"}
          <ArrowRight size={17} />
        </button>
      </div>
    </form>
  );
}