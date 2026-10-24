import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, MapPinned, Plus, RotateCw, Search, Trash2 } from "lucide-react";
import LocationMap from "../components/LocationMap";
import { api } from "../services/api";
import type {
  LocationListResult,
  LocationRecord,
  AdministrativeBoundaryResponse,
  GeographicPlaceResponse,
  RetailCategory,
} from "../types";

type Props = {
  onBack: () => void;
  initialCity?: string;
};

const categories: RetailCategory[] = ["Grocery", "Fashion", "Electronics"];

export default function SiteFinder({ onBack, initialCity = "" }: Props) {
  const [result, setResult] = useState<LocationListResult | null>(null);
  const [placeResult, setPlaceResult] =
    useState<GeographicPlaceResponse | null>(null);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [placeSearchInput, setPlaceSearchInput] = useState("");
  const [placeSearch, setPlaceSearch] = useState("");
  const [placeStateCode, setPlaceStateCode] = useState("");
  const [showPlacePoints, setShowPlacePoints] = useState(true);
  const [showDistrictBoundaries, setShowDistrictBoundaries] = useState(false);
  const [boundaryStateCode, setBoundaryStateCode] = useState("");
  const [boundaryResult, setBoundaryResult] =
    useState<AdministrativeBoundaryResponse | null>(null);
  const [boundaryLoading, setBoundaryLoading] = useState(false);
  const [boundaryError, setBoundaryError] = useState<string | null>(null);
  const [selectedBoundaryId, setSelectedBoundaryId] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState(initialCity);
  const [category, setCategory] = useState<RetailCategory | "">("");
  const [locationType, setLocationType] = useState<"" | "candidate" | "competitor">("");
  const [search, setSearch] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
    null
  );
  const [reloadKey, setReloadKey] = useState(0);
  const [newName, setNewName] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newLocationType, setNewLocationType] =
    useState<"candidate" | "competitor">("candidate");
  const [newCategory, setNewCategory] = useState<RetailCategory>("Grocery");
  const [newLatitude, setNewLatitude] = useState("");
  const [newLongitude, setNewLongitude] = useState("");
  const [newSource, setNewSource] = useState("");
  const [newSourceStatus, setNewSourceStatus] =
    useState<"verified" | "unverified" | "user_provided">("user_provided");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createNotice, setCreateNotice] = useState<string | null>(null);
  const [nearby, setNearby] = useState<
    { name: string; distance_km: number }[]
  >([]);
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setResult(null);
    setError(null);

    api
      .getLocations({
        city: city.trim() || undefined,
        category: category || undefined,
        location_type: locationType || undefined,
      })
      .then((locations) => {
        if (!active) return;
        setResult(locations);
        setSelectedLocationId((current) =>
          locations.locations.some((location) => location.id === current)
            ? current
            : (locations.locations[0]?.id ?? null)
        );
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load location data."
          );
        }
      });

    return () => {
      active = false;
    };
  }, [city, category, locationType, reloadKey]);

  useEffect(() => {
    let active = true;
    setPlaceResult(null);
    setPlaceError(null);

    api
      .getGeographicPlaces({
        search: placeSearch || undefined,
        state_code: placeStateCode || undefined,
        limit: 200,
      })
      .then((places) => {
        if (active) setPlaceResult(places);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setPlaceError(
            requestError instanceof Error
              ? requestError.message
              : "GeoNames place coordinates could not be loaded."
          );
        }
      });

    return () => {
      active = false;
    };
  }, [placeSearch, placeStateCode, reloadKey]);

  useEffect(() => {
    if (!showDistrictBoundaries) return;

    let active = true;
    setBoundaryLoading(true);
    setBoundaryError(null);
    api
      .getAdministrativeBoundaries({
        state_code: boundaryStateCode || undefined,
        limit: 800,
      })
      .then((boundaries) => {
        if (!active) return;
        setBoundaryResult(boundaries);
        setSelectedBoundaryId((current) =>
          boundaries.boundaries.some((item) => item.boundary_id === current)
            ? current
            : null
        );
      })
      .catch((requestError: unknown) => {
        if (active) {
          setBoundaryError(
            requestError instanceof Error
              ? requestError.message
              : "District boundaries could not be loaded."
          );
        }
      })
      .finally(() => {
        if (active) setBoundaryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [showDistrictBoundaries, boundaryStateCode, reloadKey]);

  const visibleLocations = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return result?.locations ?? [];
    return (result?.locations ?? []).filter((location) =>
      `${location.name} ${location.city} ${location.category} ${location.location_type}`
        .toLocaleLowerCase()
        .includes(term)
    );
  }, [result, search]);

  const selectedLocation =
    visibleLocations.find(
      (location) => location.id === selectedLocationId
    ) ?? null;

  function selectLocation(location: LocationRecord) {
    setSelectedLocationId(location.id);
  }

  function searchPlaces(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPlaceSearch(placeSearchInput.trim());
  }

  function filterPlacesByState(stateCode: string) {
    setPlaceStateCode(stateCode);
  }

  useEffect(() => {
    if (!selectedLocation) {
      setNearby([]);
      setNearbyError(null);
      return;
    }

    let active = true;
    setNearbyLoading(true);
    setNearbyError(null);
    api
      .getNearbyLocations(selectedLocation.id)
      .then((result) => {
        if (active) setNearby(result.locations);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setNearbyError(
            requestError instanceof Error
              ? requestError.message
              : "Nearby location analysis could not be loaded."
          );
        }
      })
      .finally(() => {
        if (active) setNearbyLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedLocation?.id]);

  async function addLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError(null);
    setCreateNotice(null);
    setCreateLoading(true);
    try {
      await api.createLocation({
        name: newName.trim(),
        city: newCity.trim(),
        location_type: newLocationType,
        category: newCategory,
        latitude: Number(newLatitude),
        longitude: Number(newLongitude),
        source_name: newSource.trim() || null,
        source_status: newSourceStatus,
        notes: null,
      });
      setCreateNotice("Candidate location saved.");
      setNewName("");
      setNewCity("");
      setNewLatitude("");
      setNewLongitude("");
      setNewSource("");
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setCreateError(
        requestError instanceof Error
          ? requestError.message
          : "Candidate location could not be saved."
      );
    } finally {
      setCreateLoading(false);
    }
  }

  async function removeLocation(location: LocationRecord) {
    setCreateError(null);
    setCreateNotice(null);
    try {
      await api.deleteLocation(location.id);
      setCreateNotice(`${location.name} was deleted.`);
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      setCreateError(
        requestError instanceof Error
          ? requestError.message
          : "Candidate location could not be deleted."
      );
    }
  }

  return (
    <div className="page-content site-finder-page">
      <button className="back-button" type="button" onClick={onBack}>
        <ArrowLeft size={16} /> Back to workspace
      </button>

      <div className="site-finder-heading">
        <div>
          <span className="eyebrow">AREA FINDER</span>
          <h1>Explore candidate locations</h1>
          <p>
            Browse saved retail sites alongside independently sourced
            GeoNames populated-place reference points. Map tiles are provided
            by OpenStreetMap.
          </p>
        </div>
        <span className="location-count">
          {result ? `${visibleLocations.length} locations` : "Loading locations"}
        </span>
      </div>

      <section className="panel location-workspace">
        <form className="candidate-location-form" onSubmit={addLocation}>
          <div className="panel-heading">
            <div>
              <span className="eyebrow">LOCATION DATA</span>
              <h2>Add a candidate location</h2>
              <p className="panel-description">
                Enter actual coordinates and record their source. Status labels
                are user-supplied and are not independently verified.
              </p>
            </div>
          </div>
          <div className="candidate-location-fields">
            <label>
              Location name
              <input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                maxLength={160}
                required
              />
            </label>
            <label>
              City
              <input
                value={newCity}
                onChange={(event) => setNewCity(event.target.value)}
                maxLength={120}
                required
              />
            </label>
            <label>
              Record type
              <select
                value={newLocationType}
                onChange={(event) =>
                  setNewLocationType(event.target.value as typeof newLocationType)
                }
              >
                <option value="candidate">Candidate site</option>
                <option value="competitor">Competitor</option>
              </select>
            </label>
            <label>
              Category
              <select
                value={newCategory}
                onChange={(event) =>
                  setNewCategory(event.target.value as RetailCategory)
                }
              >
                {categories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Latitude
              <input
                type="number"
                min={-90}
                max={90}
                step="any"
                value={newLatitude}
                onChange={(event) => setNewLatitude(event.target.value)}
                required
              />
            </label>
            <label>
              Longitude
              <input
                type="number"
                min={-180}
                max={180}
                step="any"
                value={newLongitude}
                onChange={(event) => setNewLongitude(event.target.value)}
                required
              />
            </label>
            <label>
              Source reference
              <input
                value={newSource}
                onChange={(event) => setNewSource(event.target.value)}
                maxLength={500}
                placeholder="Dataset, URL, or field note"
              />
            </label>
            <label>
              Source status
              <select
                value={newSourceStatus}
                onChange={(event) =>
                  setNewSourceStatus(
                    event.target.value as typeof newSourceStatus
                  )
                }
              >
                <option value="user_provided">User provided</option>
                <option value="unverified">Unverified</option>
                <option value="verified">Verified</option>
              </select>
            </label>
          </div>
          <div className="form-actions">
            <span className="field-help">
              Straight-line distances use the supplied coordinates.
            </span>
            <button
              className="primary-button"
              type="submit"
              disabled={createLoading}
            >
              <Plus size={16} /> {createLoading ? "Saving..." : "Save location"}
            </button>
          </div>
          {createError && <p className="error-message" role="alert">{createError}</p>}
          {createNotice && <p className="success-message" role="status">{createNotice}</p>}
        </form>

        <div className="location-filter-bar" aria-label="Location filters">
          <label className="location-filter search-filter">
            <span>Search results</span>
            <span className="search-input-wrap">
              <Search size={16} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search locations or cities"
                aria-label="Search locations or cities"
              />
            </span>
          </label>
          <label className="location-filter">
            <span>Filter city</span>
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Any city"
              aria-label="Filter by city"
            />
          </label>
          <label className="location-filter">
            <span>Retail category</span>
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as RetailCategory | "")
              }
              aria-label="Filter by retail category"
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="location-filter">
            <span>Record type</span>
            <select
              value={locationType}
              onChange={(event) =>
                setLocationType(
                  event.target.value as "" | "candidate" | "competitor"
                )
              }
              aria-label="Filter by location type"
            >
              <option value="">All record types</option>
              <option value="candidate">Candidate sites</option>
              <option value="competitor">Competitors</option>
            </select>
          </label>
          <button
            type="button"
            className="secondary-button location-refresh"
            onClick={() => setReloadKey((key) => key + 1)}
            disabled={result === null && error === null}
          >
            <RotateCw size={15} /> Refresh
          </button>
        </div>

        <form
          className="geo-place-filter-bar"
          onSubmit={searchPlaces}
          aria-label="GeoNames reference place filters"
        >
          <div className="geo-place-source">
            <strong>GeoNames place reference points</strong>
            <span>
              {placeResult
                ? `${placeResult.count.toLocaleString("en-IN")} mapped points; ${placeResult.total.toLocaleString("en-IN")} match current filters (up to 200 shown)`
                : placeError
                  ? "Place reference data unavailable"
                  : "Loading place reference data"}
              {placeResult?.snapshot_date
                ? ` · snapshot ${placeResult.snapshot_date}`
                : ""}
            </span>
          </div>
          <label className="location-filter">
            Search reference places
            <span className="search-input-wrap">
              <Search size={15} aria-hidden="true" />
              <input
                type="search"
                value={placeSearchInput}
                onChange={(event) => setPlaceSearchInput(event.target.value)}
                placeholder="e.g. Pune"
                aria-label="Search GeoNames place points"
              />
            </span>
          </label>
          <label className="location-filter">
            State / UT
            <select
              value={placeStateCode}
              onChange={(event) => filterPlacesByState(event.target.value)}
              aria-label="Filter GeoNames points by state or union territory"
            >
              <option value="">All available codes</option>
              {(placeResult?.state_options ?? []).map((option) => (
                <option value={option.code} key={option.code}>
                  {option.name} ({option.code})
                </option>
              ))}
            </select>
          </label>
          <button className="secondary-button" type="submit">
            Search places
          </button>
        </form>

        {placeError && (
          <div className="location-error" role="alert">
            <p>{placeError}</p>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setReloadKey((key) => key + 1)}
            >
              Retry
            </button>
          </div>
        )}
        {placeResult && placeResult.data_status === "unavailable" && (
          <p className="location-state-message" role="status">
            GeoNames place coordinates have not been imported. Saved retail
            location records remain separate.
          </p>
        )}
        {placeResult && (
          <p className="geo-place-attribution">
            Coordinates:{" "}
            <a href={placeResult.source_url} target="_blank" rel="noreferrer">
              {placeResult.source_name}
            </a>{" "}
            ·{" "}
            <a href={placeResult.license_url} target="_blank" rel="noreferrer">
              {placeResult.license_status}
            </a>
            . GeoNames record populations are
            not displayed or used as current market estimates.
          </p>
        )}

        {error && (
          <div className="location-error" role="alert">
            <p>{error}</p>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setReloadKey((key) => key + 1)}
            >
              Retry
            </button>
          </div>
        )}

        <div className="location-analysis-grid">
          <div className="location-map-column">
            <div className="location-section-heading">
              <div>
                <h2>Location map</h2>
                <p>
                  {result?.data_status === "available"
                    ? `Select a saved retail marker to view its details.${showPlacePoints ? " GeoNames points are enabled." : ""}${showDistrictBoundaries ? " District boundaries are enabled." : ""}`
                    : (showPlacePoints && placeResult?.places.length) ||
                        (showDistrictBoundaries &&
                          boundaryResult?.boundaries.length)
                      ? "No saved retail sites match; enabled geographic reference layers are shown separately."
                      : "No geographic records are available for the current filters."}
                </p>
              </div>
              <MapPinned size={19} />
            </div>
            <div className="map-layer-controls" aria-label="Map layers">
              <label>
                <input
                  type="checkbox"
                  checked={showPlacePoints}
                  onChange={(event) => setShowPlacePoints(event.target.checked)}
                />
                GeoNames place points
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={showDistrictBoundaries}
                  onChange={(event) =>
                    setShowDistrictBoundaries(event.target.checked)
                  }
                />
                District boundaries (2021)
              </label>
              {showDistrictBoundaries && boundaryResult && (
                <span className="map-layer-status">
                  {boundaryResult.count.toLocaleString("en-IN")} shown of{" "}
                  {boundaryResult.total.toLocaleString("en-IN")} imported
                </span>
              )}
              {showDistrictBoundaries && boundaryLoading && (
                <span className="map-layer-status" role="status">
                  Loading boundary features...
                </span>
              )}
            </div>
            {showDistrictBoundaries && boundaryError && (
              <div className="location-error" role="alert">
                <p>{boundaryError}</p>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setReloadKey((key) => key + 1)}
                >
                  Retry
                </button>
              </div>
            )}
            {showDistrictBoundaries && boundaryResult && (
              <div className="boundary-source-notice">
                <p role="note">
                  {boundaryResult.coverage_note}
                </p>
                <p>
                  {boundaryResult.reference_year} vintage · source data updated{" "}
                  {boundaryResult.source_data_updated_on} · built{" "}
                  {boundaryResult.build_date} ·{" "}
                  <a
                    href={boundaryResult.source_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {boundaryResult.source_name}
                  </a>{" "}
                  from {boundaryResult.boundary_source} ·{" "}
                  <a
                    href={boundaryResult.license_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {boundaryResult.license_status}
                  </a>
                </p>
                <p>
                  Contains information from{" "}
                  <a
                    href={boundaryResult.source_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {boundaryResult.source_name}
                  </a>
                  , made available under the{" "}
                  <a
                    href={boundaryResult.license_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Database License (ODbL)
                  </a>
                  .{" "}
                  <a
                    href={boundaryResult.database_download_url}
                    download="expansioniq-india-district-boundaries.geojson"
                  >
                    Download the machine-readable boundary dataset
                  </a>
                  .
                </p>
                {boundaryResult.boundaries.length > 0 && (
                  <label className="district-select">
                    State or union territory
                    <select
                      value={boundaryStateCode}
                      disabled={boundaryResult.state_options.length === 0}
                      aria-label="Filter boundaries by state"
                      onChange={(event) =>
                        setBoundaryStateCode(event.target.value)
                      }
                    >
                      <option value="">All available districts</option>
                      {boundaryResult.state_options.map((option) => (
                        <option key={option.code} value={option.code}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {boundaryResult.state_options.length === 0 &&
                  boundaryResult.boundaries.length > 0 && (
                    <p className="map-layer-status" role="note">
                      State filtering is unavailable until reviewed state and
                      district crosswalks are imported.
                    </p>
                  )}
                {boundaryResult.boundaries.length > 0 && (
                  <label className="district-select">
                    Select an imported district
                    <select
                      value={selectedBoundaryId ?? ""}
                      onChange={(event) =>
                        setSelectedBoundaryId(event.target.value || null)
                      }
                    >
                      <option value="">No district selected</option>
                      {boundaryResult.boundaries.map((boundary) => (
                        <option
                          value={boundary.boundary_id}
                          key={boundary.boundary_id}
                        >
                          {boundary.name} · source ID {boundary.boundary_id}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            )}
            <LocationMap
              locations={visibleLocations}
              places={showPlacePoints ? placeResult?.places ?? [] : []}
              boundaries={
                showDistrictBoundaries
                  ? boundaryResult?.boundaries ?? []
                  : []
              }
              selectedLocationId={selectedLocationId}
              selectedBoundaryId={selectedBoundaryId}
              onSelectLocation={setSelectedLocationId}
              onSelectBoundary={setSelectedBoundaryId}
            />
            {selectedBoundaryId && showDistrictBoundaries && (
              <p className="location-state-message" role="status">
                Selected district:{" "}
                {boundaryResult?.boundaries.find(
                  (item) => item.boundary_id === selectedBoundaryId
                )?.name ?? selectedBoundaryId}
              </p>
            )}
            {visibleLocations.length === 0 && !error && (
              <div className="map-empty-state" role="status">
                {search
                  ? "No locations match the current search."
                  : result?.data_status === "unavailable"
                  ? (showPlacePoints && placeResult?.places.length) ||
                    (showDistrictBoundaries &&
                      boundaryResult?.boundaries.length)
                    ? "No candidate sites are saved. Enabled geographic reference layers are shown separately and are not retail locations."
                    : "No candidate locations are saved for these filters. Add records above to map them."
                  : "No locations match the selected filters."}
              </div>
            )}
          </div>

          <aside className="location-results-column">
            <div className="location-section-heading">
              <div>
                <h2>Saved locations</h2>
                <p>
                  {result
                    ? `${result.count} returned by the data source`
                    : "Waiting for location data"}
                </p>
              </div>
            </div>

            {result === null && !error ? (
              <p className="location-state-message" role="status">
                Loading location records...
              </p>
            ) : visibleLocations.length === 0 ? (
              <p className="location-state-message" role="status">
                {search
                  ? "No locations match this search."
                  : "No candidate location records are available."}
              </p>
            ) : (
              <div className="location-result-list">
                {visibleLocations.map((location) => (
                  <button
                    className={`location-result-card${selectedLocationId === location.id ? " selected" : ""}`}
                    key={location.id}
                    type="button"
                    onClick={() => selectLocation(location)}
                    aria-pressed={selectedLocationId === location.id}
                  >
                    <span
                      className={`location-result-indicator${location.location_type === "competitor" ? " competitor" : location.source_status === "verified" ? " verified" : ""}`}
                    />
                    <span className="location-result-copy">
                      <strong>{location.name}</strong>
                      <span>
                        {location.city} · {location.category} · {location.location_type}
                      </span>
                      <small>
                        {location.source_status.replaceAll("_", " ")}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {selectedLocation && (
              <div className="location-detail-card" aria-live="polite">
                <span className="eyebrow">LOCATION DETAILS</span>
                <h3>{selectedLocation.name}</h3>
                <dl>
                  <div>
                    <dt>City</dt>
                    <dd>{selectedLocation.city}</dd>
                  </div>
                  <div>
                    <dt>Record type</dt>
                    <dd>{selectedLocation.location_type}</dd>
                  </div>
                  <div>
                    <dt>Category</dt>
                    <dd>{selectedLocation.category}</dd>
                  </div>
                  <div>
                    <dt>Coordinates</dt>
                    <dd>
                      {selectedLocation.latitude.toFixed(5)},{" "}
                      {selectedLocation.longitude.toFixed(5)}
                    </dd>
                  </div>
                  <div>
                    <dt>Source status</dt>
                    <dd>
                      {selectedLocation.source_status.replaceAll("_", " ")}
                    </dd>
                  </div>
                  {selectedLocation.source_name && (
                    <div>
                      <dt>Source reference</dt>
                      <dd>{selectedLocation.source_name}</dd>
                    </div>
                  )}
                </dl>
                <div className="nearby-analysis">
                  <strong>
                    Nearby {selectedLocation.location_type === "candidate" ? "competitors" : "candidate sites"}
                  </strong>
                  {nearbyLoading ? (
                    <span role="status">Calculating distances...</span>
                  ) : nearbyError ? (
                    <span className="error-text" role="alert">{nearbyError}</span>
                  ) : nearby.length ? (
                    nearby.map((item) => (
                      <span key={item.name}>
                        {item.name} · {item.distance_km.toFixed(2)} km
                      </span>
                    ))
                  ) : (
                    <span>
                      No {selectedLocation.location_type === "candidate" ? "competitor records" : "candidate sites"} within 10 km.
                    </span>
                  )}
                  <small>Distances are straight-line, not road distances.</small>
                </div>
                <button
                  className="secondary-button location-delete-button"
                  type="button"
                  onClick={() => void removeLocation(selectedLocation)}
                >
                  <Trash2 size={15} /> Delete location
                </button>
              </div>
            )}
          </aside>
        </div>

        <p className="map-data-disclaimer">
          Map tiles © OpenStreetMap contributors. Candidate and competitor
          markers are shown only when supplied to the configured data source.
          Competitor and candidate points use supplied coordinates. Neighborhood
          boundaries and area opportunity scores are not currently available.
          The optional district overlay is an incomplete 2021 reference dataset,
          not a verified current administrative register; no state polygons or
          official district-code joins are provided.
        </p>
      </section>
    </div>
  );
}
