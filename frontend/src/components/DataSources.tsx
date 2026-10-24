import { CheckCircle2, Database, Info, ShieldCheck } from "lucide-react";

type DataSource = {
  name: string;
  description: string;
  status: "available" | "demo" | "pending";
};

type DataSourcesProps = {
  sources?: DataSource[];
};

export default function DataSources({
  sources = [],
}: DataSourcesProps) {
  return (
    <section className="panel data-sources-panel">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">TRUST & TRANSPARENCY</div>
          <h3>Data coverage</h3>
        </div>
        <ShieldCheck size={20} className="heading-icon" />
      </div>

      <p className="panel-description">
        Check the availability and reliability of the information behind your
        site-selection analysis.
      </p>

      <div className="source-list">
        {sources.map((source) => (
          <div className="source-row" key={source.name}>
            <span className="source-icon">
              <Database size={17} />
            </span>

            <div className="source-copy">
              <strong>{source.name}</strong>
              <span>{source.description}</span>
            </div>

            <span className={`source-status source-${source.status}`}>
              {source.status === "available" ? (
                <CheckCircle2 size={13} />
              ) : (
                <Info size={13} />
              )}
              {source.status === "available"
                ? "Available"
                : source.status === "demo"
                  ? "Review"
                  : "Pending"}
            </span>
          </div>
        ))}
      </div>

      <div className="source-note">
        Demo or unverified information should not be interpreted as live market
        research.
      </div>
    </section>
  );
}