import { useEffect, useState, type FormEvent } from "react";
import { ExternalLink, Search } from "lucide-react";
import { api } from "../services/api";
import type { CensusPopulationResponse } from "../types";

const PAGE_SIZE = 20;
const numberFormat = new Intl.NumberFormat("en-IN");

export default function CensusPopulationPanel() {
  const [data, setData] = useState<CensusPopulationResponse | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [censusLevel, setCensusLevel] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .getCensusPopulation({
        search,
        state_code: stateCode || undefined,
        census_level:
          censusLevel && censusLevel !== "unreported"
            ? Number(censusLevel)
            : undefined,
        level_unreported: censusLevel === "unreported",
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      })
      .then((response) => {
        if (!active) return;
        setData(response);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Census population records could not be loaded."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [search, stateCode, censusLevel, page, reloadKey]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    setSearch(searchInput.trim());
  }

  function updateState(value: string) {
    setPage(0);
    setStateCode(value);
  }

  function updateLevel(value: string) {
    setPage(0);
    setCensusLevel(value);
  }

  const pageCount = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <section className="panel census-population-panel" aria-labelledby="census-population-title">
      <div className="panel-heading census-heading">
        <div>
          <span className="eyebrow">HISTORICAL OFFICIAL SOURCE</span>
          <h2 id="census-population-title">Urban population, Census 2011</h2>
          <p>
            Population totals from the official 2011 Primary Census Abstract
            workbook, with place names and Census levels preserved as published.
          </p>
        </div>
        {data && (
          <div className="census-record-count">
            {numberFormat.format(data.total)} matching records
          </div>
        )}
      </div>

      <div className="census-source-summary">
        <span>Reference year: {data?.reference_year ?? 2011}</span>
        <span>{data ? `${data.state_codes.length} state codes represented` : "Coverage loading"}</span>
        <a href={data?.source_url ?? "https://censusindia.gov.in/nada/index.php/catalog/45261"} target="_blank" rel="noreferrer">
          Census catalog <ExternalLink size={13} />
        </a>
      </div>

      <form className="census-filter-bar" onSubmit={submitSearch}>
        <label className="location-filter">
          Search place
          <span className="search-input-wrap">
            <Search size={15} aria-hidden="true" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search Census place names"
              aria-label="Search Census place names"
            />
          </span>
        </label>
        <label className="location-filter">
          State code
          <select
            value={stateCode}
            onChange={(event) => updateState(event.target.value)}
            aria-label="Filter by Census state code"
          >
            <option value="">All state codes</option>
            {(data?.state_codes ?? []).map((code) => (
              <option value={code} key={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
        <label className="location-filter">
          Census level
          <select
            value={censusLevel}
            onChange={(event) => updateLevel(event.target.value)}
            aria-label="Filter by Census level"
          >
            <option value="">All levels</option>
            <option value="0">Level 0</option>
            <option value="1">Level 1</option>
            <option value="2">Level 2</option>
            <option value="3">Level 3</option>
            <option value="unreported">Level not reported</option>
          </select>
        </label>
        <button className="primary-button census-search-button" type="submit">
          Search
        </button>
      </form>

      {error && (
        <div className="error-message census-error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Retry
          </button>
        </div>
      )}

      {loading && (
        <p className="census-message" role="status">
          Loading Census population records…
        </p>
      )}

      {!loading && !error && data?.data_status === "unavailable" && (
        <p className="census-message">
          Census data has not been imported into the configured database.
        </p>
      )}

      {!loading && !error && data?.data_status === "available" && data.indicators.length === 0 && (
        <p className="census-message">No records match these filters.</p>
      )}

      {!loading && !error && data && data.indicators.length > 0 && (
        <>
          <div className="census-table-scroll">
            <table className="census-table">
              <thead>
                <tr>
                  <th scope="col">Place name (as published)</th>
                  <th scope="col">State code</th>
                  <th scope="col">Census level</th>
                  <th scope="col">Population total (2011)</th>
                </tr>
              </thead>
              <tbody>
                {data.indicators.map((record) => (
                  <tr key={record.id}>
                    <td>{record.geography_name}</td>
                    <td>{record.state_code}</td>
                    <td>
                      {record.census_level === null
                        ? "Not reported"
                        : `Level ${record.census_level}`}
                    </td>
                    <td className="census-population-value">
                      {record.value === null
                        ? "Not reported"
                        : `${numberFormat.format(record.value)} people`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="census-pagination">
            <span>
              Showing {page * PAGE_SIZE + 1}–
              {page * PAGE_SIZE + data.indicators.length} of{" "}
              {numberFormat.format(data.total)}
            </span>
            <div>
              <button
                type="button"
                className="secondary-button"
                disabled={page === 0 || loading}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={page + 1 >= pageCount || loading}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      <div className="census-disclosure">
        <p>
          Source: {data?.source_name ?? "Office of the Registrar General & Census Commissioner, India"}.
          The catalog does not state a reuse license; confirm applicable terms
          before redistribution or commercial reuse.
        </p>
        <p>
          These are historical 2011 counts, not current estimates. Census rows
          do not include verified coordinates or neighborhood boundaries and
          are not shown on the map or used as retail scores.
        </p>
        <a href={data?.download_url ?? "https://censusindia.gov.in/nada/index.php/catalog/45261/download/48987/PCA11-UA-0000.xlsx"} target="_blank" rel="noreferrer">
          Download original workbook <ExternalLink size={13} />
        </a>
      </div>
    </section>
  );
}
