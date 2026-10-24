import { MapPinned } from "lucide-react";

export default function DistanceAnalysis() {
  return (
    <section className="panel distance-analysis-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">COMPETITOR PROXIMITY</span>
          <h2>Distance analysis unavailable</h2>
        </div>
        <MapPinned size={20} className="heading-icon" />
      </div>
      <p className="panel-description">
        Geocoded candidate and competitor records have not been supplied.
        Distances are not estimated without location coordinates.
      </p>
    </section>
  );
}
