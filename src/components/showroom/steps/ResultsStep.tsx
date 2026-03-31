"use client";

import { useState } from "react";
import type { Aircraft, ShowroomFilters } from "@/lib/showroom/types";
import AircraftDetail from "@/components/showroom/AircraftDetail";
import ExpandCards from "@/components/ui/expand-cards";

interface ResultsStepProps {
  filters: ShowroomFilters;
  onUpdateFilters: (partial: Partial<ShowroomFilters>) => void;
  aircraft: Aircraft[];
  onSelectAircraft?: (aircraft: Aircraft) => void;
}


export function ResultsStep({
  aircraft,
  onSelectAircraft,
}: ResultsStepProps) {
  const [detailAircraft, setDetailAircraft] = useState<Aircraft | null>(
    null,
  );

  const handleSelect = onSelectAircraft ?? setDetailAircraft;

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
            fontFamily: "var(--font-inter)",
            color: "var(--sr-text)",
          }}
        >
          No aircraft match your criteria
        </h3>
        <p
          className="text-sm"
          style={{
            color: "var(--sr-text-muted)",
            fontFamily: "var(--font-inter)",
          }}
        >
          Try adjusting your filters -- widen the budget range, reduce
          passengers, or remove route requirements.
        </p>
      </div>
    );
  }

  // Show Fleet-style detail view when an aircraft is selected (internal fallback)
  if (detailAircraft && !onSelectAircraft) {
    return (
      <AircraftDetail
        aircraft={detailAircraft}
        onClose={() => setDetailAircraft(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2
          className="text-xl md:text-2xl"
          style={{
            fontFamily: "var(--font-inter)",
            color: "var(--sr-text)",
            fontWeight: 300,
          }}
        >
          <span style={{ color: "var(--sr-gold)" }}>{aircraft.length}</span>{" "}
          aircraft found
        </h2>
        <p
          className="text-sm mt-1"
          style={{ color: "var(--sr-text-dim)", fontFamily: "var(--font-inter)" }}
        >
          Hover to explore, click to view details
        </p>
      </div>

      {/* Expanding cards — full showcase */}
      <ExpandCards aircraft={aircraft} onSelect={handleSelect} />
    </div>
  );
}

