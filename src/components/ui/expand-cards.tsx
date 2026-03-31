"use client";

import { useState } from "react";
import type { Aircraft } from "@/lib/showroom/types";

interface ExpandCardsProps {
  aircraft: Aircraft[];
  onSelect?: (aircraft: Aircraft) => void;
}

function formatPrice(price: number): string {
  if (price >= 1_000_000) return "$" + (price / 1_000_000).toFixed(0) + "M";
  return "$" + price.toLocaleString("en-US");
}

export default function ExpandCards({ aircraft, onSelect }: ExpandCardsProps) {
  const items = aircraft;
  const [expanded, setExpanded] = useState(Math.min(2, items.length - 1));

  if (items.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-center gap-1.5">
        {items.map((ac, idx) => {
          const isExpanded = idx === expanded;
          const hasPhoto = ac.photos.length > 0;

          return (
            <div
              key={ac.id}
              className="relative cursor-pointer overflow-hidden rounded-2xl transition-all duration-500 ease-in-out"
              style={{
                width: isExpanded ? "26rem" : "4.5rem",
                height: "22rem",
                flexShrink: 0,
              }}
              onMouseEnter={() => setExpanded(idx)}
              onClick={() => onSelect?.(ac)}
            >
              {/* Background image */}
              {hasPhoto ? (
                <img
                  className="w-full h-full object-cover absolute inset-0"
                  src={ac.photos[0].url}
                  alt={ac.name}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: "var(--sr-surface, #EFEDE8)" }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    style={{ color: "var(--sr-text-dim, #A8A49E)", opacity: 0.4 }}
                  >
                    <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                  </svg>
                </div>
              )}

              {/* Gradient overlay */}
              <div
                className="absolute inset-0 transition-opacity duration-500"
                style={{
                  background: isExpanded
                    ? "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)"
                    : "linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 100%)",
                }}
              />

              {/* Collapsed label — rotated vertically */}
              <div
                className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
                style={{ opacity: isExpanded ? 0 : 1 }}
              >
                <span
                  className="whitespace-nowrap text-[10px] uppercase tracking-[0.15em] font-medium"
                  style={{
                    color: "rgba(255,255,255,0.85)",
                    fontFamily: "var(--font-inter)",
                    writingMode: "vertical-rl",
                    textOrientation: "mixed",
                    transform: "rotate(180deg)",
                  }}
                >
                  {ac.model}
                </span>
              </div>

              {/* Expanded info overlay */}
              <div
                className="absolute bottom-0 left-0 right-0 p-5 transition-opacity duration-500"
                style={{ opacity: isExpanded ? 1 : 0 }}
              >
                {/* Category pill */}
                <div
                  className="inline-block px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider mb-3"
                  style={{
                    background: "rgba(184,151,106,0.25)",
                    border: "1px solid rgba(184,151,106,0.4)",
                    color: "#E8D098",
                    fontFamily: "var(--font-inter)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {ac.category}
                </div>

                <h3
                  className="text-lg font-medium leading-tight mb-1"
                  style={{
                    color: "#fff",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  {ac.name}
                </h3>

                <div
                  className="flex items-center gap-4 text-xs mt-2"
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  {ac.specs.range_nm && (
                    <span>{ac.specs.range_nm.toLocaleString()} NM</span>
                  )}
                  {ac.specs.maxPassengers && (
                    <span>{ac.specs.maxPassengers} pax</span>
                  )}
                  {ac.pricing.showPrice && (
                    <span style={{ color: "#E8D098" }}>
                      {formatPrice(ac.pricing.askingPrice)}
                    </span>
                  )}
                </div>

                {/* View details hint */}
                <div
                  className="mt-3 flex items-center gap-1.5 text-[11px]"
                  style={{
                    color: "rgba(232,208,152,0.8)",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  <span>View details</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
