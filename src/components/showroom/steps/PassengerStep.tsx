"use client";

import { useCallback } from "react";
import type { ShowroomFilters } from "@/lib/showroom/types";

interface PassengerStepProps {
  filters: ShowroomFilters;
  onUpdateFilters: (partial: Partial<ShowroomFilters>) => void;
}

export function PassengerStep({
  filters,
  onUpdateFilters,
}: PassengerStepProps) {
  const { minPassengers, requireStandupCabin, requireFlatBerthing } = filters;

  const increment = useCallback(() => {
    if (minPassengers < 19) {
      onUpdateFilters({ minPassengers: minPassengers + 1 });
    }
  }, [minPassengers, onUpdateFilters]);

  const decrement = useCallback(() => {
    if (minPassengers > 1) {
      onUpdateFilters({ minPassengers: minPassengers - 1 });
    }
  }, [minPassengers, onUpdateFilters]);

  const toggleStandup = useCallback(() => {
    onUpdateFilters({ requireStandupCabin: !requireStandupCabin });
  }, [requireStandupCabin, onUpdateFilters]);

  const toggleFlatBed = useCallback(() => {
    onUpdateFilters({ requireFlatBerthing: !requireFlatBerthing });
  }, [requireFlatBerthing, onUpdateFilters]);

  return (
    <div className="space-y-12">
      {/* Headline */}
      <div className="text-center space-y-3">
        <h2
          className="text-3xl md:text-5xl"
          style={{
            fontFamily: "var(--font-playfair)",
            color: "var(--sr-text)",
            fontWeight: 400,
          }}
        >
          How many passengers?
        </h2>
        <p
          className="text-base md:text-lg"
          style={{
            color: "var(--sr-text-muted)",
            fontFamily: "var(--font-dm-sans)",
          }}
        >
          Typical party size for your flights
        </p>
      </div>

      {/* Passenger counter */}
      <div className="flex items-center justify-center gap-8 md:gap-12">
        {/* Minus button */}
        <button
          onClick={decrement}
          disabled={minPassengers <= 1}
          className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            border: "2px solid var(--sr-gold)",
            color: "var(--sr-gold)",
            opacity: minPassengers <= 1 ? 0.3 : 1,
            cursor: minPassengers <= 1 ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (minPassengers > 1) {
              e.currentTarget.style.background =
                "var(--sr-gold)";
              e.currentTarget.style.color = "var(--sr-bg)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--sr-gold)";
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* Number display */}
        <div className="relative">
          {/* Glow behind number */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              filter: "blur(30px)",
              opacity: 0.15,
            }}
          >
            <span
              className="text-[80px] md:text-[120px]"
              style={{ color: "var(--sr-gold)" }}
            >
              {minPassengers}
            </span>
          </div>
          <span
            className="relative text-[80px] md:text-[120px] leading-none tabular-nums select-none"
            style={{
              fontFamily: "var(--font-jetbrains)",
              color: "var(--sr-text)",
              fontWeight: 300,
            }}
          >
            {minPassengers}
          </span>
        </div>

        {/* Plus button */}
        <button
          onClick={increment}
          disabled={minPassengers >= 19}
          className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            border: "2px solid var(--sr-gold)",
            color: "var(--sr-gold)",
            opacity: minPassengers >= 19 ? 0.3 : 1,
            cursor: minPassengers >= 19 ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (minPassengers < 19) {
              e.currentTarget.style.background =
                "var(--sr-gold)";
              e.currentTarget.style.color = "var(--sr-bg)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--sr-gold)";
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Passenger label */}
      <p
        className="text-center text-sm tracking-widest uppercase"
        style={{
          color: "var(--sr-text-dim)",
          fontFamily: "var(--font-dm-sans)",
        }}
      >
        passenger{minPassengers !== 1 ? "s" : ""} minimum
      </p>

      {/* Cabin toggles */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <CabinToggle
          label="Stand-up cabin"
          active={requireStandupCabin}
          onClick={toggleStandup}
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v10M8 8l4 4 4-4M5 12v6a2 2 0 002 2h10a2 2 0 002-2v-6" />
            </svg>
          }
        />
        <CabinToggle
          label="Flat-bed sleeping"
          active={requireFlatBerthing}
          onClick={toggleFlatBed}
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 4v16M2 8h18a2 2 0 012 2v10M2 17h20M6 8v9" />
            </svg>
          }
        />
      </div>
    </div>
  );
}

// ── CabinToggle sub-component ──────────────────────────────────────────────

function CabinToggle({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-5 py-3 rounded-full transition-all duration-200"
      style={{
        background: active
          ? "rgba(200,164,78,0.15)"
          : "transparent",
        border: active
          ? "1.5px solid var(--sr-gold)"
          : "1.5px solid var(--sr-border)",
        color: active ? "var(--sr-gold)" : "var(--sr-text-muted)",
        fontFamily: "var(--font-dm-sans)",
        fontSize: "0.875rem",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = "var(--sr-border-gold)";
          e.currentTarget.style.color = "var(--sr-text)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = "var(--sr-border)";
          e.currentTarget.style.color = "var(--sr-text-muted)";
        }
      }}
    >
      {icon}
      {label}
      {active && (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  );
}
