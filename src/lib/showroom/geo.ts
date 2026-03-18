// ─── Spark Jets Showroom – Geo Utilities ─────────────────────────────────────

import type { Aircraft, City } from "./types";

const DEG_TO_RAD = Math.PI / 180;
const EARTH_RADIUS_NM = 3440.065; // mean Earth radius in nautical miles

/**
 * Great-circle distance between two [lng, lat] coordinates using the
 * Haversine formula. Returns distance in nautical miles.
 */
export function haversineNm(
  a: [number, number],
  b: [number, number],
): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;

  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLng = (lng2 - lng1) * DEG_TO_RAD;

  const sinHalfDLat = Math.sin(dLat / 2);
  const sinHalfDLng = Math.sin(dLng / 2);

  const h =
    sinHalfDLat * sinHalfDLat +
    Math.cos(lat1 * DEG_TO_RAD) *
      Math.cos(lat2 * DEG_TO_RAD) *
      sinHalfDLng *
      sinHalfDLng;

  return 2 * EARTH_RADIUS_NM * Math.asin(Math.sqrt(h));
}

/**
 * Returns the maximum great-circle distance (in NM) between any pair of
 * cities in the provided list. Returns 0 if fewer than 2 cities are given.
 */
export function longestRouteNm(cities: City[]): number {
  if (cities.length < 2) return 0;

  let max = 0;
  for (let i = 0; i < cities.length; i++) {
    for (let j = i + 1; j < cities.length; j++) {
      const d = haversineNm(cities[i].coords, cities[j].coords);
      if (d > max) max = d;
    }
  }
  return max;
}

/**
 * Determines whether an aircraft can serve all routes connecting the given
 * cities. Uses an 85 % range factor (IFR reserves + alternate).
 *
 * - Returns `true` if the aircraft's derated range covers the longest leg.
 * - Returns `"unverified"` if the aircraft has no range data.
 * - Returns `false` otherwise.
 */
export function canServeRoutes(
  aircraft: Aircraft,
  cities: City[],
): boolean | "unverified" {
  if (cities.length < 2) return true; // no route to check

  const range = aircraft.specs.range_nm;
  if (range == null) return "unverified";

  const longest = longestRouteNm(cities);
  return range * 0.85 >= longest;
}
