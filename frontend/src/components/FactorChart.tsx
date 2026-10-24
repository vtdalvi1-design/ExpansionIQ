import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CityResult } from "../types";

type Props = {
  results: CityResult[];
  demoMode?: boolean;
};

const factorDefinitions = [
  { key: "demand_score", label: "Demand" },
  { key: "competition_score", label: "Competition" },
  { key: "accessibility_score", label: "Accessibility" },
  { key: "cost_score", label: "Cost viability" },
  { key: "category_fit_score", label: "Category fit" },
] as const;

export default function FactorChart({
  results,
  demoMode = false,
}: Props) {
  const data = factorDefinitions.map((factor) => {
    const row: Record<string, string | number | null> = {
      factor: factor.label,
    };

    results.forEach((city) => {
      row[city.city_name] = city[factor.key] ?? null;
    });

    return row;
  });

  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">FACTOR BREAKDOWN</span>
          <h2>{demoMode ? "Simulated market-factor profile" : "Submitted factor values"}</h2>
        </div>
      </div>

      {results.length === 0 ? (
        <p>No data available to chart.</p>
      ) : (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data}
              margin={{ top: 10, right: 12, left: -16, bottom: 8 }}
            >
              <CartesianGrid
                stroke="#29364A"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="factor"
                tick={{ fontSize: 11, fill: "#A7B2C4" }}
                axisLine={{ stroke: "#53647A" }}
                tickLine={{ stroke: "#53647A" }}
                interval={0}
                angle={-12}
                textAnchor="end"
                height={65}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "#A7B2C4" }}
                axisLine={{ stroke: "#53647A" }}
                tickLine={{ stroke: "#53647A" }}
              />
              <Tooltip
                contentStyle={{
                  border: "1px solid #29364A",
                  borderRadius: 8,
                  color: "#F8FAFC",
                  backgroundColor: "#111827",
                }}
                labelStyle={{ color: "#F8FAFC" }}
                itemStyle={{ color: "#D6B36A" }}
              />
              <Legend wrapperStyle={{ color: "#A7B2C4", fontSize: 11 }} />
              {results.map((city, index) => (
                <Bar
                  key={city.city_name}
                  dataKey={city.city_name}
                  fill={[
                    "#D6B36A",
                    "#78A6FF",
                    "#34D399",
                    "#FBBF24",
                    "#C4B5FD",
                  ][index % 5]}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="footnote">
        {demoMode
          ? "Demo-only values use a 0–100 scale and the configured category weights. They are deterministic synthetic estimates, not observed conditions."
          : "Supplied factor values use a 0–100 scale. Missing values remain unavailable rather than being treated as zero. Values are not evidence of validated market opportunity."}
      </p>
    </section>
  );
}