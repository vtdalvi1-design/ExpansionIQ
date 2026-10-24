import { ArrowLeft, Download, FileSearch } from "lucide-react";
import type {
  ComparisonResult,
  ScenarioResult,
  ScenarioSettings,
} from "../types";
import ComparisonTable from "../components/ComparisonTable";
import FactorChart from "../components/FactorChart";
import ScenarioPanel from "../components/ScenarioPanel";

type Props = {
  comparison: ComparisonResult | null;
  onBack: () => void;
  onExport: () => void;
  exportLoading: boolean;
  exportError: string | null;
  onApplyScenario: (cityName: string, settings: ScenarioSettings) => void;
  scenarioCityName: string;
  onScenarioCityChange: (cityName: string) => void;
  scenario: ScenarioResult | null;
  scenarioLoading: boolean;
  scenarioError: string | null;
};

export default function Results({
  comparison,
  onBack,
  onExport,
  exportLoading,
  exportError,
  onApplyScenario,
  scenarioCityName,
  onScenarioCityChange,
  scenario,
  scenarioLoading,
  scenarioError,
}: Props) {
  const results = comparison?.results ?? [];

  return (
    <div className="page-content">
      <div className="results-title-row">
        <div>
          <button className="back-button" type="button" onClick={onBack}>
            <ArrowLeft size={16} /> Back to workspace
          </button>
          <span className="eyebrow">ANALYSIS RESULTS</span>
          <h1>Market comparison</h1>
          <p>Review candidate markets and the evidence available for each.</p>
        </div>
        <button
          className="secondary-button"
          type="button"
          onClick={onExport}
          disabled={!comparison || exportLoading}
        >
          <Download size={16} />
          {exportLoading ? "Preparing CSV..." : "Export CSV"}
        </button>
      </div>
      {exportError && (
        <p className="error-message" role="alert">
          {exportError}
        </p>
      )}

      {!comparison ? (
        <section className="panel empty-results">
          <FileSearch size={35} />
          <h2>No comparison has been submitted</h2>
          <p>Return to the workspace and enter candidate cities.</p>
          <button className="primary-button" type="button" onClick={onBack}>
            Return to workspace
          </button>
        </section>
      ) : (
        <>
          <section className="results-notice" role="status">
            <FileSearch size={20} />
            <div>
              <strong>
                {comparison.data_status === "available"
                  ? "Scores calculated from available factor data"
                  : "Complete market data is not available"}
              </strong>
              <p>
                Category: {comparison.category}.{" "}
                {comparison.data_status === "available"
                  ? "Review each score's source status and missing factors before using it in a decision."
                  : "Candidate names are shown, but unavailable factor values are not replaced with estimates or zeroes."}
              </p>
            </div>
          </section>

          <ComparisonTable results={results} />

          <div className="dashboard-lower-grid">
            <FactorChart results={results} />
            <ScenarioPanel
              onApply={onApplyScenario}
              loading={scenarioLoading}
              result={scenario}
              error={scenarioError}
              cities={results.map((city) => city.city_name)}
              cityName={scenarioCityName}
              onCityChange={onScenarioCityChange}
            />
          </div>
        </>
      )}
    </div>
  );
}
