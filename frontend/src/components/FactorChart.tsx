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
};

const factorDefinitions = [
  { key: "demand_score", label: "Demand" },
  { key: "competition_score", label: "Competition" },
  { key: "accessibility_score", label: "Accessibility" },
  { key: "cost_score", label: "Cost viability" },
  { key: "category_fit_score", label: "Category fit" },
] as const;

export default function FactorChart({ results }: Props) {
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
          <h2>What drives the score?</h2>
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
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="factor"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-12}
                textAnchor="end"
                height={65}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {results.map((city, index) => (
                <Bar
                  key={city.city_name}
                  dataKey={city.city_name}
                  fill={["#5367ed", "#13a98b", "#ed9b45", "#a16be0"][index % 4]}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="footnote">
        Supplied factor values use a 0–100 scale. Missing values remain
        unavailable rather than being treated as zero.
      </p>
    </section>
  );
}