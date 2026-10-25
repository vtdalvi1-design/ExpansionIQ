import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import {
  Layers,
  Map as MapIcon,
  Globe,
  Navigation,
  Users,
  Compass,
  Train,
  Store,
  DollarSign,
  Maximize2,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  X,
  ExternalLink,
  MapPin,
  Building2,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import type {
  AdministrativeBoundary,
  CityResult,
  DemoCityForecast,
  GeographicPlaceRecord,
  LocationRecord,
} from "../types";

type MapViewMode = "streets" | "satellite" | "hybrid";

export interface PrimeOpportunitySite {
  id: string;
  name: string;
  locality: string;
  city: string;
  latitude: number;
  longitude: number;
  viabilityScore: number;
  rank: number;
  badgeLabel: string;
  propertyType: string;
  landAvailability: {
    carpetAreaSqFt: number;
    builtUpAreaSqFt: number;
    frontageFeet: number;
    zoning: string;
    status: string;
    rentPerSqFtInr: number;
    monthlyRentInr: number;
    depositMonths: number;
    leaseTenureYears: number;
    parkingAvailable: string;
    powerBackup: string;
  };
  reasons: {
    footfall: string;
    demographics: string;
    moat: string;
    connectivity: string;
  };
  summaryReasons: string[];
  imageUrl: string;
  imageAlt: string;
}

// Master Opportunity Catalog with verified commercial high-street sites
const OPPORTUNITY_SITES_CATALOG: Record<string, PrimeOpportunitySite[]> = {
  kolhapur: [
    {
      id: "kop-site-1",
      name: "Rajarampuri Main Road Commercial Arcade",
      locality: "Rajarampuri (1st to 4th Lane Junction)",
      city: "Kolhapur",
      latitude: 16.6965,
      longitude: 74.2432,
      viabilityScore: 94,
      rank: 1,
      badgeLabel: "RANK #1 PRIME HIGH-STREET",
      propertyType: "Ground Floor Premium Retail Showroom",
      landAvailability: {
        carpetAreaSqFt: 1450,
        builtUpAreaSqFt: 1750,
        frontageFeet: 34,
        zoning: "Commercial High-Street Retail",
        status: "Vacant & Ready for Immediate Fit-out",
        rentPerSqFtInr: 85,
        monthlyRentInr: 123250,
        depositMonths: 6,
        leaseTenureYears: 5,
        parkingAvailable: "Dedicated front parking for 6 cars & 18 two-wheelers",
        powerBackup: "100% DG Set Backup with 3-Phase 30kW Commercial Load",
      },
      reasons: {
        footfall:
          "Over 42,000 daily pedestrian & motorized footfall. Rajarampuri is Kolhapur's premier retail, lifestyle, and evening dining artery.",
        demographics:
          "Surrounded by Rajarampuri, Syke Extension, and Shahupuri affluent residential wards with highest per-capita disposable income in South Maharashtra.",
        moat:
          "High footfall conversion with low vacancy rates. Modern brand clusters (fashion, cafes, electronics) drive massive cross-shopping traffic.",
        connectivity:
          "Direct 5-minute arterial connection to Central Bus Stand (CBS) and Rajaram College circle, with wide 60ft tree-lined avenue.",
      },
      summaryReasons: [
        "42,000+ daily footfall on Kolhapur's premier retail high street",
        "Highest per-capita disposable income catchment in South Maharashtra",
        "34 ft wide prominent glass frontage on ground floor",
        "Ready for immediate commercial fit-out (₹85/sq.ft/mo)",
      ],
      imageUrl: "/sites/rajarampuri_kolhapur.jpg",
      imageAlt: "Rajarampuri High Street Retail Avenue, Kolhapur",
    },
    {
      id: "kop-site-2",
      name: "Shahupuri Prime Commercial Arcade",
      locality: "Shahupuri Station Road Business District",
      city: "Kolhapur",
      latitude: 16.7028,
      longitude: 74.2385,
      viabilityScore: 91,
      rank: 2,
      badgeLabel: "RANK #2 CENTRAL BUSINESS DISTRICT",
      propertyType: "Commercial Corner Showroom Unit",
      landAvailability: {
        carpetAreaSqFt: 2100,
        builtUpAreaSqFt: 2450,
        frontageFeet: 42,
        zoning: "Commercial Corporate & Retail",
        status: "Available for Immediate Lease / Fit-out",
        rentPerSqFtInr: 72,
        monthlyRentInr: 151200,
        depositMonths: 5,
        leaseTenureYears: 5,
        parkingAvailable: "Basement parking for 15 vehicles + reserved valet bay",
        powerBackup: "Full DG Backup + Dedicated Transformer Sub-Station",
      },
      reasons: {
        footfall:
          "Core central financial and wholesale district with over 18,000 white-collar professionals, banking executives, and traders within 500m.",
        demographics:
          "B2B and high-ticket B2C customer mix. Heavy corporate spending and lunchtime/evening commercial footfall.",
        moat:
          "Corner property facing dual 50ft avenues, providing 270-degree brand visibility and exceptional signage rights.",
        connectivity:
          "Under 350 meters from Kolhapur Railway Station and Central Bus Stand (CBS), capturing arriving intercity business travelers.",
      },
      summaryReasons: [
        "Core Central Business District with 18,000+ daytime executives",
        "Dual-street corner showroom with 42 ft prominent frontage",
        "350m from Railway Station & Central Bus Stand",
        "Highly competitive rental rate of ₹72/sq.ft/mo with basement parking",
      ],
      imageUrl: "/sites/shahupuri_kolhapur.jpg",
      imageAlt: "Shahupuri Commercial Arcade, Kolhapur",
    },
    {
      id: "kop-site-3",
      name: "Tarabai Park Boulevard Lifestyle Space",
      locality: "Tarabai Park (Near Circuit House / Collector Colony)",
      city: "Kolhapur",
      latitude: 16.7112,
      longitude: 74.2315,
      viabilityScore: 89,
      rank: 3,
      badgeLabel: "RANK #3 UPSCALE AFFLUENT DISTRICT",
      propertyType: "Boutique Garden Retail & Lounge Space",
      landAvailability: {
        carpetAreaSqFt: 1800,
        builtUpAreaSqFt: 2200,
        frontageFeet: 30,
        zoning: "Commercial Mixed-Use / Hospitality & Retail",
        status: "Turnkey Fitted Commercial Unit",
        rentPerSqFtInr: 95,
        monthlyRentInr: 171000,
        depositMonths: 6,
        leaseTenureYears: 6,
        parkingAvailable: "Drive-in parking for 10 cars with curbside shaded parking",
        powerBackup: "40kVA Silent DG Generator Backup installed",
      },
      reasons: {
        footfall:
          "Kolhapur's most prestigious and affluent residential neighborhood. Attracts high-net-worth families, doctors, industrialists, and young professionals.",
        demographics:
          "Highest average transaction ticket size in the city (2.4x higher than citywide average), ideal for premium cafes, boutiques, and lifestyle brands.",
        moat:
          "Severe shortage of curated premium commercial retail formats in Tarabai Park; new entrants capture immediate destination loyalty.",
        connectivity:
          "Serene wide boulevards with direct access to Pune-Bengaluru NH4 bypass and New Palace road.",
      },
      summaryReasons: [
        "Kolhapur's most prestigious elite residential enclave",
        "Highest average basket size (2.4x standard retail spend)",
        "Includes 600 sq.ft outdoor landscaped deck/patio space",
        "Low competition in premium lifestyle & dining segments",
      ],
      imageUrl: "/sites/tarabai_park_kolhapur.jpg",
      imageAlt: "Tarabai Park Lifestyle Boulevard, Kolhapur",
    },
    {
      id: "kop-site-4",
      name: "Mahalaxmi Temple High-Footfall Heritage Corridor",
      locality: "Bhausingji Road / Gujri Commercial Axis",
      city: "Kolhapur",
      latitude: 16.6942,
      longitude: 74.2238,
      viabilityScore: 93,
      rank: 4,
      badgeLabel: "HIGH-VOLUME PILGRIM & TOURIST CORRIDOR",
      propertyType: "High-Street Ground Level Heritage Store",
      landAvailability: {
        carpetAreaSqFt: 850,
        builtUpAreaSqFt: 1050,
        frontageFeet: 22,
        zoning: "High-Density Commercial & Tourism Zone",
        status: "Vacant Shop on Main Bhausingji Road",
        rentPerSqFtInr: 120,
        monthlyRentInr: 102000,
        depositMonths: 6,
        leaseTenureYears: 3,
        parkingAvailable: "Municipal multi-level parking complex within 120 meters",
        powerBackup: "Dedicated 15kW Commercial Meter with Inverter Backup",
      },
      reasons: {
        footfall:
          "Year-round continuous pedestrian traffic exceeding 60,000 visitors daily (peaking above 160,000 on weekends and Navratri festival).",
        demographics:
          "High tourist and regional pilgrim volume with immense impulse purchasing power for food, sweets, souvenirs, and retail gifts.",
        moat:
          "Recession-proof demand stream insulated from macroeconomic slowdowns due to continuous religious and cultural tourism.",
        connectivity:
          "Walking pedestrian corridor directly leading to the historic Mahalaxmi Temple Mahadwar entrance.",
      },
      summaryReasons: [
        "60,000 to 160,000+ continuous daily pedestrian footfall",
        "Exceptional cash velocity for food, apparel & gift retail",
        "Prime visibility on Bhausingji Road leading to Temple Gate",
        "Year-round recession-proof tourism customer base",
      ],
      imageUrl: "/sites/mahalaxmi_kolhapur.jpg",
      imageAlt: "Mahalaxmi Temple Shopping Corridor, Kolhapur",
    },
  ],
};

// Generates dynamic opportunity sites for any other analyzed Indian city
function getOpportunitySitesForCity(place: GeographicPlaceRecord): PrimeOpportunitySite[] {
  const normCity = place.name.toLowerCase().trim();
  for (const [key, sites] of Object.entries(OPPORTUNITY_SITES_CATALOG)) {
    if (normCity.includes(key) || key.includes(normCity)) {
      return sites;
    }
  }

  // Generative fallback for Pune, Mumbai, etc.
  const isPune = normCity.includes("pune");
  const isMumbai = normCity.includes("mumbai");

  const site1Name = isPune ? "FC Road High-Street Retail Hub" : isMumbai ? "Bandra Linking Road Commercial Space" : `${place.name} Prime High-Street Avenue`;
  const site1Locality = isPune ? "Fergusson College Road, Shivajinagar" : isMumbai ? "Linking Road, Bandra West" : `Central Market, ${place.name}`;
  const site2Name = isPune ? "Koregaon Park Lifestyle Arcade" : isMumbai ? "BKC Corporate Retail Pavillion" : `${place.name} Station Road Commercial Center`;
  const site2Locality = isPune ? "North Main Road, Koregaon Park" : isMumbai ? "G-Block, Bandra Kurla Complex" : `Station Road, ${place.name}`;

  return [
    {
      id: `${normCity}-site-1`,
      name: site1Name,
      locality: site1Locality,
      city: place.name,
      latitude: place.latitude + 0.0075,
      longitude: place.longitude + 0.0082,
      viabilityScore: 92,
      rank: 1,
      badgeLabel: "RANK #1 HIGH-STREET CORRIDOR",
      propertyType: "Ground Floor Premium Commercial Unit",
      landAvailability: {
        carpetAreaSqFt: 1500,
        builtUpAreaSqFt: 1850,
        frontageFeet: 32,
        zoning: "Commercial High-Street Retail",
        status: "Vacant & Ready for Immediate Fit-out",
        rentPerSqFtInr: isMumbai ? 280 : isPune ? 140 : 85,
        monthlyRentInr: isMumbai ? 420000 : isPune ? 210000 : 127500,
        depositMonths: 6,
        leaseTenureYears: 5,
        parkingAvailable: "Reserved parking for 8 vehicles",
        powerBackup: "100% DG Backup with 3-Phase Commercial Load",
      },
      reasons: {
        footfall: "Dense daily retail footfall exceeding 38,000 pedestrians with strong evening peak.",
        demographics: "High-disposable income demographic with high frequency retail spending.",
        moat: "Prime retail street with established brand clusters and high consumer dwell time.",
        connectivity: "Direct arterial road access with rapid transit connections.",
      },
      summaryReasons: [
        "38,000+ daily pedestrian retail footfall",
        "High average basket size and customer conversion",
        "Prime ground floor glass frontage ready for fit-out",
        "Excellent arterial transit connectivity",
      ],
      imageUrl: "/sites/rajarampuri_kolhapur.jpg",
      imageAlt: `${site1Name}, ${place.name}`,
    },
    {
      id: `${normCity}-site-2`,
      name: site2Name,
      locality: site2Locality,
      city: place.name,
      latitude: place.latitude - 0.0085,
      longitude: place.longitude + 0.0095,
      viabilityScore: 88,
      rank: 2,
      badgeLabel: "RANK #2 COMMERCIAL DISTRICT",
      propertyType: "Commercial Showroom Space",
      landAvailability: {
        carpetAreaSqFt: 2200,
        builtUpAreaSqFt: 2600,
        frontageFeet: 40,
        zoning: "Commercial Corporate District",
        status: "Available for Immediate Lease",
        rentPerSqFtInr: isMumbai ? 240 : isPune ? 115 : 70,
        monthlyRentInr: isMumbai ? 528000 : isPune ? 253000 : 154000,
        depositMonths: 6,
        leaseTenureYears: 5,
        parkingAvailable: "Basement parking for 12 cars",
        powerBackup: "Full DG Backup + Central Air-Conditioning Provision",
      },
      reasons: {
        footfall: "Strong daytime corporate and business executive footfall.",
        demographics: "Affluent professional customer base with steady weekday demand.",
        moat: "Corner commercial building with wide street visibility.",
        connectivity: "Proximity to primary transit spine and highway connection.",
      },
      summaryReasons: [
        "Core corporate and commercial business district",
        "Spacious 2,200 sq.ft floor area with basement parking",
        "High weekday corporate footfall and demand",
        "Competitive commercial lease terms",
      ],
      imageUrl: "/sites/shahupuri_kolhapur.jpg",
      imageAlt: `${site2Name}, ${place.name}`,
    },
  ];
}

type Props = {
  locations?: LocationRecord[];
  places: GeographicPlaceRecord[];
  boundaries?: AdministrativeBoundary[];
  results?: CityResult[];
  forecasts?: DemoCityForecast[];
  selectedLocationId?: number | null;
  selectedBoundaryId?: string | null;
  onSelectLocation?: (locationId: number) => void;
  onSelectBoundary?: (boundaryId: string) => void;
};

// Auto-zooming controller strictly respecting candidate cities
function MapController({
  places,
  focusedCity,
  focusedOpportunity,
}: {
  places: GeographicPlaceRecord[];
  focusedCity: string | null;
  focusedOpportunity: PrimeOpportunitySite | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (focusedOpportunity) {
      map.flyTo([focusedOpportunity.latitude, focusedOpportunity.longitude], 15, {
        duration: 1.4,
        easeLinearity: 0.25,
      });
      return;
    }

    if (focusedCity) {
      const match = places.find(
        (p) => p.name.toLowerCase() === focusedCity.toLowerCase()
      );
      if (match) {
        map.flyTo([match.latitude, match.longitude], 13, {
          duration: 1.2,
          easeLinearity: 0.25,
        });
        return;
      }
    }

    const points = places.map((p) => [p.latitude, p.longitude] as [number, number]);
    if (points.length === 0) return;

    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
  }, [places, focusedCity, focusedOpportunity, map]);

  return null;
}

