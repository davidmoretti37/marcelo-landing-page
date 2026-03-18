"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ShowroomFilters } from "@/lib/showroom/types";
import { useInventory, seedDemoData } from "@/lib/showroom/store";
import { filterAircraft } from "@/lib/showroom/filters";
import { StepProgress } from "@/components/showroom/ui/StepProgress";
import { RouteStep } from "@/components/showroom/steps/RouteStep";
import { PassengerStep } from "@/components/showroom/steps/PassengerStep";
import { BudgetStep } from "@/components/showroom/steps/BudgetStep";
import { ResultsStep } from "@/components/showroom/steps/ResultsStep";

const DEFAULT_FILTERS: ShowroomFilters = {
  selectedCities: [],
  minPassengers: 1,
  requireStandupCabin: false,
  requireFlatBerthing: false,
  budgetMin: 0,
  budgetMax: 100_000_000,
  sortBy: "price_desc",
};

export default function ShowroomInline() {
  const [step, setStep] = useState(0);
  const [filters, setFilters] = useState<ShowroomFilters>(DEFAULT_FILTERS);
  const [transitioning, setTransitioning] = useState(false);

  const { aircraft, loading } = useInventory();

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
    <section
      id="showroom"
      className="py-12 md:py-20"
      style={{
        "--sr-bg": "#F8F7F4",
        "--sr-surface": "#EFEDE8",
        "--sr-surface-hover": "#E8E5DF",
        "--sr-gold": "#B8976A",
        "--sr-gold-light": "#A07D4E",
        "--sr-gold-dim": "rgba(184,151,106,0.4)",
        "--sr-text": "#0F0F0D",
        "--sr-text-muted": "#6B6860",
        "--sr-text-dim": "#A8A49E",
        "--sr-border": "rgba(0,0,0,0.08)",
        "--sr-border-gold": "rgba(184,151,106,0.3)",
        background: "#F8F7F4",
      } as React.CSSProperties}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-3 border-b max-w-6xl mx-auto"
        style={{ borderColor: "var(--sr-border)" }}
      >
        <div className="flex items-center gap-2" style={{ color: "var(--sr-gold)" }}>
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
            <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
          </svg>
          <span
            className="text-xs tracking-widest uppercase"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Digital Showroom
          </span>
        </div>

        <div className="flex-1 max-w-md mx-6">
          <StepProgress currentStep={step} onStepClick={handleStepClick} />
        </div>

        <div
          className="hidden md:block text-xs"
          style={{
            color: "var(--sr-text-muted)",
            fontFamily: "var(--font-dm-sans)",
          }}
        >
          Step {step + 1} of 4
        </div>
      </div>

      {/* Main content */}
      <div
        className="max-w-5xl mx-auto px-6 py-6 md:py-8"
        style={{
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? "translateY(12px)" : "translateY(0)",
          transition: "opacity 250ms ease, transform 250ms ease",
        }}
      >
        {loading ? (
          <div
            className="flex items-center justify-center h-48"
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

      {/* Bottom bar */}
      <div
        className="flex items-center justify-between px-6 py-3 border-t max-w-6xl mx-auto"
        style={{ borderColor: "var(--sr-border)" }}
      >
        <div className="w-24">
          {step > 0 && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all duration-200"
              style={{
                color: "var(--sr-text-muted)",
                border: "1px solid var(--sr-border)",
                fontFamily: "var(--font-dm-sans)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--sr-border-gold)";
                e.currentTarget.style.color = "var(--sr-text)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--sr-border)";
                e.currentTarget.style.color = "var(--sr-text-muted)";
              }}
            >
              <svg
                width="14"
                height="14"
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

        <div className="w-24 flex justify-end">
          {step < 3 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-1.5 text-sm rounded-lg transition-all duration-200"
              style={{
                background: "var(--sr-gold)",
                color: "var(--sr-bg)",
                fontFamily: "var(--font-dm-sans)",
                fontWeight: 600,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--sr-gold-light)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--sr-gold)";
              }}
            >
              {step === 2 ? "View" : "Next"}
              <svg
                width="14"
                height="14"
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
              onClick={() => {
                const contact = document.getElementById("contact");
                if (contact) contact.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-4 py-1.5 text-sm rounded-lg transition-all duration-200"
              style={{
                border: "1px solid var(--sr-gold)",
                color: "var(--sr-gold)",
                fontFamily: "var(--font-dm-sans)",
                fontWeight: 600,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--sr-gold)";
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
    </section>
  );
}
