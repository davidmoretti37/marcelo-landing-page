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
    <div className="flex flex-col gap-8">
      {WORLD_CLOCKS.map((clock, i) => (
        <div key={clock.city}>
          <div className="font-sans text-[10px] tracking-[0.15em] uppercase text-[#A8A49E]">
            {clock.city}
          </div>
          <div
            className="font-light tracking-[0.05em] tabular-nums mt-1"
            style={{
              fontSize: 26,
              color: clock.highlight ? "#C8A96E" : "#0F0F0D",
              fontFamily: "var(--font-inter), system-ui, sans-serif",
            }}
          >
            {times[i] || "--:--:--"}
          </div>
        </div>
      ))}
    </div>
  );
}
