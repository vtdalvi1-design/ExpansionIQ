import { useEffect, useState } from "react";
import L, { type LeafletMouseEvent } from "leaflet";
import type { Feature } from "geojson";
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import { Layers, Map as MapIcon, Globe, Check } from "lucide-react";
import type {
  AdministrativeBoundary,
  GeographicPlaceRecord,
  LocationRecord,
} from "../types";

type MapViewMode = "streets" | "satellite" | "hybrid";

type Props = {
  locations: LocationRecord[];
  places: GeographicPlaceRecord[];
  boundaries: AdministrativeBoundary[];
  selectedLocationId: number | null;
  selectedBoundaryId: string | null;
  onSelectLocation: (locationId: number) => void;
  onSelectBoundary: (boundaryId: string) => void;
};

function FitLocations({
  locations,
  places,
}: {
  locations: LocationRecord[];
  places: GeographicPlaceRecord[];
}) {
  const map = useMap();

  useEffect(() => {
    const points = [
      ...locations.map(({ latitude, longitude }) => [latitude, longitude] as [number, number]),
      ...places.map(({ latitude, longitude }) => [latitude, longitude] as [number, number]),
    ];
    if (points.length === 0) return;

    if (points.length === 1) {
      map.setView(points[0], 11);
      return;
    }

    map.fitBounds(points, { padding: [48, 48], maxZoom: 12 });
  }, [locations, places, map]);

  return null;
}

function ResetView() {
  const map = useMap();

  return (
    <button
      type="button"
      className="map-reset-button"
      onClick={() => map.setView([21.5, 78.5], 5)}
    >
      Reset view
    </button>
  );
}

function BoundaryFeature({
  boundary,
  selected,
  onSelect,
}: {
  boundary: AdministrativeBoundary;
  selected: boolean;
  onSelect: (boundaryId: string) => void;
}) {
  const feature: Feature = {
    type: "Feature",
    properties: {
      boundary_id: boundary.boundary_id,
      name: boundary.name,
    },
    geometry: boundary.geometry,
  };

  function select() {
    onSelect(boundary.boundary_id);
  }

  function highlight(event: LeafletMouseEvent) {
    const layer = event.target;
    if (layer instanceof L.Path) {
      layer.setStyle({ color: "#D6B36A", weight: 2.5, fillOpacity: 0.22 });
      layer.bringToFront();
    }
  }

  function resetStyle(event: LeafletMouseEvent) {
    const layer = event.target;
    if (layer instanceof L.Path) {
      layer.setStyle({
        color: selected ? "#D6B36A" : "#475467",
        weight: selected ? 2.5 : 1,
        fillColor: selected ? "#D6B36A" : "#CBD5E1",
        fillOpacity: selected ? 0.28 : 0.04,
      });
    }
  }

  return (
    <GeoJSON
      data={feature}
      style={{
        color: selected ? "#D6B36A" : "#475467",
        weight: selected ? 2.5 : 1,
        fillColor: selected ? "#D6B36A" : "#CBD5E1",
        fillOpacity: selected ? 0.28 : 0.04,
      }}
      eventHandlers={{
        click: select,
        mouseover: highlight,
        mouseout: resetStyle,
      }}
    >
      <Tooltip sticky>
        {boundary.name} · District Boundary (ADM2, 2021)
      </Tooltip>
    </GeoJSON>
  );
}

