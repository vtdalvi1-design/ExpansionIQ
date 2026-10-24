import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

type ScoreCardProps = {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  accent?: string;
};

export default function ScoreCard({
  title,
  value,
  subtitle,
  icon,
  trend = "neutral",
  trendLabel,
  accent = "blue",
}: ScoreCardProps) {
  return (
    <article className={`metric-card accent-${accent}`}>
      <div className="metric-card-top">
        <span className="metric-label">{title}</span>
        <span className="metric-icon">{icon}</span>
      </div>

      <div className="metric-value">{value}</div>

      <div className="metric-footer">
        <span className={`metric-trend trend-${trend}`}>
          {trend === "up" && <ArrowUpRight size={15} />}
          {trend === "down" && <ArrowDownRight size={15} />}
          {trend === "neutral" && <Minus size={15} />}
          {trendLabel ?? "Overview"}
        </span>

        <span className="metric-subtitle">{subtitle}</span>
      </div>
    </article>
  );
}