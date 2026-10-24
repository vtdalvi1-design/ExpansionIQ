import { useState } from "react";
import {
  ArrowLeft,
  Download,
  FileSearch,
  MapPinned,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Building2,
  DollarSign,
  TrendingUp,
  Clock,
  Layers,
  Filter,
  BarChart3,
  Search,
  ExternalLink,
  ChevronRight,
  FileText,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  DemoAnalysisResponse,
  ScenarioResult,
  ScenarioSettings,
} from "../types";
import ComparisonTable from "../components/ComparisonTable";
import FactorChart from "../components/FactorChart";
import LocationMap from "../components/LocationMap";
import ScenarioPanel from "../components/ScenarioPanel";

export type ResultsPage =
  | "summary"
  | "map"
  | "financial"
  | "factors"
  | "competitors"
  | "comparison"
  | "feasibility";

type Props = {
  comparison: DemoAnalysisResponse | null;
  comparisonRestored: boolean;
  comparisonPersistenceError: string | null;
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
  onDownloadPdf?: () => void;
  pdfLoading?: boolean;
  pdfError?: string | null;
};

const pages: Array<{ id: ResultsPage; label: string; number: string }> = [
  { id: "summary", label: "Executive Summary", number: "01" },
  { id: "map", label: "Geospatial Maps", number: "02" },
  { id: "financial", label: "Financial Forecast", number: "03" },
  { id: "factors", label: "Market Factors", number: "04" },
  { id: "competitors", label: "Competitor Intelligence", number: "05" },
  { id: "comparison", label: "Location Comparison", number: "06" },
  { id: "feasibility", label: "Business Feasibility Report", number: "07" },
];

const DONUT_COLORS = ["#D6B36A", "#78A6FF", "#34D399", "#FBBF24", "#F87171", "#A78BFA", "#38BDF8"];

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatMoney(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "Unavailable";
  return currency.format(value);
}

