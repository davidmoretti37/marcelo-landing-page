"use client";

import { useCallback } from "react";
import type { City, ShowroomFilters } from "@/lib/showroom/types";
import { SHOWROOM_CITIES, QUICK_ROUTES } from "@/lib/showroom/cities";
import { ShowroomMap } from "@/components/showroom/map/ShowroomMap";

interface RouteStepInlineProps {
  filters: ShowroomFilters;
  onUpdateFilters: (partial: Partial<ShowroomFilters>) => void;
  filteredCount?: number;
  onNext?: () => void;
  currentStep?: number;
  onStepClick?: (step: number) => void;
}

export function RouteStepInline({ filters, onUpdateFilters, filteredCount, onNext, currentStep = 0, onStepClick }: RouteStepInlineProps) {
  const { selectedCities } = filters;

  const isCitySelected = useCallback(
    (cityName: string) => selectedCities.some((c) => c.name === cityName),
    [selectedCities],
  );

  const handleCityToggle = useCallback(
    (city: City) => {
      const already = selectedCities.some((c) => c.name === city.name);
      onUpdateFilters({
        selectedCities: already
          ? selectedCities.filter((c) => c.name !== city.name)
          : [...selectedCities, city],
      });
    },
    [selectedCities, onUpdateFilters],
  );

  const toggleQuickRoute = useCallback(
    (cities: [string, string]) => {
      const [a, b] = cities;
      const bothSelected = isCitySelected(a) && isCitySelected(b);
      if (bothSelected) {
        onUpdateFilters({
          selectedCities: selectedCities.filter((c) => c.name !== a && c.name !== b),
        });
      } else {
        const next = [...selectedCities];
        for (const name of cities) {
          if (!next.some((c) => c.name === name)) {
            const city = SHOWROOM_CITIES.find((c) => c.name === name);
            if (city) next.push(city);
          }
        }
        onUpdateFilters({ selectedCities: next });
      }
    },
    [selectedCities, isCitySelected, onUpdateFilters],
  );

  const removeCity = useCallback(
    (cityName: string) => {
      onUpdateFilters({ selectedCities: selectedCities.filter((c) => c.name !== cityName) });
    },
    [selectedCities, onUpdateFilters],
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "85vh",
        minHeight: 550,
        marginLeft: "calc(-50vw + 50%)",
        overflow: "hidden",
      }}
    >
      {/* Map fills entire container */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
        <ShowroomMap selectedCities={selectedCities} onCityToggle={handleCityToggle} />
      </div>

      {/* Step progress — right side, vertical */}
      <div
        style={{
          position: "absolute",
          right: 24,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          padding: "20px 12px",
          borderRadius: 16,
          background: "rgba(255,255,255,0.8)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(0,0,0,0.05)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        }}
      >
        {["Routes", "Passengers", "Budget", "Results"].map((label, i) => {
          const isActive = i === currentStep;
          const isDone = i < currentStep;
          return (
            <button
              key={label}
              onClick={() => onStepClick?.(i)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                background: "none",
                border: "none",
                cursor: i < currentStep ? "pointer" : "default",
                padding: 0,
                opacity: isActive || isDone ? 1 : 0.35,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: isActive
                    ? "2px solid #B8976A"
                    : isDone
                      ? "2px solid #B8976A"
                      : "2px solid rgba(0,0,0,0.12)",
                  background: isDone ? "#B8976A" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isDone ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: isActive ? "#B8976A" : "rgba(0,0,0,0.15)",
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  fontSize: 9,
                  fontFamily: "var(--font-inter)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: isActive ? "#B8976A" : isDone ? "#6B6660" : "#A8A49E",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Aircraft count — bottom left */}
      {filteredCount !== undefined && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 24,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 12,
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            fontFamily: "var(--font-inter)",
            fontSize: 13,
            color: "#6B6660",
          }}
        >
          <span style={{ color: "#B8976A", fontWeight: 600 }}>{filteredCount}</span>
          aircraft match
        </div>
      )}

      {/* Next button — bottom right */}
      {onNext && (
        <button
          onClick={onNext}
          style={{
            position: "absolute",
            bottom: 20,
            right: 24,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 20px",
            borderRadius: 12,
            background: "#B8976A",
            color: "#FAF7F2",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-inter)",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 2px 12px rgba(184,151,106,0.3)",
            transition: "all 200ms",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#A07D4E"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#B8976A"; }}
        >
          Next
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      {/* Title — pinned to top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          textAlign: "center",
          paddingTop: 4,
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-inter)",
            color: "#0F0F0D",
            fontWeight: 300,
            fontSize: "clamp(1.5rem, 3vw, 2.4rem)",
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          Where do you fly?
        </h2>
        <p
          style={{
            color: "#8A8680",
            fontFamily: "var(--font-inter)",
            fontSize: "clamp(0.8rem, 1.5vw, 1rem)",
            marginTop: 4,
          }}
        >
          Select your most frequent destinations
        </p>
      </div>

      {/* Pills — pinned to bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: "0 16px 20px",
        }}
      >
        {/* Selected city pills */}
        {selectedCities.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 12 }}>
            {selectedCities.map((city) => (
              <span
                key={city.name}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 12px",
                  borderRadius: 9999,
                  fontSize: 13,
                  background: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: "1px solid rgba(184,151,106,0.3)",
                  color: "#0F0F0D",
                  fontFamily: "var(--font-inter)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                {city.name}
                <button
                  onClick={() => removeCity(city.name)}
                  style={{
                    width: 16, height: 16,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 9999, border: "none", background: "none",
                    cursor: "pointer", color: "#A8A49E", padding: 0,
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Popular routes */}
        <div style={{ textAlign: "center" }}>
          <h3
            style={{
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#A8A49E",
              fontFamily: "var(--font-inter)",
              marginBottom: 8,
              fontWeight: 400,
            }}
          >
            Popular Routes
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", maxWidth: 720, margin: "0 auto" }}>
            {QUICK_ROUTES.map((route) => {
              const isActive = isCitySelected(route.cities[0]) && isCitySelected(route.cities[1]);
              return (
                <button
                  key={route.label}
                  onClick={() => toggleQuickRoute(route.cities)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 9999,
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 200ms",
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                    background: isActive ? "rgba(184,151,106,0.18)" : "rgba(255,255,255,0.75)",
                    border: isActive ? "1px solid rgba(184,151,106,0.5)" : "1px solid rgba(0,0,0,0.06)",
                    color: isActive ? "#8B7340" : "#6B6660",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  {route.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
