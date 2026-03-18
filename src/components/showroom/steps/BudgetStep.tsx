"use client";

import { useCallback, useRef, useState } from "react";
import type { ShowroomFilters } from "@/lib/showroom/types";

interface BudgetStepProps {
  filters: ShowroomFilters;
  onUpdateFilters: (partial: Partial<ShowroomFilters>) => void;
  filteredCount: number;
}

const SLIDER_MIN = 1_000_000;
const SLIDER_MAX = 80_000_000;
const SLIDER_STEP = 1_000_000;

const PRESETS: { label: string; min: number; max: number }[] = [
  { label: "Under $10M", min: SLIDER_MIN, max: 10_000_000 },
  { label: "$10M \u2013 $25M", min: 10_000_000, max: 25_000_000 },
  { label: "$25M \u2013 $50M", min: 25_000_000, max: 50_000_000 },
  { label: "$50M+", min: 50_000_000, max: SLIDER_MAX },
];

function formatBudget(value: number): string {
  const millions = value / 1_000_000;
  if (millions % 1 === 0) return `$${millions}M`;
  return `$${millions.toFixed(1)}M`;
}

export function BudgetStep({
  filters,
  onUpdateFilters,
  filteredCount,
}: BudgetStepProps) {
  const budgetMin = Math.max(filters.budgetMin || SLIDER_MIN, SLIDER_MIN);
  const budgetMax = Math.min(
    filters.budgetMax || SLIDER_MAX,
    SLIDER_MAX,
  );

  const setRange = useCallback(
    (min: number, max: number) => {
      onUpdateFilters({
        budgetMin: Math.max(min, SLIDER_MIN),
        budgetMax: Math.min(max, SLIDER_MAX),
      });
    },
    [onUpdateFilters],
  );

  const isPresetActive = useCallback(
    (preset: (typeof PRESETS)[number]) =>
      budgetMin === preset.min && budgetMax === preset.max,
    [budgetMin, budgetMax],
  );

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
          Your investment
        </h2>
        <p
          className="text-base md:text-lg"
          style={{
            color: "var(--sr-text-muted)",
            fontFamily: "var(--font-dm-sans)",
          }}
        >
          Set your acquisition budget range
        </p>
      </div>

      {/* Budget display */}
      <div className="text-center">
        <p
          className="text-2xl md:text-4xl tabular-nums"
          style={{
            fontFamily: "var(--font-jetbrains)",
            color: "var(--sr-text)",
            fontWeight: 300,
          }}
        >
          <span style={{ color: "var(--sr-gold)" }}>
            {formatBudget(budgetMin)}
          </span>
          <span
            className="mx-3 md:mx-4"
            style={{ color: "var(--sr-text-dim)" }}
          >
            &ndash;
          </span>
          <span style={{ color: "var(--sr-gold)" }}>
            {formatBudget(budgetMax)}
          </span>
        </p>
      </div>

      {/* Slider */}
      <div className="max-w-2xl mx-auto px-4">
        <GoldSlider
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          step={SLIDER_STEP}
          valueLow={budgetMin}
          valueHigh={budgetMax}
          onChange={setRange}
        />
      </div>

      {/* Presets */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {PRESETS.map((preset) => {
          const active = isPresetActive(preset);
          return (
            <button
              key={preset.label}
              onClick={() => setRange(preset.min, preset.max)}
              className="px-5 py-2.5 rounded-full text-sm transition-all duration-200"
              style={{
                background: active
                  ? "rgba(200,164,78,0.15)"
                  : "transparent",
                border: active
                  ? "1.5px solid var(--sr-gold)"
                  : "1.5px solid var(--sr-border)",
                color: active
                  ? "var(--sr-gold)"
                  : "var(--sr-text-muted)",
                fontFamily: "var(--font-dm-sans)",
                fontWeight: active ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.borderColor =
                    "var(--sr-border-gold)";
                  e.currentTarget.style.color = "var(--sr-text)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.borderColor =
                    "var(--sr-border)";
                  e.currentTarget.style.color =
                    "var(--sr-text-muted)";
                }
              }}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Guidance text */}
      <p
        className="text-center text-sm"
        style={{
          color: "var(--sr-text-dim)",
          fontFamily: "var(--font-dm-sans)",
        }}
      >
        {filteredCount > 0 ? (
          <>
            <span
              style={{
                color: "var(--sr-gold)",
                fontFamily: "var(--font-jetbrains)",
              }}
            >
              {filteredCount}
            </span>{" "}
            aircraft in this range
          </>
        ) : (
          "No aircraft match \u2014 try a wider range"
        )}
      </p>
    </div>
  );
}

// ── GoldSlider ──────────────────────────────────────────────────────────────

interface GoldSliderProps {
  min: number;
  max: number;
  step: number;
  valueLow: number;
  valueHigh: number;
  onChange: (low: number, high: number) => void;
}

function GoldSlider({
  min,
  max,
  step,
  valueLow,
  valueHigh,
  onChange,
}: GoldSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"low" | "high" | null>(null);

  const toPercent = useCallback(
    (value: number) => ((value - min) / (max - min)) * 100,
    [min, max],
  );

  const fromClientX = useCallback(
    (clientX: number): number => {
      if (!trackRef.current) return min;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width),
      );
      const raw = min + pct * (max - min);
      return Math.round(raw / step) * step;
    },
    [min, max, step],
  );

  const handlePointerDown = useCallback(
    (thumb: "low" | "high") =>
      (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(thumb);
      },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!dragging) return;
      const val = fromClientX(e.clientX);
      if (dragging === "low") {
        onChange(Math.min(val, valueHigh - step), valueHigh);
      } else {
        onChange(valueLow, Math.max(val, valueLow + step));
      }
    },
    [dragging, fromClientX, onChange, valueLow, valueHigh, step],
  );

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  const lowPct = toPercent(valueLow);
  const highPct = toPercent(valueHigh);

  return (
    <div className="relative py-6">
      {/* Track background */}
      <div
        ref={trackRef}
        className="relative w-full h-1 rounded-full"
        style={{ background: "var(--sr-border)" }}
      >
        {/* Active fill */}
        <div
          className="absolute top-0 h-full rounded-full"
          style={{
            left: `${lowPct}%`,
            width: `${highPct - lowPct}%`,
            background:
              "linear-gradient(90deg, var(--sr-gold), var(--sr-gold-light))",
          }}
        />
      </div>

      {/* Low thumb */}
      <button
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full transition-shadow duration-200"
        style={{
          left: `${lowPct}%`,
          background: "var(--sr-gold)",
          border: "3px solid var(--sr-bg)",
          boxShadow:
            dragging === "low"
              ? "0 0 16px rgba(200,164,78,0.5)"
              : "0 0 8px rgba(200,164,78,0.2)",
          cursor: "grab",
          zIndex: 10,
          touchAction: "none",
        }}
        onPointerDown={handlePointerDown("low")}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* High thumb */}
      <button
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full transition-shadow duration-200"
        style={{
          left: `${highPct}%`,
          background: "var(--sr-gold)",
          border: "3px solid var(--sr-bg)",
          boxShadow:
            dragging === "high"
              ? "0 0 16px rgba(200,164,78,0.5)"
              : "0 0 8px rgba(200,164,78,0.2)",
          cursor: "grab",
          zIndex: 10,
          touchAction: "none",
        }}
        onPointerDown={handlePointerDown("high")}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Min/Max labels */}
      <div className="flex justify-between mt-3">
        <span
          className="text-xs"
          style={{
            color: "var(--sr-text-dim)",
            fontFamily: "var(--font-jetbrains)",
          }}
        >
          {formatBudget(min)}
        </span>
        <span
          className="text-xs"
          style={{
            color: "var(--sr-text-dim)",
            fontFamily: "var(--font-jetbrains)",
          }}
        >
          {formatBudget(max)}
        </span>
      </div>
    </div>
  );
}
