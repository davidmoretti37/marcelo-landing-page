"use client";

import { useCallback } from "react";
import type { City, ShowroomFilters } from "@/lib/showroom/types";
import { SHOWROOM_CITIES, QUICK_ROUTES } from "@/lib/showroom/cities";
import { ShowroomMap } from "@/components/showroom/map/ShowroomMap";

interface RouteStepProps {
  filters: ShowroomFilters;
  onUpdateFilters: (partial: Partial<ShowroomFilters>) => void;
}

export function RouteStep({
  filters,
  onUpdateFilters,
}: RouteStepProps) {
  const { selectedCities } = filters;

  const isCitySelected = useCallback(
    (cityName: string) =>
      selectedCities.some((c) => c.name === cityName),
    [selectedCities],
  );

  const toggleCity = useCallback(
    (cityName: string) => {
      const city = SHOWROOM_CITIES.find((c) => c.name === cityName);
      if (!city) return;

      const already = selectedCities.some((c) => c.name === cityName);
      if (already) {
        onUpdateFilters({
          selectedCities: selectedCities.filter(
            (c) => c.name !== cityName,
          ),
        });
      } else {
        onUpdateFilters({
          selectedCities: [...selectedCities, city],
        });
      }
    },
    [selectedCities, onUpdateFilters],
  );

  const handleCityToggle = useCallback(
    (city: City) => {
      toggleCity(city.name);
    },
    [toggleCity],
  );

  const toggleQuickRoute = useCallback(
    (cities: [string, string]) => {
      const [a, b] = cities;
      const bothSelected = isCitySelected(a) && isCitySelected(b);

      if (bothSelected) {
        // Remove both
        onUpdateFilters({
          selectedCities: selectedCities.filter(
            (c) => c.name !== a && c.name !== b,
          ),
        });
      } else {
        // Add both (deduplicating)
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
      onUpdateFilters({
        selectedCities: selectedCities.filter(
          (c) => c.name !== cityName,
        ),
      });
    },
    [selectedCities, onUpdateFilters],
  );

  return (
    <div className="space-y-5">
      {/* Headline */}
      <div className="text-center space-y-2">
        <h2
          className="text-2xl md:text-4xl"
          style={{
            fontFamily: "var(--font-playfair)",
            color: "var(--sr-text)",
            fontWeight: 400,
          }}
        >
          Where do you fly?
        </h2>
        <p
          className="text-base md:text-lg"
          style={{
            color: "var(--sr-text-muted)",
            fontFamily: "var(--font-dm-sans)",
          }}
        >
          Select your most frequent destinations
        </p>
      </div>

      {/* Interactive map */}
      <div
        className="relative w-full rounded-xl overflow-hidden"
        style={{
          background: "var(--sr-surface)",
          border: "1px solid var(--sr-border)",
        }}
      >
        <ShowroomMap
          selectedCities={selectedCities}
          onCityToggle={handleCityToggle}
        />
      </div>

      {/* Selected cities pills */}
      {selectedCities.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {selectedCities.map((city) => (
            <span
              key={city.name}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all duration-200"
              style={{
                background: "rgba(200,164,78,0.12)",
                border: "1px solid var(--sr-border-gold)",
                color: "var(--sr-gold-light)",
                fontFamily: "var(--font-dm-sans)",
              }}
            >
              {city.name}
              <button
                onClick={() => removeCity(city.name)}
                className="w-4 h-4 flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
                style={{ color: "var(--sr-gold)" }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Quick routes */}
      <div className="space-y-4">
        <h3
          className="text-xs tracking-widest uppercase text-center"
          style={{
            color: "var(--sr-text-dim)",
            fontFamily: "var(--font-dm-sans)",
          }}
        >
          Popular Routes
        </h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {QUICK_ROUTES.map((route) => {
            const isActive =
              isCitySelected(route.cities[0]) &&
              isCitySelected(route.cities[1]);

            return (
              <button
                key={route.label}
                onClick={() => toggleQuickRoute(route.cities)}
                className="px-3 py-1.5 rounded-full text-sm transition-all duration-200"
                style={{
                  background: isActive
                    ? "rgba(200,164,78,0.15)"
                    : "transparent",
                  border: isActive
                    ? "1px solid var(--sr-gold)"
                    : "1px solid var(--sr-border)",
                  color: isActive
                    ? "var(--sr-gold)"
                    : "var(--sr-text-muted)",
                  fontFamily: "var(--font-dm-sans)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor =
                      "var(--sr-border-gold)";
                    e.currentTarget.style.color = "var(--sr-text)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor =
                      "var(--sr-border)";
                    e.currentTarget.style.color =
                      "var(--sr-text-muted)";
                  }
                }}
              >
                {route.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
