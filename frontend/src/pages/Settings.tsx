import { useEffect, useState, type FormEvent } from "react";
import { Database, Trash2 } from "lucide-react";
import { api } from "../services/api";
import type {
  FactorValues,
  MarketFactorInput,
  MarketFactorRecord,
  RetailCategory,
} from "../types";

const categories: RetailCategory[] = ["Grocery", "Fashion", "Electronics"];
const factorFields: { key: keyof FactorValues; label: string }[] = [
  { key: "demand", label: "Demand" },
  { key: "competition_opportunity", label: "Competition opportunity" },
  { key: "accessibility", label: "Accessibility" },
  { key: "cost_viability", label: "Cost viability" },
  { key: "category_fit", label: "Category fit" },
];

const emptyFactors: FactorValues = {
  demand: null,
  competition_opportunity: null,
  accessibility: null,
  cost_viability: null,
  category_fit: null,
};

export default function Settings() {
  const [city, setCity] = useState("");
  const [category, setCategory] = useState<RetailCategory>("Grocery");
  const [factors, setFactors] = useState<FactorValues>(emptyFactors);
  const [source, setSource] = useState("");
  const [sourceStatus, setSourceStatus] =
    useState<MarketFactorInput["source_status"]>("user_provided");
  const [notes, setNotes] = useState("");
  const [records, setRecords] = useState<MarketFactorRecord[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadRecords() {
    setLoading(true);
    try {
      setRecords(await api.getMarketFactors());
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Market factor records could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRecords();
  }, []);

  async function saveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    const payload: MarketFactorInput = {
      city: city.trim(),
      category,
      ...factors,
      source: source.trim() || null,
      source_status: sourceStatus,
      notes: notes.trim() || null,
    };

    try {
      await api.saveMarketFactor(payload);
      setNotice("Market factor record saved.");
      setCity("");
      setFactors(emptyFactors);
      setSource("");
      setNotes("");
      await loadRecords();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Market factor record could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeRecord(record: MarketFactorRecord) {
    setError(null);
    setNotice(null);
    try {
      await api.deleteMarketFactor(record.id);
      setConfirmDeleteId(null);
      setNotice(`${record.city} ${record.category} record deleted.`);
      await loadRecords();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Market factor record could not be deleted."
      );
    }
  }

  const hasFactorValue = Object.values(factors).some((value) => value !== null);

  return (
    <div className="page-content">
      <div className="site-finder-heading">
        <div>
          <span className="eyebrow">DATA MANAGEMENT</span>
          <h1>Market inputs</h1>
          <p>
            Enter sourced factor values for city/category comparisons. Scores
            are calculated only from the values you provide.
          </p>
        </div>
        <Database size={22} />
      </div>

      <form className="panel data-entry-form" onSubmit={saveRecord}>
        <div className="panel-heading">
          <div>
            <span className="eyebrow">MARKET FACTORS</span>
            <h2>Add or update a city record</h2>
            <p className="panel-description">
              Values use a 0–100 scale. Saving the same city and category
              updates its existing record.
            </p>
            <p className="field-help">
              On this scale, 0 is least favorable and 100 is most favorable.
              Leave unavailable factors blank. Values and source-status labels
              are user-provided and are not independently verified.
            </p>
          </div>
        </div>

        <div className="data-entry-grid">
          <label className="form-field">
            City
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              maxLength={120}
              required
            />
          </label>
          <label className="form-field">
            Retail category
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as RetailCategory)
              }
            >
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          {factorFields.map(({ key, label }) => (
            <label className="form-field" key={key}>
              {label} (0–100)
              <input
                type="number"
                min={0}
                max={100}
                step="any"
                value={factors[key] ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  setFactors((current) => ({
                    ...current,
                    [key]: value === "" ? null : Number(value),
                  }));
                }}
              />
            </label>
          ))}
          <label className="form-field">
            Source reference
            <input
              value={source}
              onChange={(event) => setSource(event.target.value)}
              maxLength={500}
              placeholder="URL, report, or dataset name"
            />
          </label>
          <label className="form-field">
            Source status
            <select
              value={sourceStatus}
              onChange={(event) =>
                setSourceStatus(
                  event.target.value as MarketFactorInput["source_status"]
                )
              }
            >
              <option value="user_provided">User provided</option>
              <option value="unverified">Unverified</option>
              <option value="verified">Verified</option>
            </select>
          </label>
          <label className="form-field data-entry-notes">
            Notes
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={500}
            />
          </label>
        </div>
        <div className="form-actions">
          <p className="field-help">
            A “verified” label is your assertion; confirm evidence before
            relying on the analysis.
          </p>
          <button
            className="primary-button"
            type="submit"
            disabled={saving || !city.trim() || !hasFactorValue}
          >
            {saving ? "Saving..." : "Save market record"}
          </button>
        </div>
      </form>

      {error && <p className="error-message" role="alert">{error}</p>}
      {notice && <p className="success-message" role="status">{notice}</p>}

      <section className="panel data-records-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">SAVED DATA</span>
            <h2>Market factor records</h2>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadRecords()}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
        {loading ? (
          <p role="status">Loading records...</p>
        ) : records.length === 0 ? (
          <p role="status">No database market records have been entered.</p>
        ) : (
          <div className="data-record-list">
            {records.map((record) => (
              <article className="data-record-row" key={record.id}>
                <div>
                  <strong>{record.city} · {record.category}</strong>
                  <span>
                    {record.source_status.replaceAll("_", " ")}
                    {record.source ? ` · ${record.source}` : ""}
                  </span>
                  <small>
                    {factorFields
                      .filter(({ key }) => record[key] !== null)
                      .map(({ key, label }) => `${label}: ${record[key]}`)
                      .join(" · ")}
                  </small>
                </div>
                {confirmDeleteId === record.id ? (
                  <div
                    className="delete-confirmation"
                    role="group"
                    aria-label={`Confirm deletion of ${record.city} ${record.category}`}
                  >
                    <span role="status">Delete this record?</span>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="danger-button"
                      type="button"
                      onClick={() => void removeRecord(record)}
                    >
                      Confirm delete
                    </button>
                  </div>
                ) : (
                  <button
                    className="icon-button"
                    type="button"
                    aria-label={`Delete ${record.city} ${record.category} record`}
                    onClick={() => setConfirmDeleteId(record.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}