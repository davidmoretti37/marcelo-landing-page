"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ShowroomFilters } from "@/lib/showroom/types";
import { useInventory, seedDemoData } from "@/lib/showroom/store";
import { filterAircraft } from "@/lib/showroom/filters";
import { StepProgress } from "./ui/StepProgress";
import { RouteStep } from "./steps/RouteStep";
import { PassengerStep } from "./steps/PassengerStep";
import { BudgetStep } from "./steps/BudgetStep";
import { ResultsStep } from "./steps/ResultsStep";

const DEFAULT_FILTERS: ShowroomFilters = {
  selectedCities: [],
  minPassengers: 1,
  requireStandupCabin: false,
  requireFlatBerthing: false,
  budgetMin: 0,
  budgetMax: 100_000_000,
  sortBy: "price_desc",
};

interface ShowroomShellProps {
  onExit: () => void;
}

export function ShowroomShell({ onExit }: ShowroomShellProps) {
  const [step, setStep] = useState(0);
  const [filters, setFilters] = useState<ShowroomFilters>(DEFAULT_FILTERS);
  const [transitioning, setTransitioning] = useState(false);

  const { aircraft, loading } = useInventory();

  // Seed demo data on mount
  useEffect(() => {
    seedDemoData();
  }, []);

  const filteredAircraft = useMemo(
    () => filterAircraft(aircraft, filters),
    [aircraft, filters],
  );

  const handleUpdateFilters = useCallback(
    (partial: Partial<ShowroomFilters>) => {
      setFilters((prev) => ({ ...prev, ...partial }));
    },
    [],
  );

  const transitionTo = useCallback((nextStep: number) => {
    setTransitioning(true);
    setTimeout(() => {
      setStep(nextStep);
      setTimeout(() => setTransitioning(false), 50);
    }, 300);
  }, []);

  const handleNext = useCallback(() => {
    if (step < 3) transitionTo(step + 1);
  }, [step, transitionTo]);

  const handleBack = useCallback(() => {
    if (step > 0) transitionTo(step - 1);
  }, [step, transitionTo]);

  const handleStepClick = useCallback(
    (targetStep: number) => {
      if (targetStep < step) transitionTo(targetStep);
    },
    [step, transitionTo],
  );

  const stepProps = {
    filters,
    onUpdateFilters: handleUpdateFilters,
    filteredCount: filteredAircraft.length,
  };

  return (
    <div
      style={{
        "--sr-bg": "#0a0a0f",
        "--sr-surface": "#12121a",
        "--sr-surface-hover": "#1a1a25",
        "--sr-gold": "#c8a44e",
        "--sr-gold-light": "#e8d5a0",
        "--sr-text": "rgba(255,255,255,0.9)",
        "--sr-text-muted": "rgba(255,255,255,0.5)",
        "--sr-text-dim": "rgba(255,255,255,0.3)",
        "--sr-border": "rgba(255,255,255,0.06)",
        "--sr-border-gold": "rgba(200,164,78,0.15)",
        background: "var(--sr-bg)",
      } as React.CSSProperties}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
    >
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{ background: "var(--sr-bg)" }}
      />

      {/* Content layer */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--sr-border)" }}
        >
          {/* Logo */}
          <button
            onClick={onExit}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
            style={{ color: "var(--sr-gold)" }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
            </svg>
            <span
              className="text-sm tracking-widest uppercase"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Spark Jets
            </span>
          </button>

          {/* Step progress */}
          <div className="flex-1 max-w-lg mx-8">
            <StepProgress
              currentStep={step}
              onStepClick={handleStepClick}
            />
          </div>

          {/* Step label (desktop) */}
          <div
            className="hidden md:block text-sm"
            style={{
              color: "var(--sr-text-muted)",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            Step {step + 1} of 4
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto">
          <div
            className="max-w-5xl mx-auto px-6 py-8 md:py-12"
            style={{
              opacity: transitioning ? 0 : 1,
              transform: transitioning
                ? "translateY(20px)"
                : "translateY(0)",
              transition:
                "opacity 300ms ease, transform 300ms ease",
            }}
          >
            {loading ? (
              <div
                className="flex items-center justify-center h-64"
                style={{ color: "var(--sr-text-muted)" }}
              >
                <div
                  className="w-8 h-8 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: "var(--sr-border)",
                    borderTopColor: "var(--sr-gold)",
                  }}
                />
              </div>
            ) : (
              <>
                {step === 0 && <RouteStep {...stepProps} />}
                {step === 1 && <PassengerStep {...stepProps} />}
                {step === 2 && <BudgetStep {...stepProps} />}
                {step === 3 && (
                  <ResultsStep
                    filters={filters}
                    onUpdateFilters={handleUpdateFilters}
                    aircraft={filteredAircraft}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex items-center justify-between px-6 py-4 border-t"
          style={{ borderColor: "var(--sr-border)" }}
        >
          {/* Back button */}
          <div className="w-28">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all duration-200"
                style={{
                  color: "var(--sr-text-muted)",
                  border: "1px solid var(--sr-border)",
                  fontFamily: "var(--font-dm-sans)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor =
                    "var(--sr-border-gold)";
                  e.currentTarget.style.color = "var(--sr-text)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor =
                    "var(--sr-border)";
                  e.currentTarget.style.color =
                    "var(--sr-text-muted)";
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back
              </button>
            )}
          </div>

          {/* Match counter */}
          <div
            className="text-sm"
            style={{
              color: "var(--sr-text-muted)",
              fontFamily: "var(--font-jetbrains)",
            }}
          >
            <span style={{ color: "var(--sr-gold)" }}>
              {filteredAircraft.length}
            </span>{" "}
            aircraft match
          </div>

          {/* Next / Skip button */}
          <div className="w-28 flex justify-end">
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-5 py-2 text-sm rounded-lg transition-all duration-200"
                style={{
                  background: "var(--sr-gold)",
                  color: "var(--sr-bg)",
                  fontFamily: "var(--font-dm-sans)",
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "var(--sr-gold-light)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "var(--sr-gold)";
                }}
              >
                {step === 2 ? "View" : "Next"}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ) : (
              <button
                onClick={onExit}
                className="px-5 py-2 text-sm rounded-lg transition-all duration-200"
                style={{
                  border: "1px solid var(--sr-gold)",
                  color: "var(--sr-gold)",
                  fontFamily: "var(--font-dm-sans)",
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "var(--sr-gold)";
                  e.currentTarget.style.color = "var(--sr-bg)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--sr-gold)";
                }}
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
