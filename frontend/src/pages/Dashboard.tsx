import {
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
loading?: boolean;
error?: string | null;
cityOptions?: string[];
cityOptionsError?: string | null;
locationCount?: number | null;
competitorCount?: number | null;
};

export default function Dashboard({
onCompare,
onOpenAreaFinder,
loading = false,
error,
cityOptions = [],
cityOptionsError,
locationCount = null,
competitorCount = null,
}: Props) {
const recentActivity = [
{
title: "Market comparison workspace",
detail: "Ready for a new city comparison",
time: "Available now",
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
    ? "Market factor records have not been supplied"
    : `${cityOptions.length} cities appear in configured sources`,
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
Compare markets, explore saved candidate locations, and understand
what supports each retail expansion decision.
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
    title="Cities with data"
    value={cityOptions.length.toString()}
    subtitle={cityOptionsError ? "Market input status unavailable" : "From configured factor sources"}
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
      title="Evidence-first scoring"
      value="Transparent"
      subtitle="Missing factors stay unavailable"
      trend="neutral"
      icon={<Activity size={19} />}
      accent="teal"
    />
  </div>

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

    <DataSources
      sources={[
        {
          name: "City market factors",
          description: cityOptionsError
            ? "Factor records could not be loaded"
            : `${cityOptions.length} cities in configured sources`,
          status: cityOptionsError
            ? "pending"
            : cityOptions.length > 0
              ? "available"
              : "pending",
        },
        {
          name: "Candidate locations",
          description:
            locationCount === null
              ? "Location records could not be loaded"
              : `${locationCount} saved candidate locations`,
          status:
            locationCount === null
              ? "pending"
              : locationCount > 0
                ? "available"
                : "pending",
        },
        {
          name: "Competitor and neighborhood datasets",
          description:
            competitorCount === null
              ? "Competitor records could not be loaded"
              : `${competitorCount} competitor records; neighborhood boundaries are not included`,
          status:
            competitorCount === null || competitorCount === 0
              ? "pending"
              : "available",
        },
      ]}
    />
  </div>

  <p className="dashboard-disclaimer">
    <strong>Decision support, not a guarantee:</strong> recommendations are
    only as reliable as the underlying market evidence. User-provided source
    labels are not independently verified.
  </p>
</div>

);
}