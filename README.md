# ExpansionIQ

ExpansionIQ is a retail expansion decision-support workspace for comparing
candidate cities and reviewing category-specific factors. It is organized as a
React/Vite frontend and a FastAPI backend.

## Prerequisites

- Node.js 20 or newer and npm
- Python 3.11 or newer

## Run the backend

From the project root:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API listens on `http://localhost:8000`. Interactive API documentation is
available at `http://localhost:8000/docs`. The default SQLite database is
created at `data/expansioniq.db`.

For a deployed frontend, set `FRONTEND_ORIGINS` to a comma-separated list of
its exact origins before starting Uvicorn. The defaults include Vite's local
development and preview origins.

Run backend tests from `backend/`:

```bash
python -m pytest
```

## Run the frontend

In a second terminal, from the project root:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The Vite development server runs at `http://localhost:5173`. The frontend uses
`VITE_API_BASE_URL` to connect to the backend; the example value is
`http://localhost:8000/api`.

Run the frontend TypeScript and production build checks with:

```bash
npm run build
```

## Market data and scoring

Market factor inputs can be entered in the **Market inputs** page, which stores
city/category values and their source labels in the configured database.
`data/city_factors.csv` remains a supported read-only import source; it contains
only a header by default. Database records take precedence over CSV records for
the same city and category. Comparisons without matching factor data return
unavailable scores. Missing values are not replaced with zeroes or fabricated
estimates.

For a complete score, provide one row per city and category with numeric values
from 0 to 100 for `demand`, `competition_opportunity`, `accessibility`,
`cost_viability`, and `category_fit`. Optional `source`, `source_status`, and
`notes` CSV columns are carried through to comparison results and exports.
`source_status` defaults to `unverified`; labels entered in the UI are user
assertions and are not independently verified. Validate source provenance and
coverage before using an analysis for a business decision.

Candidate and competitor location records can be entered in the area finder
with supplied coordinates and source references. The UI shows their stored
source status but does not independently verify it. The backend calculates
straight-line distances from candidate records to supplied competitor records;
it does not provide road travel distances, neighborhood boundaries, or
opportunity choropleths. The area finder also displays a separate overlay of
GeoNames populated-place points. These are reference place coordinates, not
store candidates and not administrative boundaries. No population value from
GeoNames is used for scoring or shown as a current estimate.

The interactive Leaflet/OpenStreetMap basemap requires network access and
displays map attribution. No map API key is required. The Vite preview origin
must be allowed by `FRONTEND_ORIGINS` for the browser to call the backend.

The data-entry endpoints do not currently require authentication. Keep the
service on a trusted network until authentication and authorization are added
before any public deployment.

The frontend sets `VITE_API_BASE_URL` to `http://localhost:8000/api` when not
configured. Frontend API requests time out after 10 seconds. For a different
backend address, set `VITE_API_BASE_URL` in `frontend/.env`. The backend uses
`DATABASE_URL` for its SQLAlchemy database and defaults to the project SQLite
database; set `FRONTEND_ORIGINS` to the comma-separated browser origins for
deployment. The application has no external data-provider or map credentials
configured.

## Census population data

