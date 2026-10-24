import {
AlertTriangle,
Activity,
ArrowRight,
BarChart3,
Building2,
MapPinned,
Store,
} from "lucide-react";
import CityComparisonForm, {
type CityComparisonInput,
} from "../components/CityComparisonForm";
import DataSources from "../components/DataSources";
import CensusPopulationPanel from "../components/CensusPopulationPanel";
import ScoreCard from "../components/ScoreCard";

type Props = {
onCompare: (input: CityComparisonInput) => void;
onOpenAreaFinder?: () => void;
onOpenMarketInputs?: () => void;
apiStatus: "checking" | "connected" | "unavailable";
loading?: boolean;
error?: string | null;
cityOptions?: string[];
cityOptionsError?: string | null;
locationCount?: number | null;
};

export default function Dashboard({
onCompare,
onOpenAreaFinder,
onOpenMarketInputs,
apiStatus,
loading = false,
error,
cityOptions = [],
cityOptionsError,
locationCount = null,
}: Props) {
const recentActivity = [
{
title: "Market comparison workspace",
detail:
  cityOptionsError
    ? "Market inputs could not be checked"
    : cityOptions.length === 0
  ? "Run a clearly labeled demo while verified market inputs are unavailable"
      : `${cityOptions.length} cities have saved inputs; review completeness before comparing`,
time: cityOptionsError ? "Unavailable" : cityOptions.length === 0 ? "Inputs needed" : "Review inputs",
icon: <BarChart3 size={18} />,
},
{
title: "Area-level site finder",
detail:
  locationCount === null
    ? "Location records could not be loaded"
    : locationCount === 0
      ? "No candidate locations are saved yet"
      : `${locationCount} candidate locations are available`,
time: locationCount === null ? "Unavailable" : locationCount > 0 ? "Available" : "Data pending",
icon: <MapPinned size={18} />,
},
{
title: "Data quality review",
detail: cityOptionsError
  ? "Market factor records could not be loaded"
  : cityOptions.length === 0
    ? "Verified market factors are absent; demo estimates are synthetic"
    : `${cityOptions.length} cities have saved factor records`,
time: cityOptionsError ? "Unavailable" : "Review inputs",
icon: <Activity size={18} />,
},
];

return (
<div className="page-content">
<section className="welcome-section">
<div>
<span className="eyebrow">EXPANSION INTELLIGENCE PLATFORM</span>
<h1>Find your next growth market.</h1>
<p>
Enter a business type, investment budget, and candidate cities. Review a
transparent demo analysis and distinguish simulated assumptions from
verified records.
</p>
</div>
<div className="welcome-illustration" aria-hidden="true">
<div className="illustration-orbit orbit-one" />
<div className="illustration-orbit orbit-two" />
<div className="illustration-building">
<Building2 size={48} />
</div>
<div className="illustration-store">
<Store size={24} />
</div>
</div>
</section>

  <div className="metrics-grid">
    <ScoreCard
    title="Cities with saved inputs"
    value={cityOptions.length.toString()}
    subtitle={cityOptionsError ? "Market input status unavailable" : "Inputs may be partial or unverified"}
      trend="neutral"
      icon={<BarChart3 size={19} />}
      accent="blue"
    />
    <ScoreCard
      title="Expansion workflow"
      value={locationCount === null ? "—" : locationCount.toString()}
      subtitle="Candidate location records"
      trend="neutral"
      icon={<MapPinned size={19} />}
      accent="violet"
    />
    <ScoreCard
      title="Demo analysis"
      value="Labeled"
      subtitle="Synthetic values are disclosed"
      trend="neutral"
      icon={<Activity size={19} />}
      accent="teal"
    />
  </div>

  {cityOptions.length === 0 && (
    <section
      className={`market-readiness-card ${
        apiStatus === "connected" && !cityOptionsError
          ? "market-readiness-missing"
          : "market-readiness-unavailable"
      }`}
      aria-live="polite"
    >
      <span className="market-readiness-icon">
        <AlertTriangle size={20} />
      </span>
      <div className="market-readiness-content">
        <span className="eyebrow">RANKING READINESS</span>
        <h2>
          {apiStatus === "checking"
            ? "Checking market inputs"
            : apiStatus === "unavailable" || cityOptionsError
              ? "Market input availability could not be confirmed"
              : "Verified market rankings are unavailable"}
        </h2>
        <p>
          {apiStatus === "checking"
            ? "Connecting to the backend to check for saved market-factor records."
            : apiStatus === "unavailable" || cityOptionsError
              ? "The backend market-input endpoint is unavailable. Rankings remain unavailable until the saved records can be checked."
              : "No verified city market-factor records are saved. Demo analyses can still illustrate the workflow using synthetic values, clearly labeled as not real market evidence. Historical Census population is context only."}
        </p>
        {apiStatus === "connected" &&
          !cityOptionsError &&
          cityOptions.length === 0 && (
            <>
              <p>
                For real-world decisions, category-specific comparisons need
                sourced demand, competition, accessibility, cost, and category
                fit inputs. Demo estimates are not independently researched
                and should not be treated as recommendations.
              </p>
              <button
                className="secondary-button"
                type="button"
                onClick={onOpenMarketInputs}
              >
                Review market input requirements
                <ArrowRight size={15} />
              </button>
            </>
          )}
      </div>
    </section>
  )}

  <CityComparisonForm
    onSubmit={onCompare}
    loading={loading}
    cityOptions={cityOptions}
    cityOptionsError={cityOptionsError}
  />
  {error && (
    <p className="error-message" role="alert">
      {error}
    </p>
  )}

  <CensusPopulationPanel />

  <section className="quick-actions-grid">
    <button
      type="button"
      className="quick-action-card"
      onClick={onOpenAreaFinder}
    >
      <span className="quick-action-icon purple">
        <MapPinned size={22} />
      </span>
      <span className="quick-action-copy">
        <strong>Explore candidate locations</strong>
        <span>Browse saved points and their straight-line proximity.</span>
      </span>
      <ArrowRight size={19} />
    </button>
  </section>

  <div className="dashboard-lower-grid">
    <section className="panel activity-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">WORKSPACE OVERVIEW</span>
          <h2>Next steps</h2>
          <p>Suggested actions to get started.</p>
        </div>
      </div>

      <div className="activity-list">
        {recentActivity.map((item) => (
          <div className="activity-row" key={item.title}>
            <span className="activity-icon">{item.icon}</span>
            <div className="activity-copy">
              <strong>{item.title}</strong>
              <span>{item.detail}</span>
            </div>
            <span className="activity-time">{item.time}</span>
          </div>
        ))}
      </div>
    </section>

    <DataSources />
  </div>

  <p className="dashboard-disclaimer">
    <strong>Decision support, not a guarantee:</strong> recommendations are
    only as reliable as the underlying market evidence. User-provided source
    labels are not independently verified.
  </p>
</div>

);
}