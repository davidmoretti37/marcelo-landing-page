// ─── Spark Jets Showroom – City Database & Quick Routes ──────────────────────

import type { City } from "./types";

export const SHOWROOM_CITIES: City[] = [
  // ── North America ──────────────────────────────────────────────────────────
  { name: "New York",      coords: [-74.006,  40.7128],  region: "North America" },
  { name: "Los Angeles",   coords: [-118.2437, 34.0522], region: "North America" },
  { name: "Miami",         coords: [-80.1918, 25.7617],  region: "North America" },
  { name: "Chicago",       coords: [-87.6298, 41.8781],  region: "North America" },
  { name: "Dallas",        coords: [-96.797,  32.7767],  region: "North America" },
  { name: "Houston",       coords: [-95.3698, 29.7604],  region: "North America" },
  { name: "Atlanta",       coords: [-84.388,  33.749],   region: "North America" },
  { name: "San Francisco", coords: [-122.4194, 37.7749], region: "North America" },
  { name: "Washington DC", coords: [-77.0369, 38.9072],  region: "North America" },
  { name: "Boston",        coords: [-71.0589, 42.3601],  region: "North America" },
  { name: "Las Vegas",     coords: [-115.1398, 36.1699], region: "North America" },
  { name: "Aspen",         coords: [-106.8175, 39.1911], region: "North America" },
  { name: "Teterboro",     coords: [-74.0608, 40.8501],  region: "North America" },
  { name: "Palm Beach",    coords: [-80.0364, 26.7056],  region: "North America" },
  { name: "Naples FL",     coords: [-81.7948, 26.142],   region: "North America" },
  { name: "Seattle",       coords: [-122.3321, 47.6062], region: "North America" },
  { name: "Denver",        coords: [-104.9903, 39.7392], region: "North America" },
  { name: "Scottsdale",    coords: [-111.9261, 33.4942], region: "North America" },

  // ── Europe ─────────────────────────────────────────────────────────────────
  { name: "London",        coords: [-0.1276,  51.5074],  region: "Europe" },
  { name: "Paris",         coords: [2.3522,   48.8566],  region: "Europe" },
  { name: "Geneva",        coords: [6.1432,   46.2044],  region: "Europe" },
  { name: "Zurich",        coords: [8.5417,   47.3769],  region: "Europe" },
  { name: "Nice",          coords: [7.2620,   43.7102],  region: "Europe" },
  { name: "Milan",         coords: [9.19,     45.4642],  region: "Europe" },
  { name: "Rome",          coords: [12.4964,  41.9028],  region: "Europe" },
  { name: "Amsterdam",     coords: [4.9041,   52.3676],  region: "Europe" },
  { name: "Munich",        coords: [11.582,   48.1351],  region: "Europe" },
  { name: "Barcelona",     coords: [2.1734,   41.3874],  region: "Europe" },
  { name: "Lisbon",        coords: [-9.1393,  38.7223],  region: "Europe" },
  { name: "Istanbul",      coords: [28.9784,  41.0082],  region: "Europe" },
  { name: "Moscow",        coords: [37.6173,  55.7558],  region: "Europe" },
  { name: "Mykonos",       coords: [25.3289,  37.4467],  region: "Europe" },

  // ── Middle East ────────────────────────────────────────────────────────────
  { name: "Dubai",         coords: [55.2708,  25.2048],  region: "Middle East" },
  { name: "Riyadh",        coords: [46.6753,  24.7136],  region: "Middle East" },
  { name: "Abu Dhabi",     coords: [54.3773,  24.4539],  region: "Middle East" },
  { name: "Tel Aviv",      coords: [34.7818,  32.0853],  region: "Middle East" },

  // ── Asia-Pacific ───────────────────────────────────────────────────────────
  { name: "Tokyo",         coords: [139.6917, 35.6895],  region: "Asia-Pacific" },
  { name: "Singapore",     coords: [103.8198, 1.3521],   region: "Asia-Pacific" },
  { name: "Hong Kong",     coords: [114.1694, 22.3193],  region: "Asia-Pacific" },
  { name: "Mumbai",        coords: [72.8777,  19.076],   region: "Asia-Pacific" },
  { name: "Shanghai",      coords: [121.4737, 31.2304],  region: "Asia-Pacific" },
  { name: "Maldives",      coords: [73.5093,  4.1755],   region: "Asia-Pacific" },

  // ── South America ─────────────────────────────────────────────────────────
  { name: "São Paulo",     coords: [-46.6333, -23.5505], region: "South America" },
  { name: "Buenos Aires",  coords: [-58.3816, -34.6037], region: "South America" },

  // ── Africa ─────────────────────────────────────────────────────────────────
  { name: "Johannesburg",  coords: [28.0473,  -26.2041], region: "Africa" },

  // ── Mexico & Caribbean ────────────────────────────────────────────────────
  { name: "Mexico City",   coords: [-99.1332, 19.4326],  region: "Mexico & Caribbean" },
  { name: "Cabo San Lucas", coords: [-109.9167, 22.8905], region: "Mexico & Caribbean" },
  { name: "Cancun",        coords: [-86.8515, 21.1619],  region: "Mexico & Caribbean" },
  { name: "Punta Cana",    coords: [-68.3725, 18.5601],  region: "Mexico & Caribbean" },
];

export const QUICK_ROUTES: { label: string; cities: [string, string] }[] = [
  { label: "NYC \u2194 London",       cities: ["New York", "London"] },
  { label: "Miami \u2194 S\u00e3o Paulo",   cities: ["Miami", "S\u00e3o Paulo"] },
  { label: "LA \u2194 Tokyo",          cities: ["Los Angeles", "Tokyo"] },
  { label: "London \u2194 Dubai",      cities: ["London", "Dubai"] },
  { label: "NYC \u2194 Miami",         cities: ["New York", "Miami"] },
  { label: "Paris \u2194 Geneva",      cities: ["Paris", "Geneva"] },
  { label: "Teterboro \u2194 Aspen",   cities: ["Teterboro", "Aspen"] },
  { label: "Dubai \u2194 Singapore",   cities: ["Dubai", "Singapore"] },
  { label: "LA \u2194 Cabo",           cities: ["Los Angeles", "Cabo San Lucas"] },
  { label: "Dallas \u2194 Teterboro",  cities: ["Dallas", "Teterboro"] },
  { label: "Chicago \u2194 Palm Beach", cities: ["Chicago", "Palm Beach"] },
  { label: "Hong Kong \u2194 Tokyo",   cities: ["Hong Kong", "Tokyo"] },
  { label: "NYC \u2194 Paris",         cities: ["New York", "Paris"] },
  { label: "Miami \u2194 Cancun",      cities: ["Miami", "Cancun"] },
  { label: "Dubai \u2194 Mumbai",      cities: ["Dubai", "Mumbai"] },
];
