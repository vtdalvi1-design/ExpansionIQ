import { RotateCcw, SlidersHorizontal, Sparkles } from "lucide-react";
import { useState } from "react";
import type { ScenarioResult, ScenarioSettings } from "../types";

type Props = {
onApply?: (cityName: string, assumptions: ScenarioSettings) => void;
canAnalyze?: boolean;
loading?: boolean;
result?: ScenarioResult | null;
error?: string | null;
cityName?: string;
cities?: string[];
onCityChange?: (cityName: string) => void;
};

export default function ScenarioPanel({
onApply,
canAnalyze = true,
loading = false,
result,
error,
cityName,
cities = [],
onCityChange,
}: Props) {
const [demandChange, setDemandChange] = useState(0);
const [costChange, setCostChange] = useState(0);

function reset() {
setDemandChange(0);
setCostChange(0);
if (canAnalyze) {
  onApply?.(cityName ?? "", { demand_change: 0, cost_change: 0 });
}
}

function applyScenario() {
if (!canAnalyze) return;
onApply?.(cityName ?? "", {
  demand_change: demandChange,
  cost_change: costChange,
});
}

return (
<section className="panel scenario-panel">
<div className="panel-heading">
<div>
<span className="eyebrow">WHAT-IF ANALYSIS</span>
<h2>Test your assumptions</h2>
<p>
  Explore how changed demand and cost assumptions affect the selected city.
</p>
</div>
<span className="panel-heading-icon">
<SlidersHorizontal size={20} />
</span>
</div>

  {!canAnalyze && (
    <p className="field-help" role="status">
      Scenario analysis is unavailable because this city has no complete
      baseline score with a source and verified status. Source-status labels
      are user-provided and are not independently validated.
    </p>
  )}

  {cities.length > 1 && (
    <div className="scenario-city-control">
      <label htmlFor="scenario-city">City to model</label>
      <select
        id="scenario-city"
        value={cityName ?? ""}
        onChange={(event) => onCityChange?.(event.target.value)}
      >
        {cities.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>
    </div>
  )}

  <div className="scenario-control">
    <div className="scenario-label">
      <label htmlFor="demand-change">Demand assumption</label>
      <strong className={demandChange > 0 ? "positive-value" : demandChange < 0 ? "negative-value" : ""}>
        {demandChange > 0 ? "+" : ""}
        {demandChange}%
      </strong>
    </div>
    <input
      id="demand-change"
      type="range"
      disabled={!canAnalyze || loading}
      min={-30}
      max={30}
      step={5}
      value={demandChange}
      onChange={(event) => setDemandChange(Number(event.target.value))}
    />
    <div className="range-labels">
      <span>Lower demand</span>
      <span>Higher demand</span>
    </div>
  </div>

  <div className="scenario-control">
    <div className="scenario-label">
      <label htmlFor="cost-change">Operating cost assumption</label>
      <strong className={costChange > 0 ? "negative-value" : costChange < 0 ? "positive-value" : ""}>
        {costChange > 0 ? "+" : ""}
        {costChange}%
      </strong>
    </div>
    <input
      id="cost-change"
      type="range"
      disabled={!canAnalyze || loading}
      min={-30}
      max={30}
      step={5}
      value={costChange}
      onChange={(event) => setCostChange(Number(event.target.value))}
    />
    <div className="range-labels">
      <span>Lower costs</span>
      <span>Higher costs</span>
    </div>
  </div>

  <div className="scenario-insight">
    <Sparkles size={18} />
    <p>
      {demandChange === 0 && costChange === 0
        ? "Your assumptions are unchanged. Adjust the sliders to explore a hypothetical scenario."
        : `Scenario assumptions: demand ${demandChange > 0 ? "increases" : demandChange < 0 ? "decreases" : "is unchanged"} by ${Math.abs(demandChange)}%, while operating costs ${costChange > 0 ? "increase" : costChange < 0 ? "decrease" : "are unchanged"} by ${Math.abs(costChange)}%.`}
    </p>
  </div>

  {result && (
    <div className="scenario-result" aria-live="polite">
      <strong>
        Scenario score:{" "}
        {result.scenario.total_score === null
          ? "Unavailable"
          : `${result.scenario.total_score.toFixed(1)} / 100`}
      </strong>
      <span>
        Baseline:{" "}
        {result.baseline.total_score === null
          ? "Unavailable"
          : `${result.baseline.total_score.toFixed(1)} / 100`}
        {" · "}
        Change:{" "}
        {result.score_change === null
          ? "Unavailable"
          : `${result.score_change > 0 ? "+" : ""}${result.score_change.toFixed(1)}`}
      </span>
      {result.scenario.missing_factors.length > 0 && (
        <span>
          Missing factors: {result.scenario.missing_factors.join(", ")}
        </span>
      )}
    </div>
  )}
  {error && (
    <p className="error-message" role="alert">
      {error}
    </p>
  )}

  <div className="scenario-actions">
    <button
      type="button"
      className="secondary-button"
      onClick={reset}
      disabled={loading || !canAnalyze}
    >
      <RotateCcw size={15} /> Reset
    </button>
    <button
      type="button"
      className="primary-button"
      onClick={applyScenario}
      disabled={loading || !canAnalyze}
    >
      {loading ? "Recalculating..." : "Apply assumptions"}
    </button>
  </div>

  <p className="component-disclaimer">
    These controls describe hypothetical changes. They do not represent a validated sales forecast.
  </p>
</section>

);
}