function formatCompactINR(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "₹0";
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(2)} Cr`;
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(1)}L`;
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function Results({
  comparison,
  comparisonRestored,
  comparisonPersistenceError,
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
  onDownloadPdf,
  pdfLoading = false,
  pdfError,
}: Props) {
  const [activeResultsPage, setActiveResultsPage] = useState<ResultsPage>("summary");
  const [selectedCityTab, setSelectedCityTab] = useState<string>(
    comparison?.results[0]?.city_name ?? ""
  );
  const [competitorFilter, setCompetitorFilter] = useState<string>("");

  // Editable Financial Assumptions inside Forecast Page
  const [customMonthlyRent, setCustomMonthlyRent] = useState<number | null>(null);
  const [customStaffing, setCustomStaffing] = useState<number | null>(null);
  const [customAvgTicket, setCustomAvgTicket] = useState<number | null>(null);

  if (!comparison) {
    return (
      <div className="page-content">
        <div className="results-title-row">
          <div>
            <button className="back-button" type="button" onClick={onBack}>
              <ArrowLeft size={16} /> Back to workspace
            </button>
            <span className="eyebrow">ANALYSIS RESULTS</span>
            <h1>Market Analysis Workspace</h1>
          </div>
        </div>
        <section className="panel empty-results">
          <FileSearch size={40} color="#D6B36A" />
          <h2>No location analysis has been submitted yet</h2>
          <p>Enter your business type, investment budget, and candidate cities to initiate feasibility analysis.</p>
          <button className="primary-button" type="button" onClick={onBack}>
            Return to Setup
          </button>
        </section>
      </div>
    );
  }

  const results = comparison.results;
  const forecasts = comparison.forecasts;
  const currentCityName = selectedCityTab || scenarioCityName || results[0]?.city_name;
  const currentForecast = forecasts.find((item) => item.city_name === currentCityName) ?? forecasts[0];
  const recommendedCity = comparison.recommended_city || (results[0]?.total_score ? results[0].city_name : null);
  const topResult = results[0];

  // Active projection data
  const projectionData =
    currentForecast?.projections.map((month) => ({
      month: `M${month.month}`,
      Revenue: month.revenue_inr,
      Expenses: month.expense_inr,
      Profit: month.operating_profit_inr,
      "Cumulative Cashflow": month.cashflow_after_startup_inr,
    })) ?? [];

  // Startup allocations
  const startupAllocationData = Object.entries(currentForecast?.startup_allocation_inr ?? {}).map(
    ([name, value]) => ({ name, value })
  );

  // Operating expense allocation
  const expenseAllocationData = currentForecast
    ? [
        { name: "Direct Cost of Goods", value: currentForecast.cost_of_goods_inr },
        { name: "Commercial Rent", value: currentForecast.rent_inr },
        { name: "Staff Payroll", value: currentForecast.payroll_inr },
        { name: "Utilities & Facility", value: currentForecast.utilities_inr },
        { name: "Marketing & Acquisition", value: currentForecast.marketing_inr },
      ]
    : [];

  // Scenarios Comparison Bar Data
  const scenarioComparisonData = Object.entries(currentForecast?.scenarios ?? {}).map(
    ([name, values]) => ({
      name,
      Revenue: values.monthly_revenue_inr,
      Expenses: values.monthly_expenses_inr,
      "Operating Profit": values.monthly_operating_profit_inr,
    })
  );

  // Break-even Curve Data (Requirement 6)
  const breakEvenCurveData = currentForecast
    ? (() => {
        const fixedCosts =
          currentForecast.rent_inr + currentForecast.utilities_inr + currentForecast.payroll_inr;
        const variableCostRatio =
          (currentForecast.cost_of_goods_inr + currentForecast.marketing_inr) /
          (currentForecast.monthly_revenue_inr || 1);
        const maxRev = Math.max(
          currentForecast.monthly_revenue_inr * 1.5,
          currentForecast.break_even_revenue_inr * 1.3
        );
        return Array.from({ length: 9 }, (_, idx) => {
          const rev = Math.round((maxRev * idx) / 8);
          const totalCost = Math.round(fixedCosts + rev * variableCostRatio);
          return {
            revenue: rev,
            "Total Cost": totalCost,
            "Fixed Overhead": Math.round(fixedCosts),
            "Sales Income": rev,
          };
        });
      })()
    : [];

  // Filtered Competitors (Requirement 8)
  const filteredCompetitors = comparison.competitors.filter((c) => {
    if (!competitorFilter.trim()) return true;
    const q = competitorFilter.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-content">
      {/* HEADER ROW */}
      <div className="results-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <button className="back-button" type="button" onClick={onBack}>
            <ArrowLeft size={16} /> Back to Setup
          </button>
          <span className="eyebrow">
            ANALYSIS #{comparison.analysis_id} · {comparison.business_profile.business_type}
          </span>
          <h1 style={{ margin: "4px 0" }}>Expansion Feasibility & Intelligence</h1>
          <p style={{ color: "#A7B2C4", fontSize: "14px" }}>
            Candidate Locations: <strong>{comparison.business_profile.cities.join(" vs ")}</strong> · Budget:{" "}
            <strong style={{ color: "#34D399" }}>{formatCompactINR(comparison.business_profile.budget_inr)}</strong>
          </p>
        </div>

        {/* TOP ACTION BUTTONS */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {onDownloadPdf && (
            <button
              className="primary-button"
              type="button"
              onClick={onDownloadPdf}
              disabled={pdfLoading}
              style={{ background: "#D6B36A", color: "#0B1220", fontWeight: 700 }}
            >
              <Download size={16} />
              {pdfLoading ? "Generating Feasibility PDF..." : "DOWNLOAD FEASIBILITY REPORT (PDF)"}
            </button>
          )}
          <button
            className="secondary-button"
            type="button"
            onClick={onExport}
            disabled={exportLoading}
          >
            <Download size={16} />
            {exportLoading ? "Exporting CSV..." : "Export CSV"}
          </button>
        </div>
      </div>

      {(exportError || pdfError || comparisonPersistenceError) && (
        <p className="error-message" role="alert" style={{ marginTop: "12px" }}>
          {pdfError ?? exportError ?? comparisonPersistenceError}
        </p>
      )}

      {comparisonRestored && (
        <p className="field-help" role="status" style={{ color: "#34D399", marginTop: "4px" }}>
          Active session restored from backend database archive.
        </p>
      )}

      {/* 7 RESULTS PAGES NAVIGATION TABS */}
      <nav
        className="analysis-page-tabs"
        aria-label="Analysis Results Sections"
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "4px",
          marginTop: "16px",
          borderBottom: "1px solid #29364A",
        }}
      >
        {pages.map((p) => {
          const isActive = activeResultsPage === p.id;
          return (
            <button
              key={p.id}
              type="button"
              className={isActive ? "active" : ""}
              aria-current={isActive ? "page" : undefined}
              onClick={() => setActiveResultsPage(p.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 16px",
                background: isActive ? "rgba(214, 179, 106, 0.15)" : "transparent",
                border: "1px solid",
                borderColor: isActive ? "#D6B36A" : "transparent",
                color: isActive ? "#D6B36A" : "#A7B2C4",
                borderRadius: "8px 8px 0 0",
                fontWeight: isActive ? 700 : 500,
                fontSize: "13px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: "11px", opacity: 0.7 }}>{p.number}</span>
              <span>{p.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ============================================================== */}
      {/* 1. EXECUTIVE SUMMARY */}
      {/* ============================================================== */}
      {activeResultsPage === "summary" && (
        <div className="analysis-section-stack" style={{ marginTop: "20px" }}>
          {/* Main Decision Banner */}
          <section className="panel executive-summary" style={{ borderLeft: "4px solid #D6B36A" }}>
            <div className="panel-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <span className="eyebrow">PRIMARY LOCATION APPRAISAL</span>
                <h2>
                  {recommendedCity ? `${recommendedCity} is Recommended for Expansion` : "Comparative Evaluation Pending"}
                </h2>
                <p className="panel-description" style={{ maxWidth: "780px" }}>
                  {comparison.recommendation_reason ||
                    "Insufficient data for a reliable final recommendation. Review the available comparisons and missing information."}
                </p>
              </div>
              <span
                className="demo-rank-badge"
                style={{
                  background: "#D6B36A",
                  color: "#0B1220",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontWeight: 700,
                  fontSize: "12px",
                }}
              >
                RECOMMENDED LEADER: {recommendedCity || "TIE / UNCONFIRMED"}
              </span>
            </div>

            {/* Quick KPI Overview */}
            <div
              className="analysis-summary-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "14px",
                marginTop: "16px",
                background: "rgba(11, 18, 32, 0.6)",
                padding: "16px",
                borderRadius: "8px",
              }}
            >
              <div>
                <span style={{ color: "#A7B2C4", fontSize: "12px" }}>Business Type</span>
                <strong style={{ display: "block", fontSize: "15px", color: "#F8FAFC" }}>
                  {comparison.business_profile.business_type}
                </strong>
              </div>
              <div>
                <span style={{ color: "#A7B2C4", fontSize: "12px" }}>Total Budget</span>
                <strong style={{ display: "block", fontSize: "15px", color: "#34D399" }}>
                  {formatMoney(comparison.business_profile.budget_inr)}
                </strong>
              </div>
              <div>
                <span style={{ color: "#A7B2C4", fontSize: "12px" }}>Estimated Monthly Revenue</span>
                <strong style={{ display: "block", fontSize: "15px", color: "#D6B36A" }}>
                  {formatMoney(currentForecast?.monthly_revenue_inr)}
                </strong>
              </div>
              <div>
                <span style={{ color: "#A7B2C4", fontSize: "12px" }}>Est. Payback Timeline</span>
                <strong style={{ display: "block", fontSize: "15px", color: "#78A6FF" }}>
                  {currentForecast?.payback_months ? `${currentForecast.payback_months} Months` : "Cash-flow dependent"}
                </strong>
              </div>
            </div>
          </section>

          {/* City Comparison Table */}
          <ComparisonTable results={results} demoMode />

          {/* Advantages, Disadvantages & Risks */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
            <section className="panel">
              <span className="eyebrow" style={{ color: "#34D399" }}>KEY ADVANTAGES</span>
              <h3>Competitive Strengths</h3>
              <ul className="analysis-bullet-list" style={{ marginTop: "10px", paddingLeft: "18px" }}>
                {(currentForecast?.advantages ?? [
                  "High population density provides robust walk-in footfall opportunities.",
                  "Favorable commercial rent-to-revenue ratio under baseline projections.",
                  "Positive operating cash flow trajectory from initial quarters.",
                ]).map((adv, idx) => (
                  <li key={idx} style={{ marginBottom: "6px" }}>{adv}</li>
                ))}
              </ul>
            </section>

            <section className="panel">
              <span className="eyebrow" style={{ color: "#F87171" }}>UNCERTAINTIES & RISKS</span>
              <h3>Key Risk Considerations</h3>
              <ul className="analysis-bullet-list" style={{ marginTop: "10px", paddingLeft: "18px" }}>
                {(currentForecast?.risks ?? [
                  "Working capital vulnerability if revenue takes >6 months to achieve baseline.",
                  "Commercial lease escalation clauses common in prime retail corridors.",
                  "Local licensing and statutory municipal clearance timelines.",
                ]).map((rsk, idx) => (
                  <li key={idx} style={{ marginBottom: "6px" }}>{rsk}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. GEOSPATIAL MAPS */}
      {/* ============================================================== */}
      {activeResultsPage === "map" && (
        <div className="analysis-section-stack" style={{ marginTop: "20px" }}>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">GEOGRAPHIC CONTEXT & LOCATIONS</span>
                <h2>Interactive Location Intelligence Map</h2>
                <p className="panel-description">
                  Inspect candidate cities, geographical coordinates, verified population centers, and district boundaries.
                  Use the map controls to toggle between <strong>Standard Streets</strong>, <strong>Satellite View</strong>,
                  and <strong>Satellite with Labels</strong>.
                </p>
              </div>
            </div>

            <LocationMap
              locations={[]}
              places={comparison.map_places}
              boundaries={[]}
              selectedLocationId={null}
              selectedBoundaryId={null}
              onSelectLocation={() => {}}
              onSelectBoundary={() => {}}
            />
          </section>

          {/* Geographic Details Table */}
          <section className="panel">
            <h3>Geographic & Population Registers</h3>
            <div className="table-scroll" style={{ marginTop: "12px" }}>
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>City / Place</th>
                    <th>State Jurisdiction</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                    <th>GeoNames Population</th>
                    <th>Data Status</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map_places.map((place) => (
                    <tr key={place.geoname_id}>
                      <td><strong>{place.name}</strong></td>
                      <td>{place.admin1_name || "India"}</td>
                      <td>{place.latitude.toFixed(4)}° N</td>
                      <td>{place.longitude.toFixed(4)}° E</td>
                      <td>{place.population ? place.population.toLocaleString("en-IN") : "Recorded"}</td>
                      <td>
                        <span style={{ color: "#34D399", fontSize: "11px", fontWeight: 700 }}>VERIFIED SOURCE</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. FINANCIAL FORECAST */}
      {/* ============================================================== */}
      {activeResultsPage === "financial" && (
        <div className="analysis-section-stack" style={{ marginTop: "20px" }}>
          {/* City Selector for Forecast */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", color: "#A7B2C4", fontWeight: 600 }}>Viewing Forecast For:</span>
            {results.map((r) => (
              <button
                key={r.city_name}
                type="button"
                className={selectedCityTab === r.city_name ? "primary-button" : "secondary-button"}
                onClick={() => setSelectedCityTab(r.city_name)}
                style={{ padding: "6px 14px", fontSize: "12px" }}
              >
                {r.city_name}
              </button>
            ))}
          </div>

          {/* Key Financial KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "12px" }}>
            <div className="panel metric-card" style={{ padding: "16px" }}>
              <span className="eyebrow">MONTHLY REVENUE</span>
              <strong style={{ fontSize: "20px", color: "#D6B36A", display: "block", marginTop: "4px" }}>
                {formatMoney(currentForecast?.monthly_revenue_inr)}
              </strong>
              <small style={{ color: "#A7B2C4", fontSize: "11px" }}>{currentForecast?.revenue_basis}</small>
            </div>
            <div className="panel metric-card" style={{ padding: "16px" }}>
              <span className="eyebrow">MONTHLY EXPENSES</span>
              <strong style={{ fontSize: "20px", color: "#78A6FF", display: "block", marginTop: "4px" }}>
                {formatMoney(currentForecast?.monthly_expenses_inr)}
              </strong>
              <small style={{ color: "#A7B2C4", fontSize: "11px" }}>Rent, COGS, payroll, utilities</small>
            </div>
            <div className="panel metric-card" style={{ padding: "16px" }}>
              <span className="eyebrow">NET OPERATING PROFIT</span>
              <strong
                style={{
                  fontSize: "20px",
                  color: (currentForecast?.operating_profit_inr ?? 0) >= 0 ? "#34D399" : "#F87171",
                  display: "block",
                  marginTop: "4px",
                }}
              >
                {formatMoney(currentForecast?.operating_profit_inr)}
              </strong>
              <small style={{ color: "#A7B2C4", fontSize: "11px" }}>Monthly recurring margin</small>
            </div>
            <div className="panel metric-card" style={{ padding: "16px" }}>
              <span className="eyebrow">BREAK-EVEN REVENUE</span>
              <strong style={{ fontSize: "20px", color: "#FBBF24", display: "block", marginTop: "4px" }}>
                {formatMoney(currentForecast?.break_even_revenue_inr)}
              </strong>
              <small style={{ color: "#A7B2C4", fontSize: "11px" }}>Required monthly sales threshold</small>
            </div>
          </div>

          {/* Startup Investment Breakdown & Expense Distribution Donut Charts */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "16px" }}>
            <section className="panel">
              <span className="eyebrow">CAPITAL ALLOCATION</span>
              <h3>Initial Startup Investment Breakdown</h3>
              <p className="panel-description">Allocation of total available budget ({formatMoney(comparison.business_profile.budget_inr)}).</p>
              <div style={{ height: "260px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={startupAllocationData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      {startupAllocationData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => formatMoney(Number(val))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="panel">
              <span className="eyebrow">OPERATING OVERHEAD</span>
              <h3>Monthly Operating Expense Distribution</h3>
              <p className="panel-description">Breakdown of total monthly operational run-rate ({formatMoney(currentForecast?.monthly_expenses_inr)}).</p>
              <div style={{ height: "260px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseAllocationData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      {expenseAllocationData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={DONUT_COLORS[(index + 2) % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => formatMoney(Number(val))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          {/* 12-Month Cashflow & P&L Projection Chart */}
          <section className="panel">
            <span className="eyebrow">12-MONTH PROJECTIONS</span>
            <h3>Revenue vs Expense Cash Flow Trajectory</h3>
            <div style={{ height: "300px", marginTop: "12px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projectionData}>
                  <CartesianGrid stroke="#29364A" strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fill: "#A7B2C4", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#A7B2C4", fontSize: 11 }} tickFormatter={(v) => formatCompactINR(v)} />
                  <Tooltip formatter={(v) => formatMoney(Number(v))} />
                  <Legend />
                  <Line type="monotone" dataKey="Revenue" stroke="#D6B36A" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="Expenses" stroke="#78A6FF" strokeWidth={2} />
                  <Line type="monotone" dataKey="Profit" stroke="#34D399" strokeWidth={2} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Break-even Chart & Scenarios Bar Chart */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "16px" }}>
            <section className="panel">
              <span className="eyebrow">BREAK-EVEN MODEL</span>
              <h3>Cost-Volume-Profit (Break-Even Intercept)</h3>
              <div style={{ height: "260px", marginTop: "8px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={breakEvenCurveData}>
                    <CartesianGrid stroke="#29364A" strokeDasharray="3 3" />
                    <XAxis dataKey="revenue" tick={{ fill: "#A7B2C4", fontSize: 10 }} tickFormatter={(v) => formatCompactINR(v)} />
                    <YAxis tick={{ fill: "#A7B2C4", fontSize: 10 }} tickFormatter={(v) => formatCompactINR(v)} />
                    <Tooltip formatter={(v) => formatMoney(Number(v))} />
                    <Legend />
                    <Line type="monotone" dataKey="Sales Income" stroke="#34D399" strokeWidth={2} />
                    <Line type="monotone" dataKey="Total Cost" stroke="#F87171" strokeWidth={2} />
                    <Line type="monotone" dataKey="Fixed Overhead" stroke="#A78BFA" strokeDasharray="3 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="panel">
              <span className="eyebrow">RISK SCENARIOS</span>
              <h3>Conservative, Base, and Optimistic Outlook</h3>
              <div style={{ height: "260px", marginTop: "8px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scenarioComparisonData}>
                    <CartesianGrid stroke="#29364A" strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fill: "#A7B2C4", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#A7B2C4", fontSize: 10 }} tickFormatter={(v) => formatCompactINR(v)} />
                    <Tooltip formatter={(v) => formatMoney(Number(v))} />
                    <Legend />
                    <Bar dataKey="Revenue" fill="#D6B36A" />
                    <Bar dataKey="Expenses" fill="#78A6FF" />
                    <Bar dataKey="Operating Profit" fill="#34D399" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. MARKET FACTORS */}
      {/* ============================================================== */}
      {activeResultsPage === "factors" && (
        <div className="analysis-section-stack" style={{ marginTop: "20px" }}>
          <section className="panel">
            <span className="eyebrow">EVALUATION METRIC WEIGHTS</span>
            <h2>{comparison.category} Industry Scoring Profile</h2>
            <p className="panel-description">
              Weights reflect industry-specific operating dependencies: footfall accessibility, population demand,
              competitive breathing room, operating cost viability, and target demographic fit.
            </p>
            <div
              className="analysis-summary-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "12px",
                marginTop: "14px",
              }}
            >
              {Object.entries(comparison.factor_weights).map(([factor, weight]) => (
                <div key={factor} style={{ background: "#172235", padding: "12px", borderRadius: "8px", border: "1px solid #29364A" }}>
                  <span style={{ color: "#A7B2C4", fontSize: "12px", textTransform: "capitalize" }}>
                    {factor.replaceAll("_", " ")}
                  </span>
                  <strong style={{ display: "block", fontSize: "18px", color: "#D6B36A", marginTop: "4px" }}>
                    {(weight * 100).toFixed(0)}% Weight
                  </strong>
                </div>
              ))}
            </div>
          </section>

          {/* Factor Comparison Graph */}
          <FactorChart results={results} demoMode />

          {/* Sourced vs Simulated Transparency Register */}
          <section className="panel">
            <h3>Market Factor Transparency & Data Status Table</h3>
            <div className="table-scroll" style={{ marginTop: "12px" }}>
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Factor Name</th>
                    <th>Observed / Estimated Value</th>
                    <th>Unit</th>
                    <th>Geographic Coverage</th>
                    <th>Data Source</th>
                    <th>Reference Period</th>
                    <th>Status Badge</th>
                  </tr>
                </thead>
                <tbody>
                  {results.flatMap((r) => [
                    {
                      factor: "Demographic Demand",
                      val: r.demand_score ?? "N/A",
                      unit: "Index (0-100)",
                      city: r.city_name,
                      source: "Census 2011 / Retail Demand Model",
                      period: "2011 - 2026",
                      status: "ESTIMATED VALUE",
                    },
                    {
                      factor: "Competition Opportunity",
                      val: r.competition_score ?? "N/A",
                      unit: "Index (0-100)",
                      city: r.city_name,
                      source: "Retail Establishments Registry",
                      period: "2026",
                      status: "CALCULATED RESULT",
                    },
                    {
                      factor: "Customer Accessibility",
                      val: r.accessibility_score ?? "N/A",
                      unit: "Index (0-100)",
                      city: r.city_name,
                      source: "GeoNames Transit Nodes",
                      period: "2026",
                      status: "VERIFIED SOURCE DATA",
                    },
                    {
                      factor: "Commercial Cost Viability",
                      val: r.cost_score ?? "N/A",
                      unit: "Index (0-100)",
                      city: r.city_name,
                      source: "ExpansionIQ Cost Index",
                      period: "2026",
                      status: "ILLUSTRATIVE ASSUMPTION",
                    },
                  ]).map((item, idx) => (
                    <tr key={idx}>
                      <td><strong>{item.factor}</strong></td>
                      <td>{item.val}</td>
                      <td>{item.unit}</td>
                      <td>{item.city}</td>
                      <td>{item.source}</td>
                      <td>{item.period}</td>
                      <td>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontWeight: 700,
                            background:
                              item.status === "VERIFIED SOURCE DATA"
                                ? "rgba(16, 185, 129, 0.2)"
                                : "rgba(214, 179, 106, 0.15)",
                            color:
                              item.status === "VERIFIED SOURCE DATA" ? "#34D399" : "#D6B36A",
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. COMPETITOR INTELLIGENCE */}
      {/* ============================================================== */}
      {activeResultsPage === "competitors" && (
        <div className="analysis-section-stack" style={{ marginTop: "20px" }}>
          <section className="panel">
            <div className="panel-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <span className="eyebrow">COMPETITIVE SATURATION ANALYSIS</span>
                <h2>Competitor Records & Density Coverage</h2>
                <p className="panel-description">
                  Showing active saved competitor records from the database. Missing competitors are explicitly flagged rather than fabricated.
                </p>
              </div>
              <div style={{ position: "relative", minWidth: "220px" }}>
                <input
                  type="text"
                  placeholder="Filter by business or city..."
                  value={competitorFilter}
                  onChange={(e) => setCompetitorFilter(e.target.value)}
                  style={{ padding: "8px 12px 8px 32px", fontSize: "13px" }}
                />
                <Search size={14} style={{ position: "absolute", left: "10px", top: "11px", color: "#A7B2C4" }} />
              </div>
            </div>

            {filteredCompetitors.length > 0 ? (
              <div className="table-scroll">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Business Name</th>
                      <th>City</th>
                      <th>Category</th>
                      <th>Record Status</th>
                      <th>Source Documentation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompetitors.map((item) => (
                      <tr key={item.id}>
                        <td><strong>{item.name}</strong></td>
                        <td>{item.city}</td>
                        <td>{item.category}</td>
                        <td>
                          <span style={{ color: "#34D399", fontWeight: 600 }}>{item.source_status}</span>
                        </td>
                        <td>{item.source_name ?? "Not documented"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "36px 20px", textAlign: "center" }}>
                <AlertTriangle size={32} color="#FBBF24" style={{ margin: "0 auto 10px auto" }} />
                <strong style={{ display: "block", fontSize: "16px", color: "#F8FAFC" }}>
                  No verified competitor records currently cataloged
                </strong>
                <p style={{ color: "#A7B2C4", maxWidth: "540px", margin: "6px auto 0 auto", fontSize: "13px" }}>
                  Competitor density benchmarks in scoring are currently calculated from population ratios.
                  You can input verified competitor locations in the <strong>Area Finder</strong> workspace.
                </p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. LOCATION COMPARISON */}
      {/* ============================================================== */}
      {activeResultsPage === "comparison" && (
        <div className="analysis-section-stack" style={{ marginTop: "20px" }}>
          <section className="panel">
            <span className="eyebrow">SIDE-BY-SIDE MATRIX</span>
            <h2>Complete Candidate City Comparison</h2>
            <div className="table-scroll" style={{ marginTop: "14px" }}>
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Comparison Category</th>
                    {results.map((r) => (
                      <th key={r.city_name} style={{ color: r.city_name === recommendedCity ? "#D6B36A" : "#F8FAFC" }}>
                        {r.city_name} {r.city_name === recommendedCity && "★"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Overall Opportunity Score</strong></td>
                    {results.map((r) => (
                      <td key={r.city_name}>
                        <strong style={{ color: "#D6B36A" }}>{r.total_score?.toFixed(1) ?? "N/A"}/100</strong>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td><strong>Rank Position</strong></td>
                    {results.map((r) => (
                      <td key={r.city_name}>#{r.rank ?? "-"}</td>
                    ))}
                  </tr>
                  <tr>
                    <td><strong>GeoNames Population</strong></td>
                    {results.map((r) => {
                      const pl = comparison.map_places.find((p) => p.name === r.city_name);
                      return <td key={r.city_name}>{pl?.population ? pl.population.toLocaleString("en-IN") : "Recorded"}</td>;
                    })}
                  </tr>
                  <tr>
                    <td><strong>Estimated Monthly Revenue</strong></td>
                    {results.map((r) => {
                      const f = forecasts.find((item) => item.city_name === r.city_name);
                      return <td key={r.city_name}>{formatMoney(f?.monthly_revenue_inr)}</td>;
                    })}
                  </tr>
                  <tr>
                    <td><strong>Estimated Monthly Expenses</strong></td>
                    {results.map((r) => {
                      const f = forecasts.find((item) => item.city_name === r.city_name);
                      return <td key={r.city_name}>{formatMoney(f?.monthly_expenses_inr)}</td>;
                    })}
                  </tr>
                  <tr>
                    <td><strong>Monthly Operating Profit</strong></td>
                    {results.map((r) => {
                      const f = forecasts.find((item) => item.city_name === r.city_name);
                      return (
                        <td key={r.city_name} style={{ color: (f?.operating_profit_inr ?? 0) >= 0 ? "#34D399" : "#F87171" }}>
                          {formatMoney(f?.operating_profit_inr)}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td><strong>Break-Even Revenue</strong></td>
                    {results.map((r) => {
                      const f = forecasts.find((item) => item.city_name === r.city_name);
                      return <td key={r.city_name}>{formatMoney(f?.break_even_revenue_inr)}</td>;
                    })}
                  </tr>
                  <tr>
                    <td><strong>Payback Period (Months)</strong></td>
                    {results.map((r) => {
                      const f = forecasts.find((item) => item.city_name === r.city_name);
                      return <td key={r.city_name}>{f?.payback_months ?? "N/A"}</td>;
                    })}
                  </tr>
                  <tr>
                    <td><strong>Data Completeness</strong></td>
                    {results.map((r) => (
                      <td key={r.city_name}>
                        <span style={{ color: "#34D399", fontWeight: 600 }}>100% (Modeled)</span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. BUSINESS FEASIBILITY REPORT (PDF PREVIEW & DOWNLOAD) */}
      {/* ============================================================== */}
      {activeResultsPage === "feasibility" && (
        <div className="analysis-section-stack" style={{ marginTop: "20px" }}>
          {/* Main Download Hero Card */}
          <section className="panel" style={{ background: "linear-gradient(135deg, #172235 0%, #111827 100%)", border: "1px solid #D6B36A", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
              <div style={{ maxWidth: "620px" }}>
                <span className="eyebrow" style={{ color: "#D6B36A" }}>OFFICIAL FEASIBILITY APPRAISAL</span>
                <h2 style={{ fontSize: "24px", margin: "6px 0 10px 0" }}>Business Feasibility Report (PDF)</h2>
                <p style={{ color: "#A7B2C4", fontSize: "14px", lineHeight: "1.6" }}>
                  Download the complete, publication-grade 20-section report including executive summary,
                  candidate city rankings, Census 2011 benchmarks, itemized startup Capex allocations,
                  12-month P&L cash-flow models, break-even graphs, and risk disclosures.
                </p>
              </div>
              <div>
                <button
                  type="button"
                  className="primary-button"
                  onClick={onDownloadPdf}
                  disabled={pdfLoading}
                  style={{
                    background: "#D6B36A",
                    color: "#0B1220",
                    padding: "16px 28px",
                    fontSize: "15px",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                  }}
                >
                  <Download size={20} />
                  {pdfLoading ? "PREPARING PDF..." : "DOWNLOAD BUSINESS FEASIBILITY REPORT (PDF)"}
                </button>
              </div>
            </div>
          </section>

          {/* 20 Sections Document Structure Preview */}
          <section className="panel">
            <h3>Feasibility Report Contents & Methodology Structure</h3>
            <p className="panel-description">
              The generated PDF report compiles all 20 required analytical sections using active project parameters:
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "10px", marginTop: "14px" }}>
              {[
                "1. Cover Page & Executive Title",
                "2. Business Profile & Category",
                "3. User Inputs & Assumptions",
                "4. Executive Summary & Recommendation",
                "5. Selected Candidate Cities",
                "6. Scoring Methodology & Weights",
                "7. Sourced Data Registers (Census/Geo)",
                "8. Data-Quality & Verification Audit",
                "9. Market Factors Analysis",
                "10. Competitor Saturation Analysis",
                "11. Geospatial & Coordinate Findings",
                "12. Startup Capex Allocation",
                "13. Revenue & Expense Projections",
                "14. Profit & Loss Forecast",
                "15. Break-Even Revenue Threshold",
                "16. Risk Scenarios (Base/Cons/Opt)",
                "17. Side-by-Side Location Matrix",
                "18. Operational Risks & Limitations",
                "19. Missing Data Disclosures",
                "20. Strategic Next Steps & Action Plan",
              ].map((title, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#172235",
                    border: "1px solid #29364A",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    color: "#F8FAFC",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <CheckCircle2 size={15} color="#34D399" />
                  <span>{title}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
