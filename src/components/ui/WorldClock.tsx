"use client";

import { useState, useEffect } from "react";
import { WORLD_CLOCKS } from "@/lib/constants";

export default function WorldClock() {
  const [times, setTimes] = useState<string[]>([]);

  useEffect(() => {
    function update() {
      setTimes(
        WORLD_CLOCKS.map((c) =>
          new Intl.DateTimeFormat("en-US", {
            timeZone: c.timezone,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }).format(new Date())
        )
      );
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
      }}
      className="world-clock-grid"
    >
      {WORLD_CLOCKS.map((clock, i) => (
        <div
          key={clock.city}
          style={{
            padding: "14px 16px",
            borderLeft: clock.highlight
              ? "2px solid #B8976A"
              : "2px solid rgba(255,255,255,0.08)",
            background: clock.highlight
              ? "rgba(184,151,106,0.06)"
              : "transparent",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 400,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#f5f0e8",
            }}
          >
            {clock.city}
          </div>
          <div
            style={{
              fontSize: 8,
              fontWeight: 500,
              letterSpacing: "0.2em",
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              marginTop: 2,
            }}
          >
            {clock.label}
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 200,
              letterSpacing: "0.05em",
              color: clock.highlight ? "#B8976A" : "rgba(255,255,255,0.5)",
              fontVariantNumeric: "tabular-nums",
              fontFamily: "var(--font-b612), 'B612 Mono', monospace",
              marginTop: 6,
            }}
          >
            {times[i] || "--:--:--"}
          </div>
        </div>
      ))}

      <style>{`
        @media (max-width: 768px) {
          .world-clock-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