The project includes `data/PCA11-UA-0000.xlsx`, downloaded from the official
[Census of India catalog record](https://censusindia.gov.in/nada/index.php/catalog/45261)
for *Primary Census Abstract - Urban Agglomeration India - 2011* (reference ID
`PCA11-UA-00`). The `Data` sheet contains 3,319 non-empty place records across
31 state codes in the workbook. The records include Census levels 0–3 and
places where the level is not reported; one record has a missing `TOT_P`
population total. These are 2011 observations, not current estimates. The file
contains no coordinates or neighborhood boundaries.

The Census catalog metadata identifies the Office of the Registrar General &
Census Commissioner, India as producer and links the workbook, but it does not
state a reuse license. ExpansionIQ records this status as
`not_specified_in_catalog`; confirm applicable terms before redistribution or
commercial reuse. No Government Open Data License is assumed.

Import or refresh the workbook from the project root:

```bash
cd backend
python -m app.services.census_import ../data/PCA11-UA-0000.xlsx
```

The importer validates the required columns and population values, reports
invalid and duplicate rows, preserves missing population as `null`, and can be
rerun safely. Imported values are stored separately from retail scoring
factors and are available at `GET /api/census/indicators`. The dashboard
displays the returned Census values with the reference year and source
disclosure; it does not plot these records on the map or use them to calculate
retail expansion scores.

## GeoNames populated-place coordinates

`data/geonames-IN.zip` is the GeoNames country dump for India,
downloaded from [GeoNames](https://download.geonames.org/export/dump/IN.zip).
Its bundled readme declares a **[Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/)**
license,
describes latitude/longitude as WGS84, and says the daily country files can be
used to synchronize records. The imported archive snapshot is dated
2026-10-24; each imported place also retains its own GeoNames modification
date. Those per-record dates range from 2010-01-28 to 2026-10-22 in this
snapshot and are not a shared population reference year.

The importer found 558,015 India records with populated-place feature class
`P`. It imports 7,326 of those with a positive source population field and
valid WGS84 coordinates; records without a positive population field are
excluded. This is a filtered gazetteer, not a complete list of every Indian
village or urban neighborhood. Place names, GeoNames feature codes,
administrative codes, coordinates, source, license, snapshot date, and
record-modified date are retained. The source population field is not used as
a current estimate.

Import or refresh the dump from the project root:

```bash
cd backend
python -m app.services.geonames_import ../data/geonames-IN.zip
```

The `GET /api/geography/places` endpoint supports name and administrative-code
filters. The area finder maps up to 200 matching reference points at a time;
search and administrative-code filters narrow the display. Gold points are
visually distinct from saved candidate and competitor sites. Point coordinates
do not represent administrative boundaries.

## India district-boundary reference layer

`data/geoboundaries-IND-ADM2_simplified.geojson` is the simplified India ADM2
GeoJSON from the pinned [geoBoundaries release](https://www.geoboundaries.org/api/current/gbOpen/IND/ADM2/).
The metadata describes a **2021** district vintage, identifies Pathways Data
Pvt. Ltd. and LGDirectory as the boundary source, and declares the
[Open Data Commons Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
The release metadata records source-data update date 2023-01-19 and build date
2023-12-12. Reuse or redistribution of the resulting boundary database must
respect ODbL attribution and share-alike obligations.

The downloaded simplified GeoJSON actually contains **735 unique ADM2
polygons**, while the source metadata reports 736 units. This discrepancy is
not reconciled, so the map labels the layer incomplete and does not claim
nationwide completeness. The source supplies `shapeID`/`shapeName`, but not
official district codes or state membership; `shapeID` is a source identifier,
not an official administrative code. The application therefore does not infer
state joins, connect these polygons to Census observations, or provide state
polygons. Hover and selection identify the district by its source name and ID.

Import the reviewed snapshot into its own database table without deleting
existing records:

```bash
cd backend
python -m app.services.boundary_import ../data/geoboundaries-IND-ADM2_simplified.geojson
```

Imports validate GeoJSON polygon structure, coordinate bounds, unique source
IDs, and the reviewed exact count of 735 before writing; repeated imports are
idempotent by source ID and pinned release. New release versions are retained
separately; the API serves the latest build date. Before refreshing, compare
source metadata, actual feature counts,
identifiers, vintage, and license; update the review constants and source
version only after verification. The API is `GET /api/geography/boundaries`;
the area finder loads it only when the district-boundary layer is enabled.
The UI attributes geoBoundaries and links the ODbL terms. To provide the
machine-readable data and license metadata, use
`GET /api/geography/boundaries/geojson`; the export includes each feature's
source ID, source, vintage, and license URI.

## Additional source candidates (not imported)

- **Demographic indicators:** The existing [Census 2011 PCA-UA workbook](https://censusindia.gov.in/nada/index.php/catalog/45261)
  also contains household, age 0–6, sex, literacy, worker, and other population
  fields. Its catalog describes India urban-agglomeration/town coverage and
  reference year 2011; actual workbook rows span 31 state codes. The Census
  catalog does not specify reuse terms, so these fields need license review
  before redistribution or commercial use.
- **Town infrastructure:** Census District Census Handbooks and their Town
  Directory tables listed in the official [Census tables catalog](https://censusindia.gov.in/census.website/data/census-tables)
  are official 2011 sources for listed town amenities and services. Coverage
  and table availability vary by handbook/district; this is historical
  infrastructure evidence, not a current service inventory, and reuse terms
  require verification for each resource.
- **Economic indicators:** RBI's [Handbook of Statistics on Indian States](https://www.rbi.org.in/Scripts/AnnualPublications.aspx?head=Handbook%20of%20Statistics%20on%20Indian%20States)
  2024–25 edition includes state-wise domestic-product and population tables.
  Coverage is states/UTs and historical annual series, not city estimates;
  select and record an exact table, unit, and reference year before importing.
  The RBI publication page currently lists its 2024–25 edition; its usage
  terms still need to be checked for any chosen table.
- **Household consumption:** MoSPI's Household Consumption Expenditure Survey
  (HCES) 2023–24 publishes expenditure statistics with state and urban/rural
  dimensions. It does not provide neighborhood-level retail demand; consult
  the [MoSPI publication catalog](https://www.mospi.gov.in/) for the exact
  report/table, use its stated sample scope, and verify microdata access and
  reuse terms before incorporating it.
- **Retail establishments:** MoSPI's Sixth Economic Census (2013–14) reports
  establishments and employment by economic activity at administrative
  levels. Consult the [MoSPI publication catalog](https://www.mospi.gov.in/)
  for the exact table and geographic level. It is potentially relevant to
  retail presence, but is historical; verify identifiers and redistribution
  terms before treating it as a comparable competitor dataset.

The geoBoundaries ADM1 entry declares 2011 while listing 36 units and
post-2011 administrative names; it was rejected because its reference vintage
is inconsistent. Survey of India and Bharat Maps endpoints could not be
retrieved in this environment, so their downloadable data, vintage, and
licenses remain unverified. The imported district layer is the incomplete,
2021-vintage geoBoundaries data documented above.

## Dataset registry and geography audit

The `dataset_registry` table is initialized additively and holds source URL,
license status/URI, attribution, indicators, geographic level, reference
period, units, coverage, local file name, expected schema, quality notes,
blocked reason, and import status. `GET /api/datasets` returns this registry
along with whether each local file exists and its parsed/imported row counts.
Statuses distinguish imported-but-license-review, imported-incomplete,
imported, and blocked sources. A source with unknown terms is labelled unknown;
it is not assigned an assumed open-data license.

`GET /api/geography/audit` reports current database counts and coverage by the
source's own codes. Census state codes and GeoNames administrative codes are
separate code systems; the API does not assert they match. The boundary
dataset currently has no official state/district code, so its state coverage
and official-code join coverage are zero/unknown, not inferred from names.
Normalized name overlaps are diagnostics only, never an automatic join.

An explicit district crosswalk can be loaded only from a reviewed CSV. The
importer in `backend/app/services/district_crosswalk.py` requires the source
boundary ID/version, official state and district codes and names, the separate
Census state/district codes and reference year, evidence reference, reviewer,
and review date. Keeping the two code systems separate prevents an implicit
assumption that two numeric codes mean the same jurisdiction. The importer
validates that each source boundary exists and upserts idempotently. It does
not generate or guess crosswalk rows. The current crosswalk has zero confirmed
mappings. Example column header:

```text
boundary_source_version,boundary_id,official_state_code,official_state_name,official_district_code,official_district_name,census_state_code,census_district_code,census_reference_year,reference_year,match_method,evidence_reference,reviewed_by,reviewed_on
```

`reference_year` is the reviewed official-code reference vintage; the Census
vintage is recorded separately in `census_reference_year`.

`GET /api/geography/boundaries` accepts `state_code`; state filter options and
the boundary's official codes are returned only for reviewed crosswalk rows.
The area finder provides a district selector and enables its state filter only
when such mappings exist. Crosswalk joins are district-parent associations;
they do not turn Census town/urban-agglomeration observations into district
geometry or neighborhood boundaries.

Import a manually reviewed file with:

```bash
cd backend
python -m app.services.district_crosswalk /path/to/reviewed-crosswalk.csv
```

## Proposed score eligibility (not a production ranking)

`POST /api/market-scores/evaluate` implements a versioned evaluator with the
initial configurable weights:

| Component | Weight |
| --- | ---: |
| Demographic demand | 25% |
| Economic strength | 25% |
| Business activity | 20% |
| Retail competition and supply | 15% |
| Accessibility and connectivity | 15% |

Each supplied component must already be a defensible, sourced 0–100
opportunity score. `available` inputs require a source reference. Missing,
suppressed, stale, and unverified inputs are not included as zero; the API
returns no total score unless all five components are available and sourced.
Evidence coverage and eligible coverage are separate weighted percentages.
Component contributions, weights, score version, missing/stale/unverified
inputs, and explanations are returned. All weights are initial business
assumptions, not a statistically validated model. In particular, raw
competitor counts do not directly become a competition-opportunity score:
normalization must be category-aware and account for both demand signal and
saturation. The evaluator is infrastructure only; it is not connected to
production city rankings because the required demographic, economic,
business, and accessibility observations have not been imported.

## Verified imported-data audit (2026-10-25)

The preserved project database contains 3,319 Census 2011 population
observations (3,319 distinct source geography codes; one `TOT_P` value is
missing), 7,326 GeoNames populated-place points, and 735 district boundary
features. Census observations span 31 Census state codes and 389
state/district-code pairs. The audit API lists the exact observed district
codes grouped by each Census state code; it does not claim those 389 codes are
the complete official district inventory. GeoNames points span 36 non-empty GeoNames admin1
codes plus one record with no admin1 code. Its GeoNames admin1 code/name list
is available from `/api/geography/audit`; those codes are not a verified
crosswalk to Census state codes. The district polygons have 735 unique source
IDs, seven repeated names, and no official district codes or state membership.
Source metadata reports 736 features; the missing unit cannot be identified
from this download. No district crosswalk is currently confirmed, and all
3,319 Census geography codes remain unjoined to a district polygon.

The 31 Census state codes present in the actual workbook import are `01`, `02`,
`03`, `04`, `05`, `06`, `07`, `08`, `09`, `10`, `11`, `13`, `14`, `15`, `16`,
`17`, `18`, `19`, `20`, `21`, `22`, `23`, `24`, `27`, `28`, `29`, `30`, `32`,
`33`, `34`, and `35`. Census state and district names are not inferred from the
GeoNames admin1 names. Because no authoritative district inventory or reviewed
crosswalk is available locally, the actual number/names of districts missing
from the boundary layer cannot be computed; the one-feature metadata gap is
unidentified.

The Census workbook and GeoNames archive were downloaded, parsed, and
imported. The boundary GeoJSON was downloaded, validated (735 unique polygon
features), and imported. The Census catalog's 2011 workbook contains other
demographic columns, but only `TOT_P` was imported; no other indicators are
claimed as loaded. In the registry, RBI, MoSPI, data.gov.in/Udyam, OSM business
POIs, Survey of India, Bharat Maps, and Census Town Directory sources are
blocked or awaiting selection/review rather than reported as imported. RBI
state series must remain state-level. OSM points, if later acquired from a
permitted extract, must be attributed and labelled incomplete, not a business
census. ODbL share-alike and attribution duties need to be honored for public
redistribution of the boundary database.

No expansion score or recommendation is derived from Census population or
GeoNames place coordinates. The legacy category comparison endpoint now
withholds scores and ranks unless all five category-specific factors are
present and the factor record is marked verified with a non-empty source
reference. User-provided or unverified factor records remain visible but are
not ranked. The verified flag is an input assertion, not an automated
independent source validation. No such category-factor observations are
currently imported, so the live project database produces no market ranking.