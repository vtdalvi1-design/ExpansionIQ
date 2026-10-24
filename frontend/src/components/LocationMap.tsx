import { useEffect, useState } from "react";
import L, { type LeafletMouseEvent } from "leaflet";
import type { Feature } from "geojson";
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import type { LocationRecord } from "../types";
import type {
  AdministrativeBoundary,
  GeographicPlaceRecord,
} from "../types";

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
      map.setView(points[0], 12);
      return;
    }

    map.fitBounds(points, { padding: [36, 36], maxZoom: 12 });
  }, [locations, places, map]);

  return null;
}

function ResetView() {
  const map = useMap();

  return (
    <button
      type="button"
      className="map-reset-button"
      onClick={() => map.setView([22, 78], 4)}
    >
      Reset map
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
      layer.setStyle({ color: "#ad7929", weight: 2.5, fillOpacity: 0.18 });
      layer.bringToFront();
    }
  }

  function resetStyle(event: LeafletMouseEvent) {
    const layer = event.target;
    if (layer instanceof L.Path) {
      layer.setStyle({
        color: selected ? "#ad7929" : "#475467",
        weight: selected ? 2.5 : 1,
        fillColor: selected ? "#d9ab55" : "#cbd5e1",
        fillOpacity: selected ? 0.24 : 0.035,
      });
    }
  }

  return (
    <GeoJSON
      data={feature}
      style={{
        color: selected ? "#ad7929" : "#475467",
        weight: selected ? 2.5 : 1,
        fillColor: selected ? "#d9ab55" : "#cbd5e1",
        fillOpacity: selected ? 0.24 : 0.035,
      }}
      eventHandlers={{
        click: select,
        mouseover: highlight,
        mouseout: resetStyle,
      }}
    >
      <Tooltip sticky>
        {boundary.name} · India district boundary (ADM2), 2021
        {" · source ID "}
        {boundary.boundary_id}
      </Tooltip>
    </GeoJSON>
  );
}

function FitSelectedBoundary({
  boundaries,
  selectedBoundaryId,
}: {
  boundaries: AdministrativeBoundary[];
  selectedBoundaryId: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    const boundary = boundaries.find(
      (item) => item.boundary_id === selectedBoundaryId
    );
    if (!boundary) return;
    const layer = L.geoJSON(boundary.geometry);
    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 9 });
    }
  }, [boundaries, map, selectedBoundaryId]);

  return null;
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
  const [tilesUnavailable, setTilesUnavailable] = useState(false);

  return (
    <div className="location-map-frame">
      <MapContainer
        center={[22, 78]}
        zoom={4}
        minZoom={3}
        maxZoom={18}
        scrollWheelZoom
        keyboard
        className="location-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            load: () => setTilesUnavailable(false),
            tileerror: () => setTilesUnavailable(true),
          }}
        />
        <FitLocations locations={locations} places={places} />
        <ResetView />
        {places.map((place) => (
          <CircleMarker
            key={place.geoname_id}
            center={[place.latitude, place.longitude]}
            radius={4}
            pathOptions={{
              color: "#ffffff",
              weight: 1,
              fillColor: "#c2852d",
              fillOpacity: 0.78,
            }}
          >
            <Tooltip direction="top" offset={[0, -5]} opacity={1}>
              {place.name}
              {place.admin1_name ? ` · ${place.admin1_name}` : ""}
              {" · GeoNames populated-place point"}
            </Tooltip>
          </CircleMarker>
        ))}
        {boundaries.map((boundary) => {
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
        <FitSelectedBoundary
          boundaries={boundaries}
          selectedBoundaryId={selectedBoundaryId}
        />
        {locations.map((location) => {
          const selected = location.id === selectedLocationId;
          return (
            <CircleMarker
              key={location.id}
              center={[location.latitude, location.longitude]}
              radius={selected ? 10 : 7}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor:
                  location.location_type === "competitor"
                    ? "#e58a3a"
                    : location.source_status === "verified"
                      ? "#138f76"
                      : "#596ce1",
                fillOpacity: 0.94,
              }}
              eventHandlers={{
                click: () => onSelectLocation(location.id),
              }}
            >
              <Tooltip direction="top" offset={[0, -7]} opacity={1}>
                {location.name} · {location.city}
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
      {tilesUnavailable && (
        <p className="map-tile-warning" role="status">
          Map tiles could not be loaded. Check your network connection; location
          records remain available in the list.
        </p>
      )}
      <div className="map-legend" aria-label="Map legend">
        <strong>Location types</strong>
        <span><i className="legend-dot geo-place" /> GeoNames place point</span>
        <span><i className="legend-dot district-boundary" /> District boundary (2021)</span>
        <span>
          <i className="legend-dot verified" /> Candidate
        </span>
        <span>
          <i className="legend-dot other" /> Other candidate
        </span>
        <span><i className="legend-dot competitor" /> Competitor</span>
        <p>GeoNames dots are reference points, not store sites or boundaries. District polygons are an incomplete 2021 reference layer and do not include official district codes.</p>
      </div>
    </div>
  );
}