export default function LocationMap({
  locations,
  places,
  boundaries,
  selectedLocationId,
  selectedBoundaryId,
  onSelectLocation,
  onSelectBoundary,
}: Props) {
  const [viewMode, setViewMode] = useState<MapViewMode>("streets");
  const [showBoundaries, setShowBoundaries] = useState(false);
  const [tilesUnavailable, setTilesUnavailable] = useState(false);

  return (
    <div className="location-map-frame" style={{ position: "relative" }}>
      {/* MAP LAYER CONTROLS (Requirement 5) */}
      <div
        style={{
          position: "absolute",
          top: "14px",
          left: "14px",
          zIndex: 1000,
          background: "rgba(17, 24, 39, 0.92)",
          backdropFilter: "blur(8px)",
          border: "1px solid #29364A",
          borderRadius: "8px",
          padding: "6px",
          display: "flex",
          gap: "4px",
          boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
        }}
      >
        <button
          type="button"
          onClick={() => setViewMode("streets")}
          style={{
            background: viewMode === "streets" ? "#D6B36A" : "transparent",
            color: viewMode === "streets" ? "#0B1220" : "#F8FAFC",
            border: "none",
            borderRadius: "6px",
            padding: "6px 10px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <MapIcon size={14} /> Standard Streets
        </button>
        <button
          type="button"
          onClick={() => setViewMode("satellite")}
          style={{
            background: viewMode === "satellite" ? "#D6B36A" : "transparent",
            color: viewMode === "satellite" ? "#0B1220" : "#F8FAFC",
            border: "none",
            borderRadius: "6px",
            padding: "6px 10px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <Globe size={14} /> Satellite
        </button>
        <button
          type="button"
          onClick={() => setViewMode("hybrid")}
          style={{
            background: viewMode === "hybrid" ? "#D6B36A" : "transparent",
            color: viewMode === "hybrid" ? "#0B1220" : "#F8FAFC",
            border: "none",
            borderRadius: "6px",
            padding: "6px 10px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <Layers size={14} /> Satellite with Labels
        </button>
        {boundaries.length > 0 && (
          <button
            type="button"
            onClick={() => setShowBoundaries(!showBoundaries)}
            style={{
              background: showBoundaries ? "rgba(214, 179, 106, 0.2)" : "transparent",
              color: showBoundaries ? "#D6B36A" : "#A7B2C4",
              border: "1px solid",
              borderColor: showBoundaries ? "#D6B36A" : "#29364A",
              borderRadius: "6px",
              padding: "6px 10px",
              fontSize: "12px",
              cursor: "pointer",
              marginLeft: "4px",
            }}
          >
            Districts {showBoundaries ? "ON" : "OFF"}
          </button>
        )}
      </div>

      <MapContainer
        center={[21.5, 78.5]}
        zoom={5}
        minZoom={3}
        maxZoom={18}
        scrollWheelZoom
        keyboard
        className="location-map"
      >
        {/* BASE TILE LAYERS */}
        {viewMode === "streets" ? (
          <TileLayer
            key="streets"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{
              load: () => setTilesUnavailable(false),
              tileerror: () => setTilesUnavailable(true),
            }}
          />
        ) : (
          <TileLayer
            key="satellite"
            attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            eventHandlers={{
              load: () => setTilesUnavailable(false),
              tileerror: () => setTilesUnavailable(true),
            }}
          />
        )}

        {/* HYBRID LABELS OVERLAY */}
        {viewMode === "hybrid" && (
          <TileLayer
            key="hybrid-labels"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
            opacity={0.88}
          />
        )}

        <FitLocations locations={locations} places={places} />
        <ResetView />

        {/* GEONAMES PLACES PINS */}
        {places.map((place) => (
          <CircleMarker
            key={place.geoname_id}
            center={[place.latitude, place.longitude]}
            radius={8}
            pathOptions={{
              color: "#FFFFFF",
              weight: 2,
              fillColor: "#D6B36A",
              fillOpacity: 0.9,
            }}
          >
            <Popup>
              <div style={{ color: "#0B1220", fontSize: "13px" }}>
                <strong style={{ fontSize: "14px", display: "block" }}>{place.name}</strong>
                <span>{place.admin1_name ? `State: ${place.admin1_name}` : "India"}</span>
                <br />
                <span>Population: <strong>{place.population ? place.population.toLocaleString("en-IN") : "Recorded in gazetteer"}</strong></span>
                <br />
                <span style={{ fontSize: "11px", color: "#64748B" }}>
                  Coordinates: {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                </span>
              </div>
            </Popup>
            <Tooltip direction="top" offset={[0, -8]} opacity={1}>
              <strong>{place.name}</strong> {place.admin1_name ? `· ${place.admin1_name}` : ""}
            </Tooltip>
          </CircleMarker>
        ))}

        {/* DISTRICT BOUNDARIES (OPTIONAL OVERLAY) */}
        {showBoundaries &&
          boundaries.map((boundary) => {
            const selected = boundary.boundary_id === selectedBoundaryId;
            return (
              <BoundaryFeature
                key={`${boundary.boundary_id}-${boundary.level}`}
                boundary={boundary}
                selected={selected}
                onSelect={onSelectBoundary}
              />
            );
          })}

        {/* COMPETITORS / CANDIDATES */}
        {locations.map((location) => {
          const selected = location.id === selectedLocationId;
          const isComp = location.location_type === "competitor";
          return (
            <CircleMarker
              key={location.id}
              center={[location.latitude, location.longitude]}
              radius={selected ? 11 : 7}
              pathOptions={{
                color: "#FFFFFF",
                weight: 2,
                fillColor: isComp ? "#F87171" : "#34D399",
                fillOpacity: 0.95,
              }}
              eventHandlers={{
                click: () => onSelectLocation(location.id),
              }}
            >
              <Popup>
                <div style={{ color: "#0B1220", fontSize: "13px" }}>
                  <strong>{location.name}</strong> ({isComp ? "Competitor" : "Candidate"})
                  <br />
                  <span>City: {location.city}</span>
                  <br />
                  <span style={{ fontSize: "11px", color: "#64748B" }}>Status: {location.source_status}</span>
                </div>
              </Popup>
              <Tooltip direction="top" offset={[0, -7]} opacity={1}>
                {location.name} · {location.city}
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {tilesUnavailable && (
        <p className="map-tile-warning" role="status">
          Notice: Satellite/Street map tiles could not be fetched. Check network access; coordinates
          and analytical data remain fully operational.
        </p>
      )}

      {/* MAP LEGEND (Requirement 5) */}
      <div className="map-legend" role="group" aria-label="Map legend">
        <strong>Map Indicators</strong>
        <span>
          <i className="legend-dot" style={{ background: "#D6B36A", border: "1px solid #FFF" }} /> Candidate City Center
        </span>
        <span>
          <i className="legend-dot" style={{ background: "#34D399", border: "1px solid #FFF" }} /> Candidate Site
        </span>
        <span>
          <i className="legend-dot" style={{ background: "#F87171", border: "1px solid #FFF" }} /> Competitor Location
        </span>
        <p style={{ marginTop: "6px", fontSize: "11px", color: "#A7B2C4" }}>
          Geographic data uses WGS84 coordinates from GeoNames & geoBoundaries ADM2 district vintage.
        </p>
      </div>
    </div>
  );
}
