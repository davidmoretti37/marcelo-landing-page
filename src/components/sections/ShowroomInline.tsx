"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Aircraft, ShowroomFilters } from "@/lib/showroom/types";
import { useInventory, seedDemoData } from "@/lib/showroom/store";
import { filterAircraft } from "@/lib/showroom/filters";
import { RouteStepInline as RouteStep } from "@/components/showroom/steps/RouteStepInline";
import { PassengerStep } from "@/components/showroom/steps/PassengerStep";
import { BudgetStep } from "@/components/showroom/steps/BudgetStep";
import { ResultsStep } from "@/components/showroom/steps/ResultsStep";
import AircraftDetail from "@/components/showroom/AircraftDetail";

const DEFAULT_FILTERS: ShowroomFilters = {
  selectedCities: [],
  minPassengers: 1,
  requireStandupCabin: false,
  requireFlatBerthing: false,
  budgetMin: 0,
  budgetMax: 100_000_000,
  sortBy: "price_desc",
};

const STEP_LABELS = ["Routes", "Passengers", "Budget", "Results"];

export default function ShowroomInline() {
  const [step, setStep] = useState(0);
  const [filters, setFilters] = useState<ShowroomFilters>(DEFAULT_FILTERS);
  const [transitioning, setTransitioning] = useState(false);
  const [showroomVisible, setShowroomVisible] = useState(false);
  const [detailAircraft, setDetailAircraft] = useState<Aircraft | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setShowroomVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

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
      // Scroll showroom into view so controls are visible
      const el = document.getElementById("showroom");
      if (el && nextStep > 0) el.scrollIntoView({ behavior: "smooth", block: "start" });
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

  // ─── Detail view: render outside all containers ──────────────────
  if (detailAircraft) {
    return (
      <section ref={sectionRef} id="showroom">
        <AircraftDetail
          aircraft={detailAircraft}
          onClose={() => {
            setDetailAircraft(null);
            // Scroll back to showroom
            setTimeout(() => {
              const el = document.getElementById("showroom");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 50);
          }}
        />
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      id="showroom"
      className={step === 0 ? "pt-16 pb-0" : "pt-24 pb-20 md:pt-32 md:pb-28 min-h-screen"}
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
        position: "relative",
      } as React.CSSProperties}
    >
      {/* ── Vertical step progress — right side, always visible ─────── */}
      <div
        style={{
          position: showroomVisible ? "fixed" : "absolute",
          right: 24,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 30,
          display: showroomVisible && step < 3 ? "flex" : "none",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          padding: "16px 10px",
          borderRadius: 20,
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(0,0,0,0.04)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(184,151,106,0.08)",
        }}
      >
        {STEP_LABELS.map((label, i) => {
          const isActive = i === step;
          const isDone = i < step;
          return (
            <button
              key={label}
              onClick={() => handleStepClick(i)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                background: "none",
                border: "none",
                cursor: i < step ? "pointer" : "default",
                padding: "4px 2px",
                opacity: isActive || isDone ? 1 : 0.3,
                transition: "all 300ms ease",
              }}
            >
              {/* Connector line above (skip first) */}
              {i > 0 && (
                <div
                  style={{
                    width: 1.5,
                    height: 12,
                    marginBottom: 2,
                    background: isDone || isActive
                      ? "rgba(184,151,106,0.4)"
                      : "rgba(0,0,0,0.06)",
                    borderRadius: 1,
                    transition: "background 300ms ease",
                  }}
                />
              )}
              <div
                style={{
                  width: isActive ? 32 : 26,
                  height: isActive ? 32 : 26,
                  borderRadius: "50%",
                  border: isActive
                    ? "2px solid #B8976A"
                    : isDone
                      ? "2px solid #B8976A"
                      : "1.5px solid rgba(0,0,0,0.1)",
                  background: isDone
                    ? "linear-gradient(135deg, #C8A96E, #A07D4E)"
                    : isActive
                      ? "rgba(184,151,106,0.08)"
                      : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 300ms ease",
                  boxShadow: isDone
                    ? "0 2px 8px rgba(184,151,106,0.3)"
                    : isActive
                      ? "0 0 0 4px rgba(184,151,106,0.1)"
                      : "none",
                }}
              >
                {isDone ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <div
                    style={{
                      width: isActive ? 8 : 6,
                      height: isActive ? 8 : 6,
                      borderRadius: "50%",
                      background: isActive ? "#B8976A" : "rgba(0,0,0,0.12)",
                      transition: "all 300ms ease",
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  fontSize: 8,
                  fontFamily: "var(--font-inter)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: isActive ? "#B8976A" : isDone ? "#6B6660" : "#A8A49E",
                  fontWeight: isActive ? 700 : 400,
                  transition: "all 300ms ease",
                  lineHeight: 1,
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Main content ───────────────────────────────────────────── */}
      <div
        className={step === 0 ? "" : "max-w-5xl mx-auto px-6 py-6 md:py-8"}
        style={{
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? "translateY(12px)" : "translateY(0)",
          transition: "opacity 250ms ease, transform 250ms ease",
          ...(step === 0 ? { overflow: "visible" } : {}),
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
            {step === 0 && <RouteStep {...stepProps} onNext={handleNext} currentStep={step} onStepClick={handleStepClick} />}
            {step === 1 && <PassengerStep {...stepProps} />}
            {step === 2 && <BudgetStep {...stepProps} />}
            {step === 3 && (
              <ResultsStep
                filters={filters}
                onUpdateFilters={handleUpdateFilters}
                aircraft={filteredAircraft}
                onSelectAircraft={setDetailAircraft}
              />
            )}
          </>
        )}
      </div>

      {/* ── Floating bottom controls — steps 1+ ────────────────────── */}
      {step > 0 && showroomVisible && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "10px 12px",
            borderRadius: 16,
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(0,0,0,0.04)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(184,151,106,0.08)",
          }}
        >
          <button
            onClick={handleBack}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.06)",
              background: "transparent",
              color: "#6B6860",
              cursor: "pointer",
              fontFamily: "var(--font-inter)",
              fontSize: 13,
              fontWeight: 500,
              transition: "all 200ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(184,151,106,0.3)";
              e.currentTarget.style.color = "#0F0F0D";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.06)";
              e.currentTarget.style.color = "#6B6860";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>

          <div
            style={{
              padding: "0 12px",
              fontFamily: "var(--font-inter)",
              fontSize: 13,
              color: "#6B6860",
            }}
          >
            <span style={{ color: "#B8976A", fontWeight: 600 }}>{filteredAircraft.length}</span>
            {" "}aircraft match
          </div>

          {step < 3 ? (
            <button
              onClick={handleNext}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 18px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #C8A96E, #A07D4E)",
                color: "#FAF7F2",
                cursor: "pointer",
                fontFamily: "var(--font-inter)",
                fontSize: 13,
                fontWeight: 600,
                boxShadow: "0 2px 10px rgba(184,151,106,0.3)",
                transition: "all 200ms",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(184,151,106,0.45)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(184,151,106,0.3)"; }}
            >
              {step === 2 ? "View Results" : "Next"}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => {
                const contact = document.getElementById("contact");
                if (contact) contact.scrollIntoView({ behavior: "smooth" });
              }}
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                border: "1.5px solid #B8976A",
                background: "transparent",
                color: "#B8976A",
                cursor: "pointer",
                fontFamily: "var(--font-inter)",
                fontSize: 13,
                fontWeight: 600,
                transition: "all 200ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#B8976A";
                e.currentTarget.style.color = "#FAF7F2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#B8976A";
              }}
            >
              Done
            </button>
          )}
        </div>
      )}
    </section>
  );
}
