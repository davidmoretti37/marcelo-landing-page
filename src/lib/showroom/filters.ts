// ─── Spark Jets Showroom – Pure Filtering Logic ──────────────────────────────

import type { Aircraft, ShowroomFilters } from "./types";
import { canServeRoutes } from "./geo";

/**
 * Applies every active filter to the inventory, then sorts by the chosen
 * comparator. Only aircraft with status "available" are ever returned.
 *
 * Design rule: when a spec value is missing (undefined), the aircraft is
 * *kept* in the results — be permissive so the user never misses a match.
 */
export function filterAircraft(
  inventory: Aircraft[],
  filters: ShowroomFilters,
): Aircraft[] {
  const results = inventory.filter((ac) => {
    // ── Status gate ────────────────────────────────────────────────────────
    if (ac.status !== "available") return false;

    // ── Passenger count ────────────────────────────────────────────────────
    if (filters.minPassengers > 0) {
      const pax = ac.specs.maxPassengers ?? ac.specs.typicalPax;
      if (pax != null && pax < filters.minPassengers) return false;
    }

    // ── Standup cabin ──────────────────────────────────────────────────────
    if (filters.requireStandupCabin && !ac.features.standupCabin) return false;

    // ── Flat berthing ──────────────────────────────────────────────────────
    if (filters.requireFlatBerthing && !ac.features.flatBerthing) return false;

    // ── Budget range ───────────────────────────────────────────────────────
    if (filters.budgetMin > 0 || filters.budgetMax < Infinity) {
      const price = ac.pricing.askingPrice;
      if (filters.budgetMin > 0 && price < filters.budgetMin) return false;
      if (
        filters.budgetMax < Infinity &&
        filters.budgetMax > 0 &&
        price > filters.budgetMax
      )
        return false;
    }

    // ── Route feasibility ──────────────────────────────────────────────────
    if (filters.selectedCities.length >= 2) {
      const result = canServeRoutes(ac, filters.selectedCities);
      // Only exclude if we definitively know the aircraft can't make it
      if (result === false) return false;
    }

    return true;
  });

  // ── Sort ───────────────────────────────────────────────────────────────────
  results.sort(sortComparator(filters.sortBy));

  return results;
}

// ── Comparators ──────────────────────────────────────────────────────────────

type SortKey = ShowroomFilters["sortBy"];

function sortComparator(key: SortKey): (a: Aircraft, b: Aircraft) => number {
  switch (key) {
    case "price_asc":
      return (a, b) => a.pricing.askingPrice - b.pricing.askingPrice;
    case "price_desc":
      return (a, b) => b.pricing.askingPrice - a.pricing.askingPrice;
    case "year_desc":
      return (a, b) => b.year - a.year;
    case "range_desc":
      return (a, b) =>
        (b.specs.range_nm ?? 0) - (a.specs.range_nm ?? 0);
    case "pax_desc":
      return (a, b) =>
        (b.specs.maxPassengers ?? b.specs.typicalPax ?? 0) -
        (a.specs.maxPassengers ?? a.specs.typicalPax ?? 0);
    default:
      return () => 0;
  }
}
