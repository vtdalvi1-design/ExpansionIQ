import type { CityResult } from "../types";

type Props = {
  results: CityResult[];
};

export default function ComparisonTable({ results }: Props) {
  if (results.length === 0) {
    return (
      <section className="panel">
        <h2>City comparison</h2>
        <p>No comparison results are available yet.</p>
      </section>
    );
  }

  const ranked = [...results].sort(
    (a, b) => (b.total_score ?? -1) - (a.total_score ?? -1),
  );

  const factors = [
    { key: "demand_score", label: "Market demand" },
    { key: "competition_score", label: "Competition opportunity" },
    { key: "accessibility_score", label: "Accessibility" },
    { key: "cost_score", label: "Cost viability" },
    { key: "category_fit_score", label: "Category fit" },
  ] as const;

  return (
    <section className="panel comparison-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">SIDE-BY-SIDE ANALYSIS</span>
          <h2>City scorecard</h2>
        </div>
        <span className="muted-label">{results.length} cities</span>
      </div>

      <div className="table-scroll">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Evaluation factor</th>
              {ranked.map((city) => (
                <th key={city.city_name}>
                  <div className="table-city-name">{city.city_name}</div>
                  {city.rank !== null && (
                    <div className="table-city-score">Rank #{city.rank}</div>
                  )}
                  {city.total_score != null && (
                    <div className="table-city-score">
                      {city.total_score.toFixed(1)} / 100
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <tr className="total-score-row">
              <td>Overall score</td>
              {ranked.map((city) => (
                <td key={city.city_name}>
                  {city.total_score == null
                    ? "Unavailable"
                    : `${city.total_score.toFixed(1)} / 100`}
                </td>
              ))}
            </tr>

            {factors.map((factor) => (
              <tr key={factor.key}>
                <td>{factor.label}</td>
                {ranked.map((city) => {
                  const score = city[factor.key];
                  return (
                    <td key={city.city_name}>
                      {typeof score === "number"
                        ? score.toFixed(1)
                        : "Unavailable"}
                    </td>
                  );
                })}
              </tr>
            ))}

            <tr>
              <td>Data source</td>
              {ranked.map((city) => (
                <td key={city.city_name}>{city.source ?? "Not provided"}</td>
              ))}
            </tr>

            <tr>
              <td>Data status</td>
              {ranked.map((city) => (
                <td key={city.city_name}>{city.source_status.replaceAll("_", " ")}</td>
              ))}
            </tr>

            <tr>
              <td>Source notes</td>
              {ranked.map((city) => (
                <td key={city.city_name}>{city.notes ?? "None"}</td>
              ))}
            </tr>

            <tr>
              <td>Missing factors</td>
              {ranked.map((city) => (
                <td key={city.city_name}>
                  {city.missing_factors.length === 0
                    ? "None"
                    : city.missing_factors.join(", ").replaceAll("_", " ")}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="footnote">
        Scores use the displayed factor values and source information. Verify
        source material before making an investment decision.
      </p>
    </section>
  );
}