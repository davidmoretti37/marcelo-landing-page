"use client";

import { useCallback, useState } from "react";
import type { Aircraft, ShowroomFilters } from "@/lib/showroom/types";
import AircraftDetail from "@/components/showroom/AircraftDetail";

interface ResultsStepProps {
  filters: ShowroomFilters;
  onUpdateFilters: (partial: Partial<ShowroomFilters>) => void;
  aircraft: Aircraft[];
}

function formatPrice(price: number): string {
  return "$" + price.toLocaleString("en-US");
}

function formatRange(nm: number | undefined): string {
  if (nm == null) return "N/A";
  return nm.toLocaleString("en-US") + " NM";
}

function formatSpeed(ktas: number | undefined): string {
  if (ktas == null) return "N/A";
  return ktas + " ktas";
}

export function ResultsStep({
  filters,
  onUpdateFilters,
  aircraft,
}: ResultsStepProps) {
  const [detailAircraft, setDetailAircraft] = useState<Aircraft | null>(
    null,
  );

  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onUpdateFilters({
        sortBy: e.target.value as ShowroomFilters["sortBy"],
      });
    },
    [onUpdateFilters],
  );

  // Empty state
  if (aircraft.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: "var(--sr-surface)",
            border: "1px solid var(--sr-border)",
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--sr-text-dim)" }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </div>
        <h3
          className="text-xl"
          style={{
            fontFamily: "var(--font-playfair)",
            color: "var(--sr-text)",
          }}
        >
          No aircraft match your criteria
        </h3>
        <p
          className="text-sm"
          style={{
            color: "var(--sr-text-muted)",
            fontFamily: "var(--font-dm-sans)",
          }}
        >
          Try adjusting your filters -- widen the budget range, reduce
          passengers, or remove route requirements.
        </p>
      </div>
    );
  }

  // Show Fleet-style detail view when an aircraft is selected
  if (detailAircraft) {
    return (
      <AircraftDetail
        aircraft={detailAircraft}
        onClose={() => setDetailAircraft(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2
          className="text-xl md:text-2xl"
          style={{
            fontFamily: "var(--font-playfair)",
            color: "var(--sr-text)",
            fontWeight: 400,
          }}
        >
          <span
            style={{
              color: "var(--sr-gold)",
              fontFamily: "var(--font-jetbrains)",
            }}
          >
            {aircraft.length}
          </span>{" "}
          {aircraft.length === 1 ? "aircraft" : "aircraft"} found
        </h2>

        {/* Sort dropdown */}
        <select
          value={filters.sortBy}
          onChange={handleSortChange}
          className="appearance-none px-4 py-2 pr-8 rounded-lg text-sm cursor-pointer outline-none transition-colors"
          style={{
            background: "var(--sr-surface)",
            border: "1px solid var(--sr-border)",
            color: "var(--sr-text-muted)",
            fontFamily: "var(--font-dm-sans)",
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='rgba(0,0,0,0.3)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
          }}
        >
          <option value="price_desc">Price: High to Low</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="year_desc">Newest First</option>
          <option value="range_desc">Longest Range</option>
          <option value="pax_desc">Most Passengers</option>
        </select>
      </div>

      {/* Aircraft grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {aircraft.map((ac) => (
          <AircraftCard
            key={ac.id}
            aircraft={ac}
            onViewDetails={() => setDetailAircraft(ac)}
          />
        ))}
      </div>
    </div>
  );
}

// ── AircraftCard ────────────────────────────────────────────────────────────

function AircraftCard({
  aircraft,
  onViewDetails,
}: {
  aircraft: Aircraft;
  onViewDetails: () => void;
}) {
  const hasPhoto = aircraft.photos.length > 0;
  const pax =
    aircraft.specs.maxPassengers ?? aircraft.specs.typicalPax ?? null;

  const featurePills: string[] = [];
  if (aircraft.features.standupCabin) featurePills.push("Stand-up cabin");
  if (aircraft.features.flatBerthing) featurePills.push("Flat-bed");
  if (aircraft.features.wifi) featurePills.push("WiFi");
  if (aircraft.features.freshInterior) featurePills.push("Fresh interior");

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300 group"
      style={{
        background: "var(--sr-surface)",
        border: "1px solid var(--sr-border)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--sr-border-gold)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--sr-border)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Photo area */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: "16/10", background: "#E8E5DF" }}
      >
        {hasPhoto ? (
          <img
            src={aircraft.photos[0].url}
            alt={aircraft.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--sr-text-dim)", opacity: 0.4 }}
            >
              <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
            </svg>
          </div>
        )}

        {/* Category badge */}
        <div
          className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider"
          style={{
            background: "rgba(255,255,255,0.85)",
            border: "1px solid var(--sr-border-gold)",
            color: "var(--sr-gold)",
            fontFamily: "var(--font-dm-sans)",
            backdropFilter: "blur(8px)",
          }}
        >
          {aircraft.category}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Name + year */}
        <div>
          <h3
            className="text-base font-medium leading-tight"
            style={{
              color: "var(--sr-text)",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            {aircraft.name}
          </h3>
          <p
            className="text-xs mt-0.5"
            style={{
              color: "var(--sr-text-dim)",
              fontFamily: "var(--font-jetbrains)",
            }}
          >
            {aircraft.year} &middot; S/N {aircraft.serialNumber}
          </p>
        </div>

        {/* Specs mini grid */}
        <div
          className="grid grid-cols-2 gap-x-4 gap-y-2"
          style={{ fontFamily: "var(--font-jetbrains)" }}
        >
          <SpecItem label="Range" value={formatRange(aircraft.specs.range_nm)} />
          <SpecItem
            label="Passengers"
            value={pax != null ? String(pax) : "N/A"}
          />
          <SpecItem
            label="Speed"
            value={formatSpeed(aircraft.specs.cruiseSpeed_ktas)}
          />
          <SpecItem
            label="Price"
            value={
              aircraft.pricing.showPrice
                ? formatPrice(aircraft.pricing.askingPrice)
                : "On Request"
            }
            gold
          />
        </div>

        {/* Feature pills */}
        {featurePills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {featurePills.map((f) => (
              <span
                key={f}
                className="px-2 py-0.5 rounded text-[10px]"
                style={{
                  background: "rgba(0,0,0,0.04)",
                  color: "var(--sr-text-dim)",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                {f}
              </span>
            ))}
          </div>
        )}

        {/* View Details button */}
        <button
          onClick={onViewDetails}
          className="w-full py-2.5 rounded-lg text-sm transition-all duration-200"
          style={{
            border: "1px solid var(--sr-border-gold)",
            color: "var(--sr-gold)",
            fontFamily: "var(--font-dm-sans)",
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(200,164,78,0.1)";
            e.currentTarget.style.borderColor = "var(--sr-gold)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "var(--sr-border-gold)";
          }}
        >
          View Details
        </button>
      </div>
    </div>
  );
}

// ── SpecItem (card sub-component) ──────────────────────────────────────────

function SpecItem({
  label,
  value,
  gold = false,
}: {
  label: string;
  value: string;
  gold?: boolean;
}) {
  return (
    <div>
      <p
        className="text-[10px] uppercase tracking-wider"
        style={{
          color: "var(--sr-text-dim)",
          fontFamily: "var(--font-dm-sans)",
        }}
      >
        {label}
      </p>
      <p
        className="text-sm tabular-nums"
        style={{
          color: gold ? "var(--sr-gold)" : "var(--sr-text)",
          fontFamily: "var(--font-jetbrains)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

// AircraftDetail is now imported from @/components/showroom/AircraftDetail.tsx
