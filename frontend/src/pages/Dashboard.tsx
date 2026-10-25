import {
  Activity,
  BarChart3,
  Building2,
  CheckCircle2,
  Compass,
  Layers,
  MapPin,
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
  apiStatus: "checking" | "connected" | "unavailable";
  loading?: boolean;
  error?: string | null;
  cityOptions?: string[];
  cityOptionsError?: string | null;
  locationCount?: number | null;
};

export default function Dashboard({
  onCompare,
  apiStatus,
  loading = false,
  error,
  cityOptions = [],
  cityOptionsError,
}: Props) {
  const steps = [
    {
      title: "1. Business & Capital Configuration",
      detail: "Select business category, input investment capital in INR, and specify commercial parameters.",
      time: "Step 1",
      icon: <Building2 size={18} />,
    },
    {
      title: "2. Candidate City Selection",
      detail: "Search and pick target Indian cities across 7,326+ verified GeoNames & Census 2011 registers.",
      time: "Step 2",
      icon: <MapPin size={18} />,
    },
    {
      title: "3. Spatial Intelligence & Feasibility",
      detail: "Evaluate population density, transit connectivity, 12-month financial P&L, and download 20-section PDF.",
      time: "Step 3",
      icon: <BarChart3 size={18} />,
    },
  ];

  return (
    <div className="page-content">
      <section className="welcome-section">
        <div>
          <span className="eyebrow">EXPANSION INTELLIGENCE PLATFORM</span>
          <h1>Find your next growth market.</h1>
          <p>
            Enter your business type, investment budget, and candidate cities to run deep geospatial,
            demographic, and financial feasibility intelligence across India.
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
          title="Geographic Coverage"
          value="7,326+"
          subtitle="Verified Indian cities & towns"
          trend="up"
          icon={<Compass size={19} />}
          accent="blue"
        />
        <ScoreCard
          title="Analytical Factors"
          value="5 Dimensions"
          subtitle="Density, Transit, Demand, Rent, Moats"
          trend="up"
          icon={<Layers size={19} />}
          accent="violet"
        />
        <ScoreCard
          title="Intelligence Engine"
          value={apiStatus === "connected" ? "Active" : "Connecting"}
          subtitle="Census 2011 & GeoNames spatial data"
          trend="up"
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

      <div className="dashboard-lower-grid">
        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">WORKFLOW GUIDE</span>
              <h2>How ExpansionIQ Works</h2>
              <p>Three streamlined stages from input parameters to complete feasibility report.</p>
            </div>
          </div>

          <div className="activity-list">
            {steps.map((item) => (
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
        <strong>Decision support intelligence:</strong> demographic and population indicators are sourced from
        Census 2011 and GeoNames gazetteers. Financial models and retail assumptions provide structured comparative
        benchmarks for commercial site selection.
      </p>
    </div>
  );
}