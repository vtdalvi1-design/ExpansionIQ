import { useEffect, useState } from "react";
import {
  Database,
  ExternalLink,
  Info,
  ShieldCheck,
} from "lucide-react";
import { api } from "../services/api";
import type { DatasetRegistryRecord } from "../types";

function formatStatus(status: string): string {
  return status.replaceAll("_", " ");
}

function formatCoverage(coverage: Record<string, unknown>): string {
  return Object.entries(coverage)
    .map(([key, value]) => {
      const formattedValue =
        value === null || value === undefined
          ? "not specified"
          : typeof value === "object"
            ? JSON.stringify(value)
            : String(value);
      return `${key.replaceAll("_", " ")}: ${formattedValue}`;
    })
    .join(" · ");
}

export default function DataSources() {
  const [datasets, setDatasets] = useState<DatasetRegistryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDatasets() {
    setLoading(true);
    try {
      const response = await api.getDatasets();
      setDatasets(response.datasets);
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Dataset registry could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDatasets();
  }, []);

  return (
    <section className="panel data-sources-panel" aria-busy={loading}>
      <div className="panel-heading">
        <div>
          <div className="eyebrow">TRUST & TRANSPARENCY</div>
          <h2>Dataset registry</h2>
        </div>
        <div className="dataset-registry-actions">
          <ShieldCheck size={20} className="heading-icon" />
          <button
            className="secondary-button"
            type="button"
            onClick={() => void loadDatasets()}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>

      <p className="panel-description">
        Source, coverage, reference period, licensing, and import status from
        the backend registry.
      </p>

      {error && (
        <div className="error-message" role="alert">
          <p>{error}</p>
          <button
            className="secondary-button"
            type="button"
            onClick={() => void loadDatasets()}
            disabled={loading}
          >
            Retry
          </button>
        </div>
      )}
      {loading ? (
        <p className="census-message" role="status">
          Loading dataset registry…
        </p>
      ) : !error && datasets.length === 0 ? (
        <p className="census-message" role="status">
          No dataset metadata is registered yet.
        </p>
      ) : (
        <div className="dataset-registry-list">
          {datasets.map((dataset) => (
            <article className="dataset-registry-item" key={dataset.dataset_key}>
              <div className="dataset-registry-heading">
                <span className="source-icon">
                  <Database size={17} />
                </span>
                <div className="source-copy">
                  <strong>{dataset.title}</strong>
                  <span>{dataset.source_name}</span>
                </div>
                <span className="source-status source-pending">
                  <Info size={13} />
                  Import stage: {formatStatus(dataset.import_status)}
                </span>
              </div>
              <dl className="dataset-registry-metadata">
                <div>
                  <dt>Registry entry</dt>
                  <dd>Registered</dd>
                </div>
                <div>
                  <dt>Local source file</dt>
                  <dd>
                    {dataset.downloaded_file_available
                      ? "Available in project data"
                      : "Not available locally"}
                  </dd>
                </div>
                <div>
                  <dt>Imported to database</dt>
                  <dd>
                    {dataset.imported_record_count > 0
                      ? `${dataset.imported_record_count.toLocaleString("en-IN")} records`
                      : "No records imported"}
                  </dd>
                </div>
                <div>
                  <dt>Independent verification</dt>
                  <dd>Not established</dd>
                </div>
                <div>
                  <dt>Geography</dt>
                  <dd>{dataset.geographic_level}</dd>
                </div>
                <div>
                  <dt>Coverage</dt>
                  <dd>{formatCoverage(dataset.coverage) || "Not described"}</dd>
                </div>
                <div>
                  <dt>Reference period</dt>
                  <dd>{dataset.reference_period ?? "Not specified"}</dd>
                </div>
                <div>
                  <dt>License status</dt>
                  <dd>{dataset.license_status}</dd>
                </div>
                <div>
                  <dt>Parsed source records</dt>
                  <dd>
                    {dataset.parsed_record_count === null
                      ? "Not reported"
                      : dataset.parsed_record_count.toLocaleString("en-IN")}
                  </dd>
                </div>
                <div>
                  <dt>Indicators and units</dt>
                  <dd>
                    {dataset.indicators.join(", ") || "Not specified"}
                    {dataset.units.length > 0
                      ? ` · ${dataset.units.join(", ")}`
                      : ""}
                  </dd>
                </div>
                <div>
                  <dt>Attribution</dt>
                  <dd>{dataset.attribution ?? "Not specified"}</dd>
                </div>
              </dl>
              <p className="dataset-registry-quality">
                {dataset.blocked_reason
                  ? `${dataset.blocked_reason} ${dataset.quality_notes}`
                  : dataset.quality_notes}
              </p>
              <div className="dataset-registry-links">
                <a href={dataset.source_url} target="_blank" rel="noreferrer">
                  Source <ExternalLink size={12} />
                </a>
                {dataset.license_url && (
                  <a href={dataset.license_url} target="_blank" rel="noreferrer">
                    License details <ExternalLink size={12} />
                  </a>
                )}
                {dataset.download_url && (
                  <a href={dataset.download_url} target="_blank" rel="noreferrer">
                    Download <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="source-note">
        “Registered” describes a catalog entry; local file availability and
        imported counts are reported separately. Registry presence does not
        establish data quality, currentness, independent verification, or
        permission to redistribute.
      </p>
    </section>
  );
}