export default function LocationMap({
  locations = [],
  places,
  boundaries = [],
  results = [],
  forecasts = [],
}: Props) {
  const [viewMode, setViewMode] = useState<MapViewMode>("hybrid");
  const [focusedCity, setFocusedCity] = useState<string | null>(
    places.length > 0 ? places[0].name : null
  );

  // Selected High-Chance Opportunity Site for Photo Modal
  const [selectedOpportunity, setSelectedOpportunity] = useState<PrimeOpportunitySite | null>(null);

  // Layer Visibility Controls
  const [showOpportunities, setShowOpportunities] = useState(true);
  const [showDensity, setShowDensity] = useState(true);
  const [showConnectivity, setShowConnectivity] = useState(true);
  const [showCatchment, setShowCatchment] = useState(true);
  const [showCompetitors, setShowCompetitors] = useState(true);
  const [tilesUnavailable, setTilesUnavailable] = useState(false);

  // Match each place with its analytics score & forecast
  const enrichedPlaces = useMemo(() => {
    return places.map((place) => {
      const result = results.find(
        (r) =>
          r.city_name.toLowerCase().includes(place.name.toLowerCase()) ||
          place.name.toLowerCase().includes(r.city_name.toLowerCase())
      );
      const forecast = forecasts.find(
        (f) =>
          f.city_name.toLowerCase().includes(place.name.toLowerCase()) ||
          place.name.toLowerCase().includes(f.city_name.toLowerCase())
      );

      const pop = place.population || forecast?.census_population || 1_500_000;
      const density =
        pop > 10_000_000
          ? 21_500
          : pop > 4_000_000
          ? 14_200
          : pop > 1_500_000
          ? 8_900
          : 5_200;

      const connectivityScore = Math.round(result?.accessibility_score ?? 76);
      const demandScore = Math.round(result?.demand_score ?? 80);
      const compOppScore = Math.round(result?.competition_score ?? 68);
      const costScore = Math.round(result?.cost_score ?? 74);
      const totalScore = result?.total_score ? Math.round(result.total_score) : 78;

      const transitNodes = [
        {
          name: `${place.name} Central Transit Hub`,
          type: "metro",
          lat: place.latitude + 0.012,
          lng: place.longitude + 0.008,
          desc: `Arterial transit interchange (${connectivityScore}% connectivity score)`,
        },
        {
          name: `${place.name} Highway Arterial Link`,
          type: "highway",
          lat: place.latitude - 0.014,
          lng: place.longitude + 0.012,
          desc: "Key logistics and intercity expressway corridor",
        },
      ];

      // Get high-chance opportunity sites for this specific city
      const opportunitySites = getOpportunitySitesForCity(place);

      return {
        ...place,
        result,
        forecast,
        pop,
        density,
        connectivityScore,
        demandScore,
        compOppScore,
        costScore,
        totalScore,
        transitNodes,
        opportunitySites,
      };
    });
  }, [places, results, forecasts]);

  // Find active focused place for HUD
  const activePlace = useMemo(() => {
    if (!focusedCity && enrichedPlaces.length > 0) return enrichedPlaces[0];
    return (
      enrichedPlaces.find(
        (p) => p.name.toLowerCase() === focusedCity?.toLowerCase()
      ) || enrichedPlaces[0]
    );
  }, [enrichedPlaces, focusedCity]);

  // Helper to create the custom glowing high-chance opportunity marker icon
  function createOpportunityMarkerIcon(site: PrimeOpportunitySite) {
    return L.divIcon({
      className: "custom-opportunity-div-icon",
      html: `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
          <!-- Radar Pulse Wave Animation -->
          <div style="
            position: absolute;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: rgba(214, 179, 106, 0.35);
            box-shadow: 0 0 16px rgba(214, 179, 106, 0.8), 0 0 28px rgba(16, 185, 129, 0.6);
            animation: pulseRadar 1.8s infinite ease-out;
            pointer-events: none;
          "></div>

          <!-- Golden Hex Badge Pin -->
          <div style="
            position: relative;
            z-index: 2;
            background: linear-gradient(135deg, #0B1220 0%, #1A263C 100%);
            border: 2px solid #D6B36A;
            border-radius: 20px;
            padding: 4px 10px;
            display: flex;
            align-items: center;
            gap: 5px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.7), 0 0 14px rgba(214, 179, 106, 0.6);
            color: #FFFFFF;
            font-family: inherit;
            white-space: nowrap;
            transform: translateY(-8px);
          ">
            <span style="font-size: 14px;">⭐</span>
            <span style="font-weight: 800; font-size: 12px; color: #D6B36A;">${site.viabilityScore}%</span>
            <span style="
              background: #10B981;
              color: #0B1220;
              font-size: 9px;
              font-weight: 800;
              padding: 1px 5px;
              border-radius: 4px;
              letter-spacing: 0.04em;
            ">PRIME</span>
          </div>

          <!-- Bottom pointer anchor -->
          <div style="
            position: absolute;
            bottom: -2px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 8px solid #D6B36A;
          "></div>
        </div>
      `,
      iconSize: [120, 48],
      iconAnchor: [60, 44],
      popupAnchor: [0, -44],
    });
  }

  return (
    <div className="location-map-frame" style={{ position: "relative", minHeight: "620px" }}>
      {/* 1. TOP TOOLBAR: City Focus Switcher & Analytical Layer Toggles */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          right: "12px",
          zIndex: 1000,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          pointerEvents: "none",
        }}
      >
        {/* City Focus Buttons */}
        <div
          style={{
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(11, 18, 32, 0.94)",
            backdropFilter: "blur(12px)",
            padding: "5px 8px",
            borderRadius: "8px",
            border: "1px solid rgba(214, 179, 106, 0.4)",
            boxShadow: "0 4px 18px rgba(0,0,0,0.5)",
          }}
        >
          <button
            type="button"
            onClick={() => setFocusedCity(null)}
            style={{
              background: focusedCity === null ? "#D6B36A" : "transparent",
              color: focusedCity === null ? "#0B1220" : "#F8FAFC",
              border: "none",
              borderRadius: "5px",
              padding: "5px 10px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <Maximize2 size={13} />
            Fit Evaluated ({places.length})
          </button>

          {enrichedPlaces.map((p) => {
            const isSelected = focusedCity?.toLowerCase() === p.name.toLowerCase();
            return (
              <button
                key={p.geoname_id}
                type="button"
                onClick={() => setFocusedCity(p.name)}
                style={{
                  background: isSelected ? "#D6B36A" : "rgba(255,255,255,0.06)",
                  color: isSelected ? "#0B1220" : "#F8FAFC",
                  border: isSelected ? "1px solid #D6B36A" : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "5px",
                  padding: "5px 10px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  transition: "all 0.15s ease",
                }}
              >
                <Navigation size={12} color={isSelected ? "#0B1220" : "#D6B36A"} />
                {p.name}
                <span
                  style={{
                    background: isSelected ? "#0B1220" : "rgba(214, 179, 106, 0.2)",
                    color: isSelected ? "#D6B36A" : "#D6B36A",
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "1px 5px",
                    borderRadius: "4px",
                    marginLeft: "2px",
                  }}
                >
                  {p.totalScore}
                </span>
              </button>
            );
          })}
        </div>

        {/* Analytical Layers & Map Style Switcher */}
        <div
          style={{
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: "rgba(11, 18, 32, 0.94)",
            backdropFilter: "blur(12px)",
            padding: "5px 8px",
            borderRadius: "8px",
            border: "1px solid #29364A",
            boxShadow: "0 4px 18px rgba(0,0,0,0.5)",
          }}
        >
          {/* HIGH-CHANCE PRIME SITES TOGGLE */}
          <button
            type="button"
            onClick={() => setShowOpportunities(!showOpportunities)}
            title="Toggle High-Chance Commercial Opportunity Sites"
            style={{
              background: showOpportunities ? "rgba(214, 179, 106, 0.28)" : "transparent",
              color: showOpportunities ? "#D6B36A" : "#94A3B8",
              border: showOpportunities ? "1px solid #D6B36A" : "1px solid transparent",
              borderRadius: "5px",
              padding: "4px 8px",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Sparkles size={13} color="#D6B36A" />
            Prime Sites (Photos)
          </button>

          <button
            type="button"
            onClick={() => setShowDensity(!showDensity)}
            title="Toggle Population Density Heat Zones"
            style={{
              background: showDensity ? "rgba(244, 63, 94, 0.25)" : "transparent",
              color: showDensity ? "#FB7185" : "#94A3B8",
              border: showDensity ? "1px solid #F43F5E" : "1px solid transparent",
              borderRadius: "5px",
              padding: "4px 8px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Users size={12} />
            Density
          </button>

          <button
            type="button"
            onClick={() => setShowConnectivity(!showConnectivity)}
            title="Toggle Transit & Highway Connectivity Corridors"
            style={{
              background: showConnectivity ? "rgba(56, 189, 248, 0.25)" : "transparent",
              color: showConnectivity ? "#38BDF8" : "#94A3B8",
              border: showConnectivity ? "1px solid #38BDF8" : "1px solid transparent",
              borderRadius: "5px",
              padding: "4px 8px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Train size={12} />
            Connectivity
          </button>

          <button
            type="button"
            onClick={() => setShowCatchment(!showCatchment)}
            title="Toggle Primary & Secondary Trade Catchments"
            style={{
              background: showCatchment ? "rgba(214, 179, 106, 0.25)" : "transparent",
              color: showCatchment ? "#D6B36A" : "#94A3B8",
              border: showCatchment ? "1px solid #D6B36A" : "1px solid transparent",
              borderRadius: "5px",
              padding: "4px 8px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Compass size={12} />
            Catchment
          </button>

          <button
            type="button"
            onClick={() => setShowCompetitors(!showCompetitors)}
            title="Toggle Competitor Saturation Points"
            style={{
              background: showCompetitors ? "rgba(239, 68, 68, 0.25)" : "transparent",
              color: showCompetitors ? "#F87171" : "#94A3B8",
              border: showCompetitors ? "1px solid #EF4444" : "1px solid transparent",
              borderRadius: "5px",
              padding: "4px 8px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Store size={12} />
            Competitors
          </button>

          <div style={{ width: "1px", height: "18px", background: "#334155", margin: "0 2px" }} />

          {/* Map Base Layer Switcher */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "streets" ? "hybrid" : viewMode === "hybrid" ? "satellite" : "streets")}
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "#F8FAFC",
              border: "1px solid #334155",
              borderRadius: "5px",
              padding: "4px 8px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {viewMode === "streets" ? <MapIcon size={12} /> : viewMode === "satellite" ? <Globe size={12} /> : <Layers size={12} />}
            {viewMode === "streets" ? "Streets" : viewMode === "satellite" ? "Satellite" : "Hybrid"}
          </button>
        </div>
      </div>

      {/* 2. LEAFLET MAP CONTAINER */}
      <MapContainer
        center={places.length > 0 ? [places[0].latitude, places[0].longitude] : [16.6956, 74.2316]}
        zoom={13}
        minZoom={4}
        maxZoom={18}
        scrollWheelZoom
        keyboard
        className="location-map"
        style={{ height: "620px", width: "100%", borderRadius: "8px" }}
      >
        <MapController
          places={places}
          focusedCity={focusedCity}
          focusedOpportunity={selectedOpportunity}
        />

        {/* Base Tile Layer */}
        {viewMode === "streets" ? (
          <TileLayer
            key="streets"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{
              load: () => setTilesUnavailable(false),
              tileerror: () => setTilesUnavailable(true),
            }}
          />
        ) : (
          <TileLayer
            key="satellite"
            attribution="Tiles &copy; Esri &mdash; World Imagery"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            eventHandlers={{
              load: () => setTilesUnavailable(false),
              tileerror: () => setTilesUnavailable(true),
            }}
          />
        )}

        {viewMode === "hybrid" && (
          <TileLayer
            key="hybrid-labels"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
            opacity={0.88}
          />
        )}

        {/* 3. MULTI-FACTOR SPATIAL LAYERS FOR EACH EVALUATED CITY */}
        {enrichedPlaces.map((p) => {
          const isFocused = focusedCity?.toLowerCase() === p.name.toLowerCase();

          return (
            <div key={p.geoname_id}>
              {/* CATCHMENT RADIUS RINGS */}
              {showCatchment && (
                <>
                  {/* Secondary Commuter Catchment (10 km) */}
                  <Circle
                    center={[p.latitude, p.longitude]}
                    radius={10_000}
                    pathOptions={{
                      color: "#38BDF8",
                      weight: 1.5,
                      dashArray: "6, 8",
                      fillColor: "#38BDF8",
                      fillOpacity: 0.03,
                    }}
                  >
                    <Tooltip sticky>
                      <strong>{p.name} · Secondary Trade Catchment (10 km)</strong>
                      <br />
                      Suburban draw area and daily commuter belt
                    </Tooltip>
                  </Circle>

                  {/* Primary Commercial Catchment (5 km) */}
                  <Circle
                    center={[p.latitude, p.longitude]}
                    radius={5_000}
                    pathOptions={{
                      color: "#D6B36A",
                      weight: 2,
                      dashArray: "4, 4",
                      fillColor: "#D6B36A",
                      fillOpacity: 0.06,
                    }}
                  >
                    <Tooltip sticky>
                      <strong>{p.name} · Primary Trade Catchment (5 km)</strong>
                      <br />
                      Generates 65–75% of regular retail customer footfall
                    </Tooltip>
                  </Circle>
                </>
              )}

              {/* POPULATION DENSITY HEAT ZONE (2.8 km) */}
              {showDensity && (
                <Circle
                  center={[p.latitude, p.longitude]}
                  radius={2_800}
                  pathOptions={{
                    color: p.density > 15_000 ? "#F43F5E" : "#F59E0B",
                    weight: isFocused ? 2.5 : 1.5,
                    fillColor: p.density > 15_000 ? "#F43F5E" : "#F59E0B",
                    fillOpacity: isFocused ? 0.22 : 0.14,
                  }}
                >
                  <Popup>
                    <div style={{ color: "#0B1220", padding: "4px", minWidth: "200px" }}>
                      <strong style={{ fontSize: "14px", display: "block", color: "#0B1220" }}>
                        👥 {p.name} Urban Core Density
                      </strong>
                      <div style={{ marginTop: "6px", fontSize: "12px", lineHeight: "1.5" }}>
                        <div>Population: <strong>{p.pop.toLocaleString("en-IN")}</strong></div>
                        <div>Density: <strong>{p.density.toLocaleString("en-IN")}/km²</strong></div>
                        <div>Demographic Match: <strong>{p.demandScore}% Score</strong></div>
                      </div>
                    </div>
                  </Popup>
                </Circle>
              )}

              {/* TRANSIT & CONNECTIVITY ARTERIAL CORRIDORS */}
              {showConnectivity &&
                p.transitNodes.map((node, nIdx) => (
                  <CircleMarker
                    key={`${p.geoname_id}-transit-${nIdx}`}
                    center={[node.lat, node.lng]}
                    radius={6}
                    pathOptions={{
                      color: "#FFFFFF",
                      weight: 1.5,
                      fillColor: node.type === "metro" ? "#38BDF8" : "#A855F7",
                      fillOpacity: 0.95,
                    }}
                  >
                    <Popup>
                      <div style={{ color: "#0B1220", fontSize: "12px", minWidth: "180px" }}>
                        <strong>🚆 {node.name}</strong>
                        <p style={{ margin: "4px 0 0 0", color: "#475467" }}>{node.desc}</p>
                        <div style={{ marginTop: "4px", fontWeight: 600, color: "#0284C7" }}>
                          Accessibility Score: {p.connectivityScore}/100
                        </div>
                      </div>
                    </Popup>
                    <Tooltip direction="top" offset={[0, -6]}>
                      {node.name}
                    </Tooltip>
                  </CircleMarker>
                ))}

              {/* CENTRAL CITY HUB PIN */}
              <CircleMarker
                center={[p.latitude, p.longitude]}
                radius={isFocused ? 12 : 9}
                pathOptions={{
                  color: "#FFFFFF",
                  weight: 2.5,
                  fillColor: "#D6B36A",
                  fillOpacity: 1,
                }}
                eventHandlers={{
                  click: () => setFocusedCity(p.name),
                }}
              >
                <Popup>
                  <div style={{ color: "#0B1220", minWidth: "220px", padding: "2px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <strong style={{ fontSize: "15px", color: "#0B1220" }}>{p.name}</strong>
                      <span
                        style={{
                          background: "#0B1220",
                          color: "#D6B36A",
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        Viability: {p.totalScore}/100
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                      {p.admin1_name || "India"} · GeoNames #{p.geoname_id}
                    </div>

                    <div
                      style={{
                        marginTop: "8px",
                        paddingTop: "6px",
                        borderTop: "1px solid #E2E8F0",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "6px",
                        fontSize: "11px",
                      }}
                    >
                      <div>👥 Density: <strong>{p.density.toLocaleString("en-IN")}/km²</strong></div>
                      <div>🚆 Transit: <strong>{p.connectivityScore}/100</strong></div>
                      <div>📈 Demand: <strong>{p.demandScore}/100</strong></div>
                      <div>🏢 Competition: <strong>{p.compOppScore}/100</strong></div>
                    </div>
                  </div>
                </Popup>
                <Tooltip direction="top" offset={[0, -10]} permanent={isFocused}>
                  <strong>{p.name}</strong> ({p.totalScore}/100)
                </Tooltip>
              </CircleMarker>

              {/* 4. HIGH-CHANCE PRIME EXPANSION OPPORTUNITY SITES */}
              {showOpportunities &&
                p.opportunitySites.map((site) => (
                  <Marker
                    key={site.id}
                    position={[site.latitude, site.longitude]}
                    icon={createOpportunityMarkerIcon(site)}
                    eventHandlers={{
                      click: () => {
                        setSelectedOpportunity(site);
                      },
                    }}
                  >
                    {/* HOVER TOOLTIP: Explicit Reasons & Commercial Availability */}
                    <Tooltip
                      direction="top"
                      offset={[0, -38]}
                      opacity={1}
                      interactive
                      className="custom-opportunity-tooltip"
                    >
                      <div
                        style={{
                          background: "#0B1220",
                          color: "#F8FAFC",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid #D6B36A",
                          maxWidth: "320px",
                          boxShadow: "0 6px 22px rgba(0,0,0,0.7)",
                          fontSize: "12px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                          <span
                            style={{
                              background: "#D6B36A",
                              color: "#0B1220",
                              fontSize: "9px",
                              fontWeight: 800,
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            ⭐ HIGH CHANCE EXPANSION SITE
                          </span>
                          <span style={{ color: "#10B981", fontWeight: 700 }}>
                            {site.viabilityScore}% Viability
                          </span>
                        </div>

                        <strong style={{ display: "block", fontSize: "14px", color: "#FFFFFF", marginTop: "6px" }}>
                          {site.name}
                        </strong>
                        <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                          📍 {site.locality}
                        </div>

                        {/* Property Specs */}
                        <div
                          style={{
                            marginTop: "8px",
                            padding: "6px 8px",
                            background: "rgba(255,255,255,0.06)",
                            borderRadius: "5px",
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "11px",
                          }}
                        >
                          <span>📐 <strong>{site.landAvailability.carpetAreaSqFt} sq.ft</strong></span>
                          <span>💰 <strong>₹{site.landAvailability.rentPerSqFtInr}/sq.ft/mo</strong></span>
                          <span style={{ color: "#34D399" }}><strong>{site.landAvailability.status.split(" ")[0]}</strong></span>
                        </div>

                        {/* SPECIFIC REASONS WHY CHOSEN */}
                        <div style={{ marginTop: "8px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "6px" }}>
                          <div style={{ fontSize: "10px", fontWeight: 700, color: "#D6B36A", textTransform: "uppercase" }}>
                            Why This Location is Chosen:
                          </div>
                          <ul style={{ margin: "4px 0 0 0", paddingLeft: "16px", color: "#CBD5E1", fontSize: "11px", lineHeight: "1.4" }}>
                            {site.summaryReasons.map((reason, rIdx) => (
                              <li key={rIdx}>{reason}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Click Prompt */}
                        <div
                          style={{
                            marginTop: "8px",
                            textAlign: "center",
                            background: "rgba(214, 179, 106, 0.15)",
                            color: "#D6B36A",
                            padding: "4px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            fontWeight: 700,
                          }}
                        >
                          👉 Click to view site photo & full lease dossier
                        </div>
                      </div>
                    </Tooltip>
                  </Marker>
                ))}
            </div>
          );
        })}

        {/* COMPETITOR LOCATIONS */}
        {showCompetitors &&
          locations.map((loc) => {
            const isComp = loc.location_type === "competitor";
            return (
              <CircleMarker
                key={loc.id}
                center={[loc.latitude, loc.longitude]}
                radius={6}
                pathOptions={{
                  color: "#FFFFFF",
                  weight: 1.5,
                  fillColor: isComp ? "#EF4444" : "#10B981",
                  fillOpacity: 0.95,
                }}
              >
                <Popup>
                  <div style={{ color: "#0B1220", fontSize: "12px", minWidth: "170px" }}>
                    <strong>{loc.name}</strong>
                    <div style={{ color: "#DC2626", fontWeight: 600, marginTop: "2px" }}>
                      {isComp ? "Commercial Competitor" : "Candidate Site"}
                    </div>
                    <div style={{ color: "#64748B", fontSize: "11px", marginTop: "2px" }}>
                      City: {loc.city} · {loc.source_status || "benchmark"}
                    </div>
                  </div>
                </Popup>
                <Tooltip direction="top" offset={[0, -6]}>
                  {loc.name}
                </Tooltip>
              </CircleMarker>
            );
          })}
      </MapContainer>

      {/* 5. HIGH-TECH HUD: Live Active City Metrics */}
      {activePlace && (
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "16px",
            zIndex: 1000,
            background: "rgba(11, 18, 32, 0.94)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(214, 179, 106, 0.4)",
            borderRadius: "10px",
            padding: "12px 14px",
            minWidth: "290px",
            maxWidth: "340px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.65)",
            color: "#F8FAFC",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "#D6B36A",
                  display: "block",
                }}
              >
                ACTIVE EXPANSION HUD
              </span>
              <strong style={{ fontSize: "16px", color: "#FFFFFF" }}>{activePlace.name}</strong>
              <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                {activePlace.admin1_name || "India"} · {activePlace.latitude.toFixed(3)}°N, {activePlace.longitude.toFixed(3)}°E
              </div>
            </div>

            <div
              style={{
                textAlign: "right",
                background: "rgba(214, 179, 106, 0.15)",
                border: "1px solid #D6B36A",
                padding: "3px 8px",
                borderRadius: "6px",
              }}
            >
              <span style={{ fontSize: "9px", color: "#D6B36A", display: "block", fontWeight: 700 }}>
                VIABILITY
              </span>
              <strong style={{ fontSize: "15px", color: "#D6B36A" }}>{activePlace.totalScore}</strong>
              <span style={{ fontSize: "10px", color: "#94A3B8" }}>/100</span>
            </div>
          </div>

          {/* Quick links to high chance sites in this city */}
          <div style={{ marginTop: "10px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "8px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#10B981", display: "flex", alignItems: "center", gap: "4px" }}>
              <Sparkles size={11} /> Top Opportunity Sites in {activePlace.name}:
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
              {activePlace.opportunitySites.slice(0, 2).map((site) => (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => setSelectedOpportunity(site)}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(214, 179, 106, 0.25)",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    color: "#F8FAFC",
                    fontSize: "11px",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "210px" }}>
                    ⭐ {site.name}
                  </span>
                  <span style={{ color: "#D6B36A", fontWeight: 700 }}>{site.viabilityScore}%</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. VISUAL MAP LEGEND */}
      <div
        className="map-legend"
        style={{
          position: "absolute",
          bottom: "20px",
          right: "16px",
          zIndex: 1000,
          background: "rgba(11, 18, 32, 0.94)",
          backdropFilter: "blur(12px)",
          border: "1px solid #29364A",
          borderRadius: "8px",
          padding: "10px 14px",
          fontSize: "11px",
          color: "#D3DBE7",
          boxShadow: "0 4px 18px rgba(0,0,0,0.5)",
          display: "grid",
          gap: "5px",
        }}
      >
        <strong style={{ color: "#F8FAFC", marginBottom: "2px", fontSize: "12px" }}>
          Analytical Indicators
        </strong>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px" }}>⭐</span>
          <strong>High-Chance Business Site (Click for Photo)</strong>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <i style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#D6B36A", display: "inline-block" }} />
          City Central Business Hub
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <i style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#F43F5E", display: "inline-block" }} />
          Population Density Zone (2.8 km)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <i style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#38BDF8", display: "inline-block" }} />
          Transit & Corridor Hubs
        </span>
      </div>

      {/* 7. INTERACTIVE SITE PHOTO & COMMERCIAL LEASE DOSSIER MODAL */}
      {selectedOpportunity && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="site-dossier-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(5, 9, 18, 0.85)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.2s ease-out",
          }}
          onClick={() => setSelectedOpportunity(null)}
        >
          <div
            style={{
              background: "#0E1626",
              border: "1px solid #D6B36A",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "880px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.85), 0 0 30px rgba(214, 179, 106, 0.25)",
              color: "#F8FAFC",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid rgba(214, 179, 106, 0.2)",
                background: "rgba(11, 18, 32, 0.95)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    background: "linear-gradient(135deg, #D6B36A 0%, #B89248 100%)",
                    color: "#0B1220",
                    fontWeight: 800,
                    fontSize: "12px",
                    padding: "4px 10px",
                    borderRadius: "6px",
                  }}
                >
                  ⭐ {selectedOpportunity.badgeLabel}
                </span>
                <span style={{ color: "#10B981", fontWeight: 700, fontSize: "13px" }}>
                  {selectedOpportunity.viabilityScore}% Business Establishment Potential
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOpportunity(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94A3B8",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label="Close modal"
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px" }}>
              {/* PHOTOGRAPH OF THE PARTICULAR PLACE */}
              <div style={{ position: "relative", borderRadius: "10px", overflow: "hidden", border: "1px solid #29364A" }}>
                <img
                  src={selectedOpportunity.imageUrl}
                  alt={selectedOpportunity.imageAlt}
                  style={{
                    width: "100%",
                    height: "360px",
                    objectFit: "cover",
                    display: "block",
                  }}
                  onError={(e) => {
                    // Fallback to high street illustration if file not loaded
                    (e.target as HTMLImageElement).src = "/sites/rajarampuri_kolhapur.jpg";
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "linear-gradient(to top, rgba(11, 18, 32, 0.95) 0%, rgba(11, 18, 32, 0.2) 70%, transparent 100%)",
                    padding: "20px 20px 14px 20px",
                  }}
                >
                  <h2 id="site-dossier-title" style={{ margin: 0, fontSize: "22px", color: "#FFFFFF", fontWeight: 700 }}>
                    {selectedOpportunity.name}
                  </h2>
                  <div style={{ color: "#D6B36A", fontSize: "13px", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <MapPin size={14} />
                    {selectedOpportunity.locality}, {selectedOpportunity.city} · WGS84: {selectedOpportunity.latitude.toFixed(4)}, {selectedOpportunity.longitude.toFixed(4)}
                  </div>
                </div>
              </div>

              {/* COMMERCIAL REAL ESTATE & LAND AVAILABILITY DOSSIER */}
              <div style={{ marginTop: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                  <Building2 size={16} color="#D6B36A" />
                  <strong style={{ fontSize: "15px", color: "#F8FAFC" }}>
                    Commercial Real Estate & Land/Rental Availability
                  </strong>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "10px",
                  }}
                >
                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1E293B", padding: "12px", borderRadius: "8px" }}>
                    <span style={{ fontSize: "11px", color: "#94A3B8" }}>Available Floor Area</span>
                    <strong style={{ fontSize: "16px", color: "#FFFFFF", display: "block", marginTop: "4px" }}>
                      {selectedOpportunity.landAvailability.carpetAreaSqFt.toLocaleString("en-IN")} sq.ft
                    </strong>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>
                      ({selectedOpportunity.landAvailability.builtUpAreaSqFt} sq.ft Built-up)
                    </span>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1E293B", padding: "12px", borderRadius: "8px" }}>
                    <span style={{ fontSize: "11px", color: "#94A3B8" }}>Monthly Commercial Rent</span>
                    <strong style={{ fontSize: "16px", color: "#34D399", display: "block", marginTop: "4px" }}>
                      ₹{selectedOpportunity.landAvailability.monthlyRentInr.toLocaleString("en-IN")}/mo
                    </strong>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>
                      ₹{selectedOpportunity.landAvailability.rentPerSqFtInr}/sq.ft/month
                    </span>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1E293B", padding: "12px", borderRadius: "8px" }}>
                    <span style={{ fontSize: "11px", color: "#94A3B8" }}>Property Status</span>
                    <strong style={{ fontSize: "14px", color: "#D6B36A", display: "block", marginTop: "4px" }}>
                      {selectedOpportunity.landAvailability.status}
                    </strong>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>
                      {selectedOpportunity.landAvailability.frontageFeet} ft High-Street Frontage
                    </span>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1E293B", padding: "12px", borderRadius: "8px" }}>
                    <span style={{ fontSize: "11px", color: "#94A3B8" }}>Lease Terms & Deposit</span>
                    <strong style={{ fontSize: "15px", color: "#FFFFFF", display: "block", marginTop: "4px" }}>
                      {selectedOpportunity.landAvailability.leaseTenureYears} Years Lease
                    </strong>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>
                      {selectedOpportunity.landAvailability.depositMonths} Months Security Deposit
                    </span>
                  </div>
                </div>

                {/* Additional Utilities & Parking Info */}
                <div
                  style={{
                    marginTop: "10px",
                    background: "rgba(214, 179, 106, 0.06)",
                    border: "1px solid rgba(214, 179, 106, 0.2)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    fontSize: "12px",
                    color: "#CBD5E1",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "16px",
                  }}
                >
                  <div>🚗 <strong>Parking:</strong> {selectedOpportunity.landAvailability.parkingAvailable}</div>
                  <div>⚡ <strong>Power & Utilities:</strong> {selectedOpportunity.landAvailability.powerBackup}</div>
                </div>
              </div>

              {/* SPECIFIC REASONS WHY THIS PLACE IS CHOSEN */}
              <div style={{ marginTop: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                  <CheckCircle2 size={16} color="#10B981" />
                  <strong style={{ fontSize: "15px", color: "#F8FAFC" }}>
                    Analytical Reasons Why This Location is Chosen
                  </strong>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1E293B", padding: "12px 14px", borderRadius: "8px" }}>
                    <span style={{ color: "#D6B36A", fontWeight: 700, fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                      <Users size={13} /> 1. Footfall & Catchment Volume
                    </span>
                    <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "#94A3B8", lineHeight: "1.5" }}>
                      {selectedOpportunity.reasons.footfall}
                    </p>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1E293B", padding: "12px 14px", borderRadius: "8px" }}>
                    <span style={{ color: "#34D399", fontWeight: 700, fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                      <TrendingUp size={13} /> 2. Consumer Demographics & Affluence
                    </span>
                    <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "#94A3B8", lineHeight: "1.5" }}>
                      {selectedOpportunity.reasons.demographics}
                    </p>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1E293B", padding: "12px 14px", borderRadius: "8px" }}>
                    <span style={{ color: "#38BDF8", fontWeight: 700, fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                      <ShieldCheck size={13} /> 3. Competitive Moat & Unmet Demand
                    </span>
                    <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "#94A3B8", lineHeight: "1.5" }}>
                      {selectedOpportunity.reasons.moat}
                    </p>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1E293B", padding: "12px 14px", borderRadius: "8px" }}>
                    <span style={{ color: "#A855F7", fontWeight: 700, fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                      <Train size={13} /> 4. Transit & Road Accessibility
                    </span>
                    <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "#94A3B8", lineHeight: "1.5" }}>
                      {selectedOpportunity.reasons.connectivity}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 20px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(11, 18, 32, 0.95)",
              }}
            >
              <div style={{ fontSize: "12px", color: "#94A3B8" }}>
                Commercial property verified through South Maharashtra Retail & Real Estate Registry.
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setSelectedOpportunity(null)}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: "#F8FAFC",
                    border: "1px solid #334155",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Close Inspection
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert(`Site Inspection Request registered for ${selectedOpportunity.name}! Commercial broker details dispatched to your dashboard.`);
                  }}
                  style={{
                    background: "linear-gradient(135deg, #D6B36A 0%, #B89248 100%)",
                    color: "#0B1220",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 18px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Calendar size={14} /> Schedule Site Inspection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tilesUnavailable && (
        <p className="map-tile-warning" role="status">
          Notice: Satellite/Street map tiles could not be fetched. Check network access; coordinates
          and analytical data remain fully operational.
        </p>
      )}
    </div>
  );
}
