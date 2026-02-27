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
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {WORLD_CLOCKS.map((clock, i) => (
        <div
          key={clock.city}
          className="clock-card"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderLeft: clock.highlight
              ? "2px solid #B8976A"
              : "2px solid rgba(12,18,32,0.08)",
            background: clock.highlight
              ? "rgba(184,151,106,0.04)"
              : "transparent",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 400,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#0C1220",
              }}
            >
              {clock.city}
            </div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: "0.2em",
                color: "rgba(12,18,32,0.3)",
                textTransform: "uppercase",
                marginTop: 2,
              }}
            >
              {clock.label}
            </div>
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 200,
              letterSpacing: "0.05em",
              color: clock.highlight ? "#B8976A" : "rgba(12,18,32,0.6)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {times[i] || "--:--:--"}
          </div>
        </div>
      ))}
    </div>
  );
}
