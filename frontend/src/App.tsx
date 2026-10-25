import { lazy, Suspense, useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import Header from "./components/Header";
import Sidebar, { type WorkspacePage } from "./components/Sidebar";
import { api } from "./services/api";
import type {
  BusinessAnalysisInput,
  DemoAnalysisResponse,
  FactorValues,
  ScenarioResult,
  ScenarioSettings,
} from "./types";

const Results = lazy(() => import("./pages/Results"));
const SiteFinder = lazy(() => import("./pages/SiteFinder"));
const Settings = lazy(() => import("./pages/Settings"));

type ApiStatus = "checking" | "connected" | "unavailable";

const COMPARISON_STORAGE_KEY = "expansioniq:last-comparison:v1";

type StoredComparisonState = {
  comparison: DemoAnalysisResponse | null;
  restored: boolean;
  error: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDemoAnalysis(value: unknown): value is DemoAnalysisResponse {
  if (!isRecord(value)) return false;

  return (
    Number.isInteger(value.analysis_id) &&
    typeof value.category === "string" &&
    Array.isArray(value.results) &&
    Array.isArray(value.forecasts) &&
    Array.isArray(value.map_places) &&
    Array.isArray(value.map_resolutions) &&
    Array.isArray(value.competitors) &&
    value.results.every(
      (result) =>
        isRecord(result) &&
        typeof result.city_name === "string" &&
        typeof result.name === "string" &&
        (result.total_score === null || typeof result.total_score === "number") &&
        ["complete", "incomplete"].includes(String(result.score_status)) &&
        Array.isArray(result.missing_factors),
    )
  );
}

function restoreComparison(): StoredComparisonState {
  try {
    const stored = window.sessionStorage.getItem(COMPARISON_STORAGE_KEY);
    if (!stored) return { comparison: null, restored: false, error: null };

    const parsed: unknown = JSON.parse(stored);
    if (!isDemoAnalysis(parsed)) {
      return {
        comparison: null,
        restored: false,
        error: "The saved comparison could not be restored. Please analyze the locations again.",
      };
    }

    return { comparison: parsed, restored: true, error: null };
  } catch {
    return {
      comparison: null,
      restored: false,
      error: "The saved comparison could not be read from this browser session.",
    };
  }
}

export default function App() {
  const [storedComparison] = useState(restoreComparison);
  const [activePage, setActivePage] = useState<WorkspacePage>(
    storedComparison.comparison ? "results" : "dashboard",
  );
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const [comparison, setComparison] = useState<DemoAnalysisResponse | null>(
    storedComparison.comparison,
  );
  const [comparisonRestored, setComparisonRestored] = useState(
    storedComparison.restored,
  );
  const [comparisonPersistenceError, setComparisonPersistenceError] = useState(
    storedComparison.error,
  );
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [locationCount, setLocationCount] = useState<number | null>(null);
  const [cityOptionsError, setCityOptionsError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [scenario, setScenario] = useState<ScenarioResult | null>(null);
  const [scenarioError, setScenarioError] = useState<string | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [scenarioCityName, setScenarioCityName] = useState(
    storedComparison.comparison?.results[0]?.city_name ?? "",
  );
  const [finderQuery, setFinderQuery] = useState("");

  useEffect(() => {
    let active = true;
    const checkHealth = () => {
      api
        .health()
        .then(() => {
          if (!active) return;
          setApiStatus("connected");
          api
            .getCities()
            .then(({ cities }) => {
              if (!active) return;
              setCityOptions(cities);
              setCityOptionsError(null);
            })
            .catch((error: unknown) => {
              if (!active) return;
              setCityOptionsError(
                error instanceof Error
                  ? error.message
                  : "City suggestions could not be loaded."
              );
            });
          api
            .getLocations()
            .then(({ count }) => {
              if (active) setLocationCount(count);
            })
            .catch(() => {
              if (active) setLocationCount(null);
            });
        })
        .catch(() => {
          if (active) setApiStatus("unavailable");
        });
    };
    checkHealth();
    const interval = window.setInterval(checkHealth, 15_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!storedComparison.comparison) return;
    let active = true;

    api
      .getDemoAnalysis(
        storedComparison.comparison.analysis_id,
        storedComparison.comparison.access_token ?? "",
      )
      .then((savedAnalysis) => {
        if (!active) return;
        const restoredAnalysis = {
          ...savedAnalysis,
          access_token: storedComparison.comparison?.access_token,
        };
        setComparison(restoredAnalysis);
        try {
          window.sessionStorage.setItem(
            COMPARISON_STORAGE_KEY,
            JSON.stringify(restoredAnalysis),
          );
          setComparisonPersistenceError(null);
        } catch {
          setComparisonPersistenceError(
            "The backend analysis loaded, but the browser could not refresh its session copy.",
          );
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        setComparisonPersistenceError(
          `Showing the browser-saved copy. The backend could not reload analysis #${storedComparison.comparison?.analysis_id}: ${
            error instanceof Error ? error.message : "request failed"
          }`,
        );
      });

    return () => {
      active = false;
    };
  }, [storedComparison.comparison]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activePage]);

  async function handleCompare(input: BusinessAnalysisInput) {
    setComparisonError(null);
    setComparisonLoading(true);
    setScenario(null);
    setScenarioError(null);

    try {
      const result = await api.createDemoAnalysis(input);
      setComparison(result);
      setComparisonRestored(false);
      try {
        window.sessionStorage.setItem(
          COMPARISON_STORAGE_KEY,
          JSON.stringify(result),
        );
        setComparisonPersistenceError(null);
      } catch {
        setComparisonPersistenceError(
          "The comparison completed, but this browser could not save it for restoration after a refresh.",
        );
      }
      setScenarioCityName(result.results[0]?.city_name ?? "");
      setActivePage("results");
    } catch (error) {
      setComparisonError(
        error instanceof Error ? error.message : "Comparison failed."
      );
    } finally {
      setComparisonLoading(false);
    }
  }

  async function handleExport() {
    if (!comparison) return;

    setExportError(null);
    setExportLoading(true);
    try {
      const blob = await api.exportComparison(comparison.results);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "expansioniq-market-comparison.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : "CSV export failed."
      );
    } finally {
      setExportLoading(false);
    }
  }

  async function handleDownloadPdf() {
    if (!comparison) return;

    setPdfError(null);
    setPdfLoading(true);
    try {
      const blob = await api.downloadFeasibilityReportPdf(
        comparison.analysis_id,
        comparison.access_token
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const bType = (comparison.business_profile.business_type || "Business").replace(/[^a-zA-Z0-9]/g, "_");
      link.download = `ExpansionIQ-Feasibility-Report-${bType}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setPdfError(
        error instanceof Error
          ? error.message
          : "Failed to download the Business Feasibility Report."
      );
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleScenario(
    cityName: string,
    settings: ScenarioSettings
  ) {
    const cityResult = comparison?.results.find(
      (result) => result.city_name === cityName
    );
    if (!comparison || !cityResult) return;
    if (cityResult.total_score === null) {
      setScenario(null);
      setScenarioError(
        "Scenario analysis requires complete factor values for the selected city."
      );
      return;
    }

    const factors: FactorValues = {
      demand: cityResult.demand_score,
      competition_opportunity: cityResult.competition_score,
      accessibility: cityResult.accessibility_score,
      cost_viability: cityResult.cost_score,
      category_fit: cityResult.category_fit_score,
    };

    setScenarioError(null);
    setScenarioLoading(true);
    try {
      setScenario(
        await api.runScenario(comparison.category, factors, settings)
      );
    } catch (error) {
      setScenarioError(
        error instanceof Error ? error.message : "Scenario calculation failed."
      );
    } finally {
      setScenarioLoading(false);
    }
  }

  function handleGlobalSearch(query: string) {
    const normalized = query.toLocaleLowerCase();
    if (normalized.includes("result") || normalized.includes("report") || normalized.includes("analys")) {
      setActivePage("results");
      return;
    }
    setActivePage("dashboard");
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="workspace">
        <Header apiStatus={apiStatus} onSearch={handleGlobalSearch} />
        <main id="main-content" tabIndex={-1}>
          <Suspense
            fallback={<div className="page-content loading-view">Loading workspace...</div>}
          >
            {activePage === "dashboard" && (
              <Dashboard
                onCompare={handleCompare}
                apiStatus={apiStatus}
                loading={comparisonLoading}
                error={comparisonError}
                cityOptions={cityOptions}
                cityOptionsError={cityOptionsError}
                locationCount={locationCount}
              />
            )}
            {activePage === "results" && (
              <Results
                comparison={comparison}
                comparisonRestored={comparisonRestored}
                comparisonPersistenceError={comparisonPersistenceError}
                onBack={() => setActivePage("dashboard")}
                onExport={handleExport}
                exportLoading={exportLoading}
                exportError={exportError}
                onApplyScenario={handleScenario}
                scenarioCityName={scenarioCityName}
                onScenarioCityChange={(cityName) => {
                  setScenarioCityName(cityName);
                  setScenario(null);
                  setScenarioError(null);
                }}
                scenario={scenario}
                scenarioLoading={scenarioLoading}
                scenarioError={scenarioError}
                onDownloadPdf={handleDownloadPdf}
                pdfLoading={pdfLoading}
                pdfError={pdfError}
              />
            )}
          </Suspense>
        </main>
      </div>
    </div>
  );
}