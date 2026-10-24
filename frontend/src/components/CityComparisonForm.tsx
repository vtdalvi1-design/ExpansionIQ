import { useState, useEffect, type FormEvent, useRef } from "react";
import { ArrowRight, CheckCircle2, ChevronDown, Plus, Sparkles, X, MapPin, Search } from "lucide-react";
import type { BusinessAnalysisInput } from "../types";
import { api } from "../services/api";

export type CityComparisonInput = BusinessAnalysisInput;

type Props = {
  onSubmit: (payload: CityComparisonInput) => void;
  loading?: boolean;
  cityOptions?: string[];
  cityOptionsError?: string | null;
};

const PREDEFINED_BUSINESS_TYPES = [
  "Café or restaurant",
  "Retail store",
  "Grocery store",
  "Clothing store",
  "Pharmacy",
  "Fitness centre",
  "Salon",
  "Educational institute",
  "Service business",
  "Electronics",
  "Other business",
];

const BUSINESS_MODELS = [
  "Physical retail store",
  "Franchise",
  "Online-first with pickup",
  "Hybrid retail",
  "Service centre",
];

function formatRupee(amount: number): string {
  if (isNaN(amount) || amount <= 0) return "₹0";
  if (amount >= 10_000_000) {
    return `₹${(amount / 10_000_000).toFixed(2)} Cr (₹${amount.toLocaleString("en-IN")})`;
  } else if (amount >= 100_000) {
    return `₹${(amount / 100_000).toFixed(2)} Lakhs (₹${amount.toLocaleString("en-IN")})`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function CityComparisonForm({
  onSubmit,
  loading = false,
  cityOptions = [],
  cityOptionsError,
}: Props) {
  const [selectedType, setSelectedType] = useState<string>("Café or restaurant");
  const [customType, setCustomType] = useState<string>("");
  const [budget, setBudget] = useState("2000000");

  const [cities, setCities] = useState<string[]>(["Mumbai", "Pune"]);
  const [cityInput, setCityInput] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ name: string; state: string; pop: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);

  // Optional Inputs
  const [businessModel, setBusinessModel] = useState("Physical retail store");
  const [targetCustomer, setTargetCustomer] = useState("Urban professionals and general consumers");
  const [floorArea, setFloorArea] = useState("1000");
  const [avgTicket, setAvgTicket] = useState("350");
  const [dailyCustomers, setDailyCustomers] = useState("120");
  const [employeeCount, setEmployeeCount] = useState("6");
  const [monthlyRent, setMonthlyRent] = useState("45000");
  const [monthlyOperatingExpenses, setMonthlyOperatingExpenses] = useState("");
  const [expectedRevenue, setExpectedRevenue] = useState("");
  const [forecastStartDate, setForecastStartDate] = useState("");

  const [loadingStep, setLoadingStep] = useState(0);

  // Live city search debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    if (!cityInput.trim() || cityInput.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = window.setTimeout(async () => {
      try {
        const res = await api.getGeographicPlaces({ search: cityInput.trim(), limit: 6 });
        const mapped = res.places.map((p) => ({
          name: p.name,
          state: p.admin1_name || "",
          pop: p.population,
        }));
        setSuggestions(mapped);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [cityInput]);

  // Loading progress steps
  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }
    const stepMessages = [0, 1, 2, 3];
    let current = 0;
    const timer = setInterval(() => {
      current++;
      if (current < stepMessages.length) {
        setLoadingStep(current);
      }
    }, 700);
    return () => clearInterval(timer);
  }, [loading]);

  const activeBusinessType = selectedType === "Other business" ? (customType.trim() || "Custom business") : selectedType;

  function handleAddCity(cityName: string) {
    const trimmed = cityName.trim();
    if (!trimmed) return;
    if (cities.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setCityInput("");
      setShowSuggestions(false);
      return;
    }
    if (cities.length < 5) {
      setCities([...cities, trimmed]);
    }
    setCityInput("");
    setShowSuggestions(false);
  }

  function handleRemoveCity(indexToRemove: number) {
    setCities(cities.filter((_, i) => i !== indexToRemove));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const normalizedCities = cities.map((c) => c.trim()).filter(Boolean);
    const uniqueCities = new Set(normalizedCities.map((c) => c.toLowerCase()));

    if (normalizedCities.length < 2 || uniqueCities.size !== normalizedCities.length) {
      return;
    }

    const budgetNum = Number(budget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      return;
    }

    onSubmit({
      category: activeBusinessType,
      business_type: activeBusinessType,
      budget_inr: budgetNum,
      cities: normalizedCities,
      business_model: businessModel,
      target_customer: targetCustomer.trim(),
      floor_area_sqft: floorArea ? Number(floorArea) : null,
      expected_average_ticket_inr: avgTicket ? Number(avgTicket) : null,
      expected_customers_per_day: dailyCustomers ? Number(dailyCustomers) : null,
      employee_count: employeeCount ? Number(employeeCount) : null,
      monthly_rent_inr: monthlyRent ? Number(monthlyRent) : null,
      monthly_operating_expenses_inr: monthlyOperatingExpenses ? Number(monthlyOperatingExpenses) : null,
      expected_monthly_revenue_inr: expectedRevenue ? Number(expectedRevenue) : null,
      forecast_start_date: forecastStartDate || null,
    });
  }

  const isFormValid =
    cities.length >= 2 &&
    cities.length <= 5 &&
    Number(budget) > 0 &&
    (selectedType !== "Other business" || customType.trim().length > 1);

  const loadingMessages = [
    "Validating business parameters & models...",
    "Querying official Census 2011 & GeoNames records...",
    "Calculating startup costs, cash runway & break-even...",
    "Assembling comparative intelligence matrix...",
  ];

  return (
    <form className="panel comparison-form" onSubmit={handleSubmit}>
      <div className="panel-heading">
        <div>
          <span className="eyebrow">MARKET EXPANSION INTELLIGENCE</span>
          <h2>Location Feasibility & Expansion Planner</h2>
          <p className="panel-description">
            Evaluate candidate cities with transparent financial projections, verified census
            population benchmarks, and a downloadable feasibility report.
          </p>
        </div>
      </div>

      {/* 1. BUSINESS TYPE */}
      <div className="form-field">
        <label htmlFor="comparison-business-type">
          <strong>1. Business Type / Sector</strong> <span className="required-mark">*</span>
        </label>
        <select
          id="comparison-business-type"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          {PREDEFINED_BUSINESS_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {selectedType === "Other business" && (
          <div style={{ marginTop: "8px" }}>
            <input
              type="text"
              id="custom-business-type"
              placeholder="Enter your custom business type (e.g. Specialty Tea Salon, Coworking Cafe)"
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              required
              maxLength={120}
            />
          </div>
        )}
        <p className="field-help">
          Industry-specific economic benchmarks (margins, staffing, Capex distribution) will adapt to your choice.
        </p>
      </div>

      {/* 2. TOTAL INVESTMENT BUDGET */}
      <div className="form-field">
        <label htmlFor="investment-budget">
          <strong>2. Total Investment Budget (INR)</strong> <span className="required-mark">*</span>
        </label>
        <div style={{ position: "relative" }}>
          <input
            id="investment-budget"
            type="number"
            min="10000"
            max="100000000000"
            step="10000"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            required
            placeholder="e.g. 2000000"
          />
        </div>
        <p className="field-help" style={{ color: "#D6B36A", fontWeight: 600 }}>
          {formatRupee(Number(budget))}
        </p>
      </div>

      {/* 3. CITIES TO COMPARE */}
      <div className="form-field">
        <div className="field-label-row">
          <label htmlFor="city-search-input">
            <strong>3. Cities to Compare</strong> (Select 2 to 5) <span className="required-mark">*</span>
          </label>
          <span className="muted-label">{cities.length} selected</span>
        </div>

        {/* Selected city badges */}
        <div className="selected-cities-tags" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
          {cities.map((city, idx) => (
            <span
              key={city}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(214, 179, 106, 0.15)",
                border: "1px solid #D6B36A",
                color: "#F8FAFC",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "13px",
              }}
            >
              <MapPin size={14} color="#D6B36A" />
              <strong>{city}</strong>
              <button
                type="button"
                onClick={() => handleRemoveCity(idx)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#A7B2C4",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: 0,
                }}
                title={`Remove ${city}`}
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>

        {/* City Autocomplete Input */}
        {cities.length < 5 && (
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                id="city-search-input"
                type="text"
                value={cityInput}
                onChange={(e) => {
                  setCityInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search any Indian city or town (e.g. Mumbai, Pune, Bengaluru, Jaipur)..."
                maxLength={100}
              />
              <button
                type="button"
                className="secondary-button"
                onClick={() => handleAddCity(cityInput)}
                disabled={!cityInput.trim()}
              >
                <Plus size={16} /> Add
              </button>
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <ul
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 100,
                  background: "#172235",
                  border: "1px solid #29364A",
                  borderRadius: "6px",
                  listStyle: "none",
                  margin: "4px 0 0 0",
                  padding: "4px 0",
                  maxHeight: "220px",
                  overflowY: "auto",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                }}
              >
                {suggestions.map((item) => (
                  <li
                    key={`${item.name}-${item.state}`}
                    onClick={() => handleAddCity(item.name)}
                    style={{
                      padding: "8px 14px",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#29364A")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span>
                      <strong style={{ color: "#F8FAFC" }}>{item.name}</strong>
                      {item.state && <span style={{ color: "#A7B2C4", fontSize: "12px", marginLeft: "6px" }}>({item.state})</span>}
                    </span>
                    {item.pop > 0 && (
                      <span style={{ fontSize: "11px", color: "#D6B36A", background: "rgba(214, 179, 106, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                        Pop: {(item.pop / 100_000).toFixed(1)}L
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {cities.length < 2 && (
          <p className="field-help" style={{ color: "#FBBF24" }}>
            Please select at least 2 candidate cities to run a comparative analysis.
          </p>
        )}
      </div>

      {/* OPTIONAL EXPANDABLE SECTION */}
      <details className="analysis-optional-fields" open>
        <summary style={{ cursor: "pointer", fontWeight: 600, color: "#D6B36A", padding: "8px 0" }}>
          Additional Business Details & Operating Assumptions (Optional)
        </summary>
        <div className="analysis-input-grid">
          <div className="form-field">
            <label htmlFor="business-model">Business Model</label>
            <select
              id="business-model"
              value={businessModel}
              onChange={(e) => setBusinessModel(e.target.value)}
            >
              {BUSINESS_MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="target-customer">Target Customer Segment</label>
            <input
              id="target-customer"
              value={targetCustomer}
              onChange={(e) => setTargetCustomer(e.target.value)}
              maxLength={120}
            />
          </div>

          <div className="form-field">
            <label htmlFor="floor-area">Approx. Floor Area (sq ft)</label>
            <input
              id="floor-area"
              type="number"
              min="50"
              value={floorArea}
              onChange={(e) => setFloorArea(e.target.value)}
              placeholder="e.g. 1000"
            />
          </div>

          <div className="form-field">
            <label htmlFor="avg-ticket">Expected Avg. Ticket / Transaction (₹)</label>
            <input
              id="avg-ticket"
              type="number"
              min="10"
              value={avgTicket}
              onChange={(e) => setAvgTicket(e.target.value)}
              placeholder="e.g. 350"
            />
          </div>

          <div className="form-field">
            <label htmlFor="daily-customers">Expected Daily Customers</label>
            <input
              id="daily-customers"
              type="number"
              min="1"
              value={dailyCustomers}
              onChange={(e) => setDailyCustomers(e.target.value)}
              placeholder="e.g. 120"
            />
          </div>

          <div className="form-field">
            <label htmlFor="employee-count">Planned Employees</label>
            <input
              id="employee-count"
              type="number"
              min="1"
              value={employeeCount}
              onChange={(e) => setEmployeeCount(e.target.value)}
              placeholder="e.g. 6"
            />
          </div>

          <div className="form-field">
            <label htmlFor="monthly-rent">Estimated Monthly Rent (₹)</label>
            <input
              id="monthly-rent"
              type="number"
              min="1000"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value)}
              placeholder="e.g. 45000"
            />
          </div>

          <div className="form-field">
            <label htmlFor="other-expenses">Other Monthly Operating Expenses (₹)</label>
            <input
              id="other-expenses"
              type="number"
              min="0"
              value={monthlyOperatingExpenses}
              onChange={(e) => setMonthlyOperatingExpenses(e.target.value)}
              placeholder="Optional additional opex"
            />
          </div>
        </div>
      </details>

      {/* INPUT CONFIRMATION CARD (Requirement 2.C) */}
      <div
        className="input-confirmation-card"
        style={{
          background: "#172235",
          border: "1px solid #29364A",
          borderRadius: "8px",
          padding: "16px",
          marginTop: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", color: "#D6B36A" }}>
          <Sparkles size={18} />
          <strong>Analysis Summary & Confirmation</strong>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", fontSize: "13px" }}>
          <div>
            <span style={{ color: "#A7B2C4", display: "block" }}>Business Venture</span>
            <strong style={{ color: "#F8FAFC" }}>{activeBusinessType}</strong>
          </div>
          <div>
            <span style={{ color: "#A7B2C4", display: "block" }}>Investment Capital</span>
            <strong style={{ color: "#34D399" }}>{formatRupee(Number(budget))}</strong>
          </div>
          <div>
            <span style={{ color: "#A7B2C4", display: "block" }}>Selected Locations</span>
            <strong style={{ color: "#F8FAFC" }}>{cities.join(", ") || "None"}</strong>
          </div>
          <div>
            <span style={{ color: "#A7B2C4", display: "block" }}>Operational Setup</span>
            <span style={{ color: "#F8FAFC" }}>
              {floorArea ? `${floorArea} sq ft` : "Standard space"} · {employeeCount ? `${employeeCount} staff` : "Benchmark staff"}
            </span>
          </div>
        </div>
      </div>

      {/* PROGRESS INDICATOR DURING ANALYSIS */}
      {loading && (
        <div
          style={{
            background: "rgba(214, 179, 106, 0.1)",
            border: "1px solid #D6B36A",
            borderRadius: "8px",
            padding: "14px",
            marginTop: "14px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div className="loading-spinner" style={{ width: "22px", height: "22px", border: "2px solid #D6B36A", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <div>
            <strong style={{ color: "#F8FAFC", display: "block", fontSize: "14px" }}>
              Processing Expansion Analysis
            </strong>
            <span style={{ color: "#D6B36A", fontSize: "12px" }}>
              {loadingMessages[loadingStep]}
            </span>
          </div>
        </div>
      )}

      {/* SUBMISSION BUTTON */}
      <div className="form-actions" style={{ marginTop: "20px" }}>
        <button
          type="submit"
          className="primary-button"
          disabled={loading || !isFormValid}
          style={{
            width: "100%",
            justifyContent: "center",
            padding: "14px 20px",
            fontSize: "15px",
            fontWeight: 700,
            letterSpacing: "0.5px",
          }}
        >
          {loading ? "ANALYZING LOCATIONS..." : "ANALYZE LOCATIONS"}
          {!loading && <ArrowRight size={18} />}
        </button>
      </div>
    </form>
  );
}