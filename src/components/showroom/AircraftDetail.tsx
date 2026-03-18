/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { Aircraft, CabinZone } from "@/lib/showroom/types";
import { generateBlueprint } from "@/lib/showroom/blueprint";

// ─── Interface ──────────────────────────────────────────────────────────────

interface AircraftDetailProps {
  aircraft: Aircraft;
  onClose: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return "$" + price.toLocaleString("en-US");
}

function formatStat(val: number | undefined, suffix: string): string {
  if (val == null) return "N/A";
  return val.toLocaleString("en-US") + " " + suffix;
}

const MONO_FONT = "var(--font-b612), 'B612 Mono', monospace";

// ─── Main Component ────────────────────────────────────────────────────────

export default function AircraftDetail({ aircraft, onClose }: AircraftDetailProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [expandedCabin, setExpandedCabin] = useState<number | null>(null);
  const [expandedTech, setExpandedTech] = useState<"blueprint" | "scanner" | null>(null);

  // X-ray scanner refs
  const xrayViewportRef = useRef<HTMLDivElement>(null);
  const xrayWrapRef = useRef<HTMLDivElement>(null);
  const xrayExteriorRef = useRef<HTMLImageElement>(null);
  const xrayInteriorRef = useRef<HTMLImageElement>(null);
  const xrayLineTopRef = useRef<HTMLDivElement>(null);
  const xrayLineBotRef = useRef<HTMLDivElement>(null);
  const xrayPosRef = useRef(0.5);
  const xrayDragging = useRef(false);
  const [xrayReady, setXrayReady] = useState(false);

  // Cabin panel refs for height animation
  const cabinPanelRef = useRef<HTMLDivElement>(null);
  const techPanelRef = useRef<HTMLDivElement>(null);

  const hasPhotos = aircraft.photos.length > 0;
  const multiPhotos = aircraft.photos.length > 1;
  const zones = aircraft.cabinZones;
  const hasZones = zones && zones.length > 0;
  const hasXray = !!aircraft.xrayImages;

  const bp = useMemo(() => generateBlueprint(aircraft), [aircraft]);
  const specCount = bp.specGroups.reduce((sum, g) => sum + g.specs.length, 0);

  const specs = aircraft.specs;
  const pax = specs.maxPassengers ?? specs.typicalPax;

  // ─── Photo carousel ─────────────────────────────────────────────────

  const prevPhoto = useCallback(() => {
    setPhotoIndex((i) => (i > 0 ? i - 1 : aircraft.photos.length - 1));
  }, [aircraft.photos.length]);

  const nextPhoto = useCallback(() => {
    setPhotoIndex((i) => (i < aircraft.photos.length - 1 ? i + 1 : 0));
  }, [aircraft.photos.length]);

  // ─── Panel toggle helpers ────────────────────────────────────────────

  const toggleCabin = useCallback((zoneIndex: number) => {
    setExpandedCabin((prev) => (prev === zoneIndex ? null : zoneIndex));
    setExpandedTech(null);
    setXrayReady(false);
  }, []);

  const toggleTech = useCallback((techId: "blueprint" | "scanner") => {
    setExpandedTech((prev) => {
      if (prev === techId) {
        setXrayReady(false);
        return null;
      }
      setXrayReady(false);
      return techId;
    });
    setExpandedCabin(null);
  }, []);

  // ─── X-Ray scanner logic ─────────────────────────────────────────────

  const updateXray = useCallback((pos: number) => {
    const viewport = xrayViewportRef.current;
    const wrap = xrayWrapRef.current;
    const exterior = xrayExteriorRef.current;
    const interior = xrayInteriorRef.current;
    const lineTop = xrayLineTopRef.current;
    const lineBot = xrayLineBotRef.current;
    if (!viewport || !wrap || !exterior || !interior || !lineTop || !lineBot) return;

    const Hv = viewport.offsetHeight;
    const Hi = wrap.offsetHeight;
    const stripPct = 14;
    const stripPx = (stripPct / 100) * Hi;
    const parallax = 0.3;

    const scannerTopPx = Hv / 2 - stripPx / 2;
    const tyInterior = scannerTopPx - pos * (Hi - stripPx);
    const tyExterior = tyInterior * (1 - parallax);

    exterior.style.transform = `translateY(${tyExterior}px)`;
    interior.style.transform = `translateY(${tyInterior}px)`;

    const topPct = ((scannerTopPx - tyInterior) / Hi) * 100;
    const botPct = 100 - topPct - stripPct;
    interior.style.clipPath = `inset(${topPct}% 0 ${botPct}% 0)`;

    lineTop.style.top = `${scannerTopPx}px`;
    lineBot.style.top = `${scannerTopPx + stripPx}px`;
    lineTop.style.opacity = "1";
    lineBot.style.opacity = "1";
    interior.style.opacity = "1";
  }, []);

  useEffect(() => {
    if (expandedTech !== "scanner" || !hasXray) {
      setXrayReady(false);
      return;
    }
    const ext = xrayExteriorRef.current;
    const int = xrayInteriorRef.current;
    if (!ext || !int) return;

    let loaded = 0;
    function onLoad() {
      loaded++;
      if (loaded >= 2) setXrayReady(true);
    }
    [ext, int].forEach((img) => {
      if (img.complete) onLoad();
      else {
        img.addEventListener("load", onLoad);
        img.addEventListener("error", onLoad);
      }
    });
  }, [expandedTech, hasXray]);

  useEffect(() => {
    if (!xrayReady) return;
    setTimeout(() => updateXray(0.5), 50);
  }, [xrayReady, updateXray]);

  useEffect(() => {
    if (!xrayReady) return;
    const viewport = xrayViewportRef.current;
    if (!viewport) return;

    function getPos(clientY: number) {
      const rect = viewport!.getBoundingClientRect();
      return Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    }
    function onPointerDown(e: PointerEvent) {
      xrayDragging.current = true;
      viewport!.setPointerCapture(e.pointerId);
      const pos = getPos(e.clientY);
      xrayPosRef.current = pos;
      updateXray(pos);
    }
    function onPointerMove(e: PointerEvent) {
      if (!xrayDragging.current) return;
      const pos = getPos(e.clientY);
      xrayPosRef.current = pos;
      updateXray(pos);
    }
    function onPointerUp() {
      xrayDragging.current = false;
    }

    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", onPointerUp);
    viewport.addEventListener("pointercancel", onPointerUp);
    return () => {
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", onPointerUp);
      viewport.removeEventListener("pointercancel", onPointerUp);
    };
  }, [xrayReady, updateXray]);

  // ─── Active cabin zone ───────────────────────────────────────────────

  const activeZone: CabinZone | null =
    hasZones && expandedCabin !== null ? zones![expandedCabin] ?? null : null;

  // ─── Feature list ────────────────────────────────────────────────────

  const featureEntries: { label: string; active: boolean }[] = [
    { label: "Stand-up Cabin", active: aircraft.features.standupCabin },
    { label: "Flat-bed", active: aircraft.features.flatBerthing },
    { label: "Full Galley", active: aircraft.features.fullGalley },
    { label: "WiFi", active: aircraft.features.wifi },
    { label: "Entertainment", active: aircraft.features.entertainment },
    { label: "In-flight Baggage", active: aircraft.features.baggageAccessible },
    { label: "Fresh Interior", active: aircraft.features.freshInterior },
    { label: "Fresh Paint", active: aircraft.features.freshPaint },
    { label: "Engine Program", active: aircraft.features.engineProgramEnrolled },
  ];

  // ─── Stats bar data ──────────────────────────────────────────────────

  const statsBar = [
    { key: "Range", val: formatStat(specs.range_nm, "NM") },
    { key: "Speed", val: specs.cruiseSpeed_ktas ? `${specs.cruiseSpeed_ktas} ktas` : "N/A" },
    { key: "Passengers", val: pax != null ? String(pax) : "N/A" },
    { key: "Altitude", val: formatStat(specs.ceiling_ft, "ft") },
  ];

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="w-full" style={{ background: "inherit" }}>

      {/* ═══ TOP: Header + Close ═══ */}
      <div className="px-6 md:px-12 lg:px-16 pt-8 pb-6">
        {/* Back button */}
        <button
          onClick={onClose}
          className="flex items-center gap-2.5 mb-6 group cursor-pointer"
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center border border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.03)] text-[#A8A49E] group-hover:border-[#B8976A] group-hover:text-[#B8976A] transition-all duration-300"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
            </svg>
          </div>
          <span className="font-sans text-[11px] tracking-[0.15em] uppercase text-[#A8A49E] group-hover:text-[#B8976A] transition-colors duration-300">
            Back to Results
          </span>
        </button>

        {/* Aircraft name */}
        <h2
          className="font-editorial font-light text-[#0F0F0D] leading-[1.05] mb-3"
          style={{ fontSize: "clamp(36px, 5vw, 64px)" }}
        >
          {aircraft.name}
        </h2>

        {/* Category + year + serial */}
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.2em]"
            style={{
              border: "1px solid rgba(184,151,106,0.3)",
              color: "#B8976A",
            }}
          >
            {aircraft.category}
          </span>
          <span
            className="text-[12px] text-[#A8A49E]"
            style={{ fontFamily: MONO_FONT }}
          >
            {aircraft.year}
          </span>
          <span className="block w-px h-3 bg-[rgba(0,0,0,0.08)]" />
          <span
            className="text-[12px] text-[#A8A49E]"
            style={{ fontFamily: MONO_FONT }}
          >
            S/N {aircraft.serialNumber}
          </span>
        </div>
      </div>

      {/* ═══ Section 1: Photo Hero ═══ */}
      <div className="px-6 md:px-12 lg:px-16 pb-8">
        <div
          className="relative overflow-hidden rounded-lg"
          style={{ aspectRatio: "16/9" }}
        >
          {/* Desktop: 21/9, handled via media query on the style */}
          <style>{`
            @media (min-width: 768px) {
              .detail-photo-hero { aspect-ratio: 21/9 !important; }
            }
          `}</style>
          <div className="detail-photo-hero relative w-full h-0" style={{ paddingBottom: "56.25%" }}>
            {/* Actual content container */}
          </div>
          {/* Use absolute fill instead so aspect-ratio wrapper works */}
          <div className="absolute inset-0">
            {hasPhotos ? (
              <>
                <img
                  src={aircraft.photos[photoIndex].url}
                  alt={aircraft.photos[photoIndex].caption || aircraft.name}
                  className="w-full h-full object-cover"
                  draggable={false}
                />

                {/* Gradient overlay at bottom */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(to top, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.4) 35%, transparent 60%)",
                  }}
                />

                {/* Bottom overlay: name + key stats */}
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                  <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-editorial font-light text-white text-[22px] md:text-[28px] leading-[1.1] mb-1">
                        {aircraft.name}
                      </p>
                      <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-[#C8A96E] opacity-70">
                        {aircraft.category}
                      </p>
                    </div>
                    {multiPhotos && (
                      <div
                        className="px-2.5 py-1 rounded-full text-[11px]"
                        style={{
                          background: "rgba(0,0,0,0.6)",
                          color: "rgba(255,255,255,0.5)",
                          fontFamily: MONO_FONT,
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        {photoIndex + 1} / {aircraft.photos.length}
                      </div>
                    )}
                  </div>
                </div>

                {/* Caption */}
                {aircraft.photos[photoIndex].caption && (
                  <div
                    className="absolute top-4 left-4 px-3 py-1.5 rounded text-[11px]"
                    style={{
                      background: "rgba(0,0,0,0.5)",
                      color: "rgba(255,255,255,0.5)",
                      backdropFilter: "blur(4px)",
                      fontFamily: "var(--font-dm-sans)",
                    }}
                  >
                    {aircraft.photos[photoIndex].caption}
                  </div>
                )}

                {/* Prev / Next nav */}
                {multiPhotos && (
                  <>
                    <button
                      onClick={prevPhoto}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer"
                      style={{
                        background: "rgba(0,0,0,0.4)",
                        color: "rgba(255,255,255,0.6)",
                        backdropFilter: "blur(4px)",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(184,151,106,0.2)"; e.currentTarget.style.color = "#C8A96E"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.4)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
                      aria-label="Previous photo"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                    <button
                      onClick={nextPhoto}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer"
                      style={{
                        background: "rgba(0,0,0,0.4)",
                        color: "rgba(255,255,255,0.6)",
                        backdropFilter: "blur(4px)",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(184,151,106,0.2)"; e.currentTarget.style.color = "#C8A96E"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.4)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
                      aria-label="Next photo"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </>
                )}
              </>
            ) : (
              /* No photos placeholder */
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#EFEDE8]">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: "rgba(0,0,0,0.12)" }}
                >
                  <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                </svg>
                <p className="font-sans text-[11px] tracking-[0.25em] uppercase text-[#A8A49E] mt-4">
                  Photos Coming Soon
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Section 2: Stats Bar ═══ */}
      <div className="px-6 md:px-12 lg:px-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-5 max-w-[800px]">
          {statsBar.map((stat) => (
            <div key={stat.key} className="border-t border-[rgba(184,151,106,0.15)] pt-3">
              <div
                className="text-[#0F0F0D] font-light tracking-[0.02em] leading-none"
                style={{ fontSize: 24, fontFamily: MONO_FONT }}
              >
                {stat.val}
              </div>
              <p className="font-sans text-[9px] tracking-[0.2em] uppercase text-[#B8976A] opacity-70 mt-2">
                {stat.key}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Section 3: Explore the Cabin (CONDITIONAL) ═══ */}
      {hasZones && (
        <div className="border-t border-[rgba(0,0,0,0.06)]">
          <div className="px-6 md:px-12 lg:px-16 pt-10 pb-6">
            {/* Row label */}
            <div className="flex items-center gap-3 mb-7">
              <span className="fleet-row-line fleet-row-line--visible block h-px bg-[#B8976A] opacity-40" />
              <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#A8A49E]">
                Explore the Cabin
              </span>
              <span className="block w-px h-3 bg-[rgba(0,0,0,0.08)]" />
              <span className="font-sans text-[10px] tracking-[0.15em] text-[#A8A49E]">
                Tap any area to learn more
              </span>
            </div>

            {/* Card row */}
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-1 px-1 snap-x snap-mandatory md:snap-none">
              {zones!.map((zone, i) => {
                const isActive = expandedCabin === i;
                return (
                  <button
                    key={zone.name}
                    onClick={() => toggleCabin(i)}
                    className={`fleet-card flex-shrink-0 cursor-pointer text-left relative ${isActive ? "fleet-card--active" : ""} snap-start`}
                    style={{
                      width: "clamp(220px, 28vw, 320px)",
                      border: isActive ? "1px solid #B8976A" : "1px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    <div
                      className="relative overflow-hidden rounded-lg"
                      style={{ aspectRatio: "3 / 4" }}
                    >
                      <img
                        src={zone.image}
                        alt={zone.title}
                        className="fleet-card-img w-full h-full object-cover"
                        draggable={false}
                      />
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: isActive
                            ? "linear-gradient(to top, rgba(200,169,110,0.2), transparent 50%)"
                            : "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 40%, transparent 65%)",
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="font-sans text-[9px] tracking-[0.25em] uppercase text-[#C8A96E] opacity-70 mb-1">
                          {zone.name}
                        </p>
                        <h4 className="font-editorial font-light text-white text-[18px] leading-[1.2] mb-1.5">
                          {zone.title}
                        </h4>
                        <p className="font-sans text-[11px] text-[rgba(255,255,255,0.45)] leading-[1.5]">
                          {zone.desc.length > 60 ? zone.desc.slice(0, 60) + "..." : zone.desc}
                        </p>
                        {/* Spec preview on hover */}
                        <div className="fleet-card-preview mt-3 flex gap-4">
                          {zone.specs.slice(0, 2).map((s) => (
                            <div key={s.key}>
                              <div className="font-sans text-[8px] text-[rgba(255,255,255,0.3)] tracking-[0.08em] uppercase">{s.key}</div>
                              <div className="text-white text-[11px] mt-0.5" style={{ fontFamily: MONO_FONT }}>{s.val}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {isActive && (
                        <div
                          className="absolute bottom-0 left-0 right-0 h-[3px]"
                          style={{ background: "linear-gradient(90deg, transparent, #C8A96E, transparent)" }}
                        />
                      )}
                    </div>
                    {isActive && (
                      <div className="flex justify-center mt-2">
                        <div
                          style={{
                            width: 0,
                            height: 0,
                            borderLeft: "10px solid transparent",
                            borderRight: "10px solid transparent",
                            borderTop: "10px solid #C8A96E",
                          }}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ═══ CABIN DETAIL PANEL ═══ */}
          <div
            ref={cabinPanelRef}
            style={{
              overflow: "hidden",
              maxHeight: expandedCabin !== null ? "2000px" : "0px",
              opacity: expandedCabin !== null ? 1 : 0,
              transition: "max-height 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease",
              background: "#EFEDE8",
            }}
          >
            {activeZone && (
              <div
                className="max-w-[1200px] mx-auto relative"
                style={{ padding: "clamp(40px, 6vw, 80px) clamp(24px, 5vw, 64px)" }}
              >
                {/* Close */}
                <button
                  onClick={() => expandedCabin !== null && toggleCabin(expandedCabin)}
                  className="absolute z-[2] flex items-center justify-center w-10 h-10 border border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.03)] text-[#A8A49E] hover:border-[#B8976A] hover:text-[#B8976A] transition-all duration-300 cursor-pointer"
                  style={{ top: "clamp(16px, 3vw, 40px)", right: "clamp(16px, 3vw, 40px)" }}
                  aria-label="Close panel"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>

                {/* Section divider */}
                <div className="flex items-center gap-4 mb-8">
                  <span className="flex-1 h-px bg-[rgba(184,151,106,0.15)]" />
                  <span className="font-sans text-[9px] tracking-[0.4em] uppercase text-[rgba(184,151,106,0.4)]">
                    Explore the Cabin
                  </span>
                  <span className="flex-1 h-px bg-[rgba(184,151,106,0.15)]" />
                </div>

                {/* Hero — selected zone */}
                <div
                  className="relative overflow-hidden mb-6 aspect-video md:aspect-[21/9] rounded-lg"
                >
                  <img
                    src={activeZone.image}
                    alt={activeZone.title}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(to top, rgba(8,9,14,0.95) 0%, rgba(8,9,14,0.4) 40%, transparent 70%)" }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-end">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="text-[#C8A96E] text-[11px] tracking-[0.3em] uppercase"
                            style={{ fontFamily: MONO_FONT }}
                          >
                            Zone {String((expandedCabin ?? 0) + 1).padStart(2, "0")} / {String(zones!.length).padStart(2, "0")}
                          </span>
                          <span className="block w-4 h-px bg-[#C8A96E] opacity-30" />
                          <span className="font-sans text-[9px] tracking-[0.2em] uppercase text-[rgba(255,255,255,0.3)]">
                            {activeZone.name}
                          </span>
                        </div>
                        <h3
                          className="font-editorial font-light text-white leading-[1.1] mb-3"
                          style={{ fontSize: "clamp(32px, 4vw, 52px)" }}
                        >
                          {activeZone.title}
                        </h3>
                        <p className="font-sans text-[14px] text-[rgba(255,255,255,0.5)] leading-[1.8] max-w-[500px]">
                          {activeZone.desc}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 min-w-[240px]">
                        {activeZone.specs.map((spec) => (
                          <div key={spec.key} className="py-3 border-b border-[rgba(255,255,255,0.08)]">
                            <div className="font-sans text-[10px] text-[rgba(255,255,255,0.4)] tracking-[0.08em] uppercase">
                              {spec.key}
                            </div>
                            <div
                              className="text-white text-[13px] mt-0.5"
                              style={{ fontFamily: MONO_FONT }}
                            >
                              {spec.val}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Section 4: Technical Details ═══ */}
      <div className="border-t border-[rgba(0,0,0,0.06)]">
        <div className="px-6 md:px-12 lg:px-16 pt-10 pb-6">
          {/* Row label */}
          <div className="flex items-center gap-3 mb-7">
            <span className="fleet-row-line fleet-row-line--visible block h-px bg-[#B8976A] opacity-40" />
            <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#A8A49E]">
              Technical Details
            </span>
          </div>

          {/* Tech cards */}
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-1 px-1 snap-x snap-mandatory md:snap-none">
            {/* Blueprint card */}
            <button
              onClick={() => toggleTech("blueprint")}
              className={`fleet-card flex-shrink-0 cursor-pointer text-left relative snap-start ${expandedTech === "blueprint" ? "fleet-card--active" : ""}`}
              style={{
                width: "clamp(280px, 35vw, 420px)",
                border: expandedTech === "blueprint" ? "1px solid #B8976A" : "1px solid rgba(0,0,0,0.08)",
              }}
            >
              <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: "16 / 10" }}>
                <div className="absolute inset-0 bg-[#EFEDE8]" />
                {/* Blueprint label overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div
                    className="text-[#B8976A] text-[32px] font-light opacity-40 mb-2"
                    style={{ fontFamily: MONO_FONT }}
                  >
                    {bp.label}
                  </div>
                  <div className="w-16 h-px bg-[rgba(184,151,106,0.2)]" />
                  <div className="font-sans text-[9px] tracking-[0.3em] uppercase text-[rgba(184,151,106,0.5)] mt-2">
                    {specCount} specifications
                  </div>
                </div>
                {/* Bottom gradient */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(to top, rgba(239,237,232,0.8) 0%, transparent 50%)" }}
                />
                {/* Info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="font-sans text-[9px] tracking-[0.25em] uppercase text-[#B8976A] opacity-80 mb-1">
                    Technical
                  </p>
                  <h4 className="font-editorial font-light text-[#0F0F0D] text-[18px] leading-[1.2]">
                    Blueprint
                  </h4>
                  {/* Spec preview */}
                  <div className="fleet-card-preview mt-3 flex gap-4">
                    <div>
                      <div className="font-sans text-[8px] text-[#A8A49E] tracking-[0.08em] uppercase">Range</div>
                      <div className="text-[#0F0F0D] text-[11px] mt-0.5" style={{ fontFamily: MONO_FONT }}>{statsBar[0].val}</div>
                    </div>
                    <div>
                      <div className="font-sans text-[8px] text-[#A8A49E] tracking-[0.08em] uppercase">Speed</div>
                      <div className="text-[#0F0F0D] text-[11px] mt-0.5" style={{ fontFamily: MONO_FONT }}>{statsBar[1].val}</div>
                    </div>
                  </div>
                </div>
                {expandedTech === "blueprint" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, transparent, #C8A96E, transparent)" }} />
                )}
              </div>
              {expandedTech === "blueprint" && (
                <div className="flex justify-center mt-2">
                  <div style={{ width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: "10px solid #C8A96E" }} />
                </div>
              )}
            </button>

            {/* X-Ray Scanner card (conditional) */}
            {hasXray && (
              <button
                onClick={() => toggleTech("scanner")}
                className={`fleet-card flex-shrink-0 cursor-pointer text-left relative snap-start ${expandedTech === "scanner" ? "fleet-card--active" : ""}`}
                style={{
                  width: "clamp(280px, 35vw, 420px)",
                  border: expandedTech === "scanner" ? "1px solid #B8976A" : "1px solid rgba(0,0,0,0.08)",
                }}
              >
                <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: "16 / 10" }}>
                  <div className="absolute inset-0 bg-[#EFEDE8]">
                    <img
                      src={aircraft.xrayImages!.exterior}
                      alt="Aircraft exterior"
                      className="fleet-card-img w-full h-full object-contain opacity-40"
                      draggable={false}
                      style={{ padding: "12%" }}
                    />
                  </div>
                  {/* Animated scan line */}
                  <div
                    className="scan-line-anim absolute left-[5%] right-[5%] h-[2px] pointer-events-none"
                    style={{
                      background: "linear-gradient(90deg, transparent, #C8A96E, transparent)",
                      boxShadow: "0 0 12px rgba(200,169,110,0.4)",
                    }}
                  />
                  {/* Bottom gradient */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(to top, rgba(239,237,232,0.9) 0%, transparent 50%)" }}
                  />
                  {/* Info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="font-sans text-[9px] tracking-[0.25em] uppercase text-[#B8976A] opacity-80 mb-1">
                      Interactive
                    </p>
                    <h4 className="font-editorial font-light text-[#0F0F0D] text-[18px] leading-[1.2]">
                      X-Ray Scanner
                    </h4>
                    <div className="fleet-card-preview mt-3">
                      <div className="font-sans text-[9px] text-[#A8A49E] tracking-[0.05em]">
                        Drag to reveal interior cutaway
                      </div>
                    </div>
                  </div>
                  {expandedTech === "scanner" && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, transparent, #C8A96E, transparent)" }} />
                  )}
                </div>
                {expandedTech === "scanner" && (
                  <div className="flex justify-center mt-2">
                    <div style={{ width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: "10px solid #C8A96E" }} />
                  </div>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ═══ TECH DETAIL PANEL ═══ */}
        <div
          ref={techPanelRef}
          style={{
            overflow: "hidden",
            maxHeight: expandedTech !== null ? "3000px" : "0px",
            opacity: expandedTech !== null ? 1 : 0,
            transition: "max-height 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease",
            background: "#EFEDE8",
          }}
        >
          <div
            className="max-w-[1200px] mx-auto relative"
            style={{ padding: "clamp(40px, 6vw, 80px) clamp(24px, 5vw, 64px)" }}
          >
            {/* Close */}
            <button
              onClick={() => expandedTech && toggleTech(expandedTech)}
              className="absolute z-[2] flex items-center justify-center w-10 h-10 border border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.03)] text-[#A8A49E] hover:border-[#B8976A] hover:text-[#B8976A] transition-all duration-300 cursor-pointer"
              style={{ top: "clamp(16px, 3vw, 40px)", right: "clamp(16px, 3vw, 40px)" }}
              aria-label="Close panel"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* ── BLUEPRINT ── */}
            {expandedTech === "blueprint" && (
              <>
                <div className="flex items-center gap-4 mb-3">
                  <span className="flex-1 h-px bg-[rgba(184,151,106,0.15)]" />
                  <span className="font-sans text-[9px] tracking-[0.4em] uppercase text-[rgba(184,151,106,0.4)]">
                    Technical Specification
                  </span>
                  <span className="flex-1 h-px bg-[rgba(184,151,106,0.15)]" />
                </div>

                <h3
                  className="font-editorial font-light text-[#0F0F0D] text-center mb-1"
                  style={{ fontSize: "clamp(28px, 3.5vw, 44px)" }}
                >
                  {aircraft.name}
                </h3>
                <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#B8976A] text-center mb-10">
                  {bp.category}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {bp.specGroups.map((group) => (
                    <div key={group.title} className="border border-[rgba(0,0,0,0.06)] p-6 rounded-lg">
                      <h4 className="flex items-center gap-2 mb-4">
                        <span className="block w-4 h-px bg-[#B8976A] opacity-50" />
                        <span className="font-sans text-[9px] tracking-[0.35em] uppercase text-[#B8976A]">
                          {group.title}
                        </span>
                      </h4>
                      <div>
                        {group.specs.map((spec) => (
                          <div key={spec.key} className="flex justify-between items-baseline py-[10px] border-b border-[rgba(0,0,0,0.05)] last:border-b-0">
                            <span className="font-sans text-[12px] text-[#6B6860] tracking-[0.05em]">
                              {spec.key}
                            </span>
                            <span className="text-[#0F0F0D] text-[14px] tracking-[0.03em] tabular-nums" style={{ fontFamily: MONO_FONT }}>
                              {spec.val}
                              {spec.unit && (
                                <span className="text-[10px] text-[#A8A49E] ml-1.5">{spec.unit}</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-4 mt-10 pt-4 border-t border-[rgba(184,151,106,0.12)]">
                  <span className="font-sans text-[8px] tracking-[0.3em] uppercase text-[rgba(184,151,106,0.3)]">Spark Aviation</span>
                  <span className="w-px h-3 bg-[rgba(184,151,106,0.12)]" />
                  <span className="font-sans text-[8px] tracking-[0.3em] uppercase text-[rgba(184,151,106,0.3)]">DWG NO: SA-{bp.label}-001</span>
                  <span className="w-px h-3 bg-[rgba(184,151,106,0.12)]" />
                  <span className="font-sans text-[8px] tracking-[0.3em] uppercase text-[rgba(184,151,106,0.3)]">Scale: NTS</span>
                </div>
              </>
            )}

            {/* ── X-RAY SCANNER ── */}
            {expandedTech === "scanner" && hasXray && (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <span className="flex-1 h-px bg-[rgba(184,151,106,0.15)]" />
                  <span className="font-sans text-[9px] tracking-[0.4em] uppercase text-[rgba(184,151,106,0.4)]">
                    Interior Scan
                  </span>
                  <span className="flex-1 h-px bg-[rgba(184,151,106,0.15)]" />
                </div>

                <p className="font-sans text-[11px] text-[#A8A49E] text-center mb-4 tracking-wide">
                  Drag to scan through the aircraft and reveal the cabin interior
                </p>

                <div
                  ref={xrayViewportRef}
                  style={{
                    position: "relative",
                    height: "clamp(300px, 50vh, 550px)",
                    overflow: "hidden",
                    cursor: "grab",
                    touchAction: "none",
                    userSelect: "none",
                    border: "1px solid rgba(184,151,106,0.1)",
                  }}
                >
                  <div
                    ref={xrayWrapRef}
                    style={{
                      position: "absolute",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "min(800px, 95%)",
                    }}
                  >
                    <img
                      ref={xrayExteriorRef}
                      src={aircraft.xrayImages!.exterior}
                      alt="Exterior top view"
                      style={{ width: "100%", display: "block" }}
                      draggable={false}
                    />
                    <img
                      ref={xrayInteriorRef}
                      src={aircraft.xrayImages!.interior}
                      alt="Interior cutaway"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center top",
                        clipPath: "inset(0% 0 100% 0)",
                        opacity: 0,
                      }}
                      draggable={false}
                    />
                  </div>

                  {/* Scan lines */}
                  <div ref={xrayLineTopRef} style={{ position: "absolute", left: "5%", right: "5%", height: "2px", background: "linear-gradient(90deg, transparent, #C8A96E, transparent)", opacity: 0, pointerEvents: "none", boxShadow: "0 0 16px rgba(200,169,110,0.5), 0 0 40px rgba(200,169,110,0.2)", zIndex: 2 }} />
                  <div ref={xrayLineBotRef} style={{ position: "absolute", left: "5%", right: "5%", height: "2px", background: "linear-gradient(90deg, transparent, #C8A96E, transparent)", opacity: 0, pointerEvents: "none", boxShadow: "0 0 16px rgba(200,169,110,0.5), 0 0 40px rgba(200,169,110,0.2)", zIndex: 2 }} />

                  {/* Drag hint arrows */}
                  <div className="absolute left-1/2 -translate-x-1/2 z-10 pointer-events-none" style={{ top: 12, opacity: xrayReady ? 0.3 : 0, transition: "opacity 0.5s" }}>
                    <svg width="16" height="10" viewBox="0 0 16 10" fill="none"><path d="M1 9L8 2L15 9" stroke="#C8A96E" strokeWidth="1.5" /></svg>
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 z-10 pointer-events-none" style={{ bottom: 12, opacity: xrayReady ? 0.3 : 0, transition: "opacity 0.5s" }}>
                    <svg width="16" height="10" viewBox="0 0 16 10" fill="none"><path d="M1 1L8 8L15 1" stroke="#C8A96E" strokeWidth="1.5" /></svg>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4 mt-8 pt-4 border-t border-[rgba(184,151,106,0.06)]">
                  <span className="font-sans text-[8px] tracking-[0.3em] uppercase text-[rgba(184,151,106,0.25)]">
                    {aircraft.name} — X-Ray Scan
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Section 5: Description + Pricing + Features ═══ */}
      <div className="border-t border-[rgba(0,0,0,0.06)]">
        <div className="px-6 md:px-12 lg:px-16 py-10">
          <div className="max-w-[900px]">
            {/* Asking price */}
            <div className="mb-8">
              <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-[#A8A49E] mb-2">
                Asking Price
              </p>
              <p
                className="text-[28px] md:text-[36px] font-light tabular-nums"
                style={{ color: "#B8976A", fontFamily: MONO_FONT }}
              >
                {aircraft.pricing.showPrice
                  ? formatPrice(aircraft.pricing.askingPrice)
                  : "Price on Request"}
              </p>
            </div>

            {/* Description */}
            <div className="mb-8">
              <p className="font-sans text-[14px] font-light text-[#6B6860] leading-[1.75] max-w-[600px]">
                {aircraft.description}
              </p>
            </div>

            {/* Features */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="block w-4 h-px bg-[#B8976A] opacity-40" />
                <span className="font-sans text-[9px] tracking-[0.3em] uppercase text-[#A8A49E]">
                  Features
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {featureEntries.map((f) => (
                  <span
                    key={f.label}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px]"
                    style={{
                      background: f.active ? "rgba(184,151,106,0.1)" : "rgba(0,0,0,0.03)",
                      border: f.active ? "1px solid rgba(184,151,106,0.3)" : "1px solid rgba(0,0,0,0.06)",
                      color: f.active ? "#B8976A" : "#A8A49E",
                      fontFamily: "var(--font-dm-sans)",
                    }}
                  >
                    {f.active ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                    {f.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
