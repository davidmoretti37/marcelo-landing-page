"use client";

import { useState, useEffect } from "react";
import { useInventory, seedDemoData } from "@/lib/showroom/store";
import { ShowroomShell } from "@/components/showroom/ShowroomShell";

export default function ShowroomPage() {
  const [started, setStarted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { aircraft, loading } = useInventory();

  useEffect(() => {
    seedDemoData();
    setMounted(true);
  }, []);

  const availableCount = aircraft.filter((a) => a.status === "available").length;

  if (started) {
    return <ShowroomShell onExit={() => setStarted(false)} />;
  }

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden"
      style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
    >
      {/* Subtle gold radial gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 45%, rgba(200, 164, 78, 0.06) 0%, transparent 70%)",
        }}
      />

      {/* Top gold line */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 h-px"
        style={{
          width: "min(320px, 60vw)",
          background:
            "linear-gradient(90deg, transparent, var(--sr-gold-dim) 30%, var(--sr-gold) 50%, var(--sr-gold-dim) 70%, transparent)",
        }}
      />

      {/* Content */}
      <div
        className={`relative z-10 flex flex-col items-center gap-8 transition-all duration-1000 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <h1
            className="text-5xl md:text-7xl font-medium tracking-tight"
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              color: "var(--sr-text)",
            }}
          >
            Spark Jets
          </h1>
          <p
            className="text-sm md:text-base uppercase tracking-[0.35em]"
            style={{ color: "var(--sr-text-muted)" }}
          >
            Digital Showroom
          </p>
        </div>

        <div
          className="w-12 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--sr-gold), transparent)",
          }}
        />

        <p
          className="text-xs uppercase tracking-[0.25em]"
          style={{
            color: "var(--sr-text-dim)",
            fontFamily: "var(--font-jetbrains), monospace",
          }}
        >
          {loading ? "Loading Fleet..." : `${availableCount} Aircraft Available`}
        </p>

        <button
          onClick={() => setStarted(true)}
          className="group relative px-10 py-4 mt-4 text-sm uppercase tracking-[0.2em] font-semibold cursor-pointer transition-all duration-300 hover:shadow-[0_0_20px_rgba(200,164,78,0.25),0_0_40px_rgba(200,164,78,0.1)]"
          style={{
            background: "transparent",
            border: "1px solid var(--sr-gold)",
            color: "var(--sr-gold-light)",
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--sr-gold)";
            e.currentTarget.style.color = "#0a0a0f";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--sr-gold-light)";
          }}
        >
          Begin Your Search
        </button>
      </div>

      {/* Bottom accent */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px"
        style={{
          width: "min(200px, 40vw)",
          background:
            "linear-gradient(90deg, transparent, var(--sr-gold-dim) 50%, transparent)",
        }}
      />
    </div>
  );
}
