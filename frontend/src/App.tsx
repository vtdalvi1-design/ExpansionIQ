import { lazy, Suspense, useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import Header from "./components/Header";
import Sidebar, { type WorkspacePage } from "./components/Sidebar";
import { api } from "./services/api";
import type {
  ComparisonResult,
  FactorValues,
  ScenarioResult,
  ScenarioSettings,
} from "./types";

const Results = lazy(() => import("./pages/Results"));
const SiteFinder = lazy(() => import("./pages/SiteFinder"));
const Settings = lazy(() => import("./pages/Settings"));

type ApiStatus = "checking" | "connected" | "unavailable";

export default function App() {
  const [activePage, setActivePage] = useState<WorkspacePage>("dashboard");
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [locationCount, setLocationCount] = useState<number | null>(null);
  const [competitorCount, setCompetitorCount] = useState<number | null>(null);
  const [cityOptionsError, setCityOptionsError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [scenario, setScenario] = useState<ScenarioResult | null>(null);
  const [scenarioError, setScenarioError] = useState<string | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [scenarioCityName, setScenarioCityName] = useState("");
  const [finderCity, setFinderCity] = useState("");

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
          api
            .getLocations({ location_type: "competitor" })
            .then(({ count }) => {
              if (active) setCompetitorCount(count);
            })
            .catch(() => {
              if (active) setCompetitorCount(null);
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

  async function handleCompare(input: {
    cities: string[];
    category: ComparisonResult["category"];
  }) {
    setComparisonError(null);
    setComparisonLoading(true);
    setScenario(null);
    setScenarioError(null);

    try {
      const result = await api.compareLocations(input);
      setComparison(result);
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

  async function handleScenario(
    cityName: string,
    settings: ScenarioSettings
  ) {
    const cityResult = comparison?.results.find(
      (result) => result.city_name === cityName
    );
    if (!comparison || !cityResult) return;

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
    if (normalized.includes("input") || normalized.includes("factor")) {
      setActivePage("settings");
      return;
    }
    if (normalized.includes("result") || normalized.includes("report")) {
      setActivePage("results");
      return;
    }
    setFinderCity(query);
    setActivePage("site-finder");
  }

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="workspace">
        <Header apiStatus={apiStatus} onSearch={handleGlobalSearch} />
        <main>
          <Suspense
            fallback={<div className="page-content loading-view">Loading workspace...</div>}
          >
            {activePage === "dashboard" && (
              <Dashboard
                onCompare={handleCompare}
                onOpenAreaFinder={() => setActivePage("site-finder")}
                loading={comparisonLoading}
                error={comparisonError}
                cityOptions={cityOptions}
                cityOptionsError={cityOptionsError}
                locationCount={locationCount}
                competitorCount={competitorCount}
              />
            )}
            {activePage === "results" && (
              <Results
                comparison={comparison}
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
              />
            )}
            {activePage === "site-finder" && (
              <SiteFinder
                key={finderCity}
                initialCity={finderCity}
                onBack={() => setActivePage("dashboard")}
              />
            )}
            {activePage === "settings" && <Settings />}
          </Suspense>
        </main>
      </div>
    </div>
  );
}