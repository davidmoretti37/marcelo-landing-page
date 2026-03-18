"use client";

import { useRef, useEffect, useState, useCallback } from "react";

export default function XRaySection() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const exteriorRef = useRef<HTMLImageElement>(null);
  const interiorRef = useRef<HTMLImageElement>(null);
  const lineTopRef = useRef<HTMLDivElement>(null);
  const lineBotRef = useRef<HTMLDivElement>(null);
  const scanPosRef = useRef(0.5); // 0 = top, 1 = bottom
  const isDragging = useRef(false);
  const [ready, setReady] = useState(false);

  // Wait for images to load
  useEffect(() => {
    const ext = exteriorRef.current;
    const int = interiorRef.current;
    if (!ext || !int) return;

    let loaded = 0;
    function onLoad() {
      loaded++;
      if (loaded >= 2) setReady(true);
    }

    [ext, int].forEach((img) => {
      if (img.complete) onLoad();
      else {
        img.addEventListener("load", onLoad);
        img.addEventListener("error", onLoad);
      }
    });
  }, []);

  // Update scan position visuals
  const updateScan = useCallback((pos: number) => {
    const viewport = viewportRef.current;
    const wrap = wrapRef.current;
    const exterior = exteriorRef.current;
    const interior = interiorRef.current;
    const lineTop = lineTopRef.current;
    const lineBot = lineBotRef.current;
    if (!viewport || !wrap || !exterior || !interior || !lineTop || !lineBot) return;

    const Hv = viewport.offsetHeight;
    const Hi = wrap.offsetHeight;
    const stripPct = 14;
    const stripPx = (stripPct / 100) * Hi;
    const parallax = 0.3;

    // Scanner position in viewport
    const scannerTopPx = Hv / 2 - stripPx / 2;

    // Interior scroll position based on drag
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

  // Initialize on ready
  useEffect(() => {
    if (!ready) return;
    updateScan(0.5);
  }, [ready, updateScan]);

  // Mouse/touch drag handling
  useEffect(() => {
    if (!ready) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    function getPos(clientY: number) {
      const rect = viewport!.getBoundingClientRect();
      return Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    }

    function onPointerDown(e: PointerEvent) {
      isDragging.current = true;
      viewport!.setPointerCapture(e.pointerId);
      const pos = getPos(e.clientY);
      scanPosRef.current = pos;
      updateScan(pos);
    }

    function onPointerMove(e: PointerEvent) {
      if (!isDragging.current) return;
      const pos = getPos(e.clientY);
      scanPosRef.current = pos;
      updateScan(pos);
    }

    function onPointerUp() {
      isDragging.current = false;
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
  }, [ready, updateScan]);

  return (
    <section
      id="scanner"
      style={{
        background: "#F8F7F4",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          padding: "clamp(60px, 8vw, 100px) clamp(24px, 5vw, 64px) clamp(24px, 3vw, 40px)",
        }}
      >
        <p className="text-[#C8A96E] text-[10px] tracking-[0.4em] uppercase mb-4 font-sans">
          Interior Layout
        </p>
        <h2 className="font-editorial text-[#0F0F0D] font-light" style={{ fontSize: "clamp(32px, 4vw, 52px)" }}>
          Cabin Revealed
        </h2>
        <p className="font-sans text-[13px] text-[#A8A49E] mt-3 max-w-[360px] mx-auto leading-[1.7]">
          Drag to scan through the aircraft and reveal the cabin interior
        </p>
      </div>

      {/* Scanner viewport — interactive */}
      <div
        ref={viewportRef}
        style={{
          position: "relative",
          flex: 1,
          overflow: "hidden",
          cursor: "grab",
          touchAction: "none",
          userSelect: "none",
          minHeight: "50vh",
        }}
      >
        {/* Image container */}
        <div
          ref={wrapRef}
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(900px, 100%)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={exteriorRef}
            src="/plane-top.png"
            alt="Top view exterior"
            style={{ width: "100%", display: "block" }}
            draggable={false}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={interiorRef}
            src="/plane-interior.png"
            alt="Cabin interior cutaway"
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
        <div
          ref={lineTopRef}
          style={{
            position: "absolute",
            left: "5%",
            right: "5%",
            height: "2px",
            background: "linear-gradient(90deg, transparent, #C8A96E, transparent)",
            opacity: 0,
            pointerEvents: "none",
            boxShadow: "0 0 16px rgba(200,169,110,0.5), 0 0 40px rgba(200,169,110,0.2)",
            zIndex: 2,
          }}
        />
        <div
          ref={lineBotRef}
          style={{
            position: "absolute",
            left: "5%",
            right: "5%",
            height: "2px",
            background: "linear-gradient(90deg, transparent, #C8A96E, transparent)",
            opacity: 0,
            pointerEvents: "none",
            boxShadow: "0 0 16px rgba(200,169,110,0.5), 0 0 40px rgba(200,169,110,0.2)",
            zIndex: 2,
          }}
        />

        {/* Drag hint arrows */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-10 pointer-events-none flex flex-col items-center gap-1"
          style={{ top: 12, opacity: ready ? 0.3 : 0, transition: "opacity 0.5s" }}
        >
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
            <path d="M1 9L8 2L15 9" stroke="#C8A96E" strokeWidth="1.5" />
          </svg>
        </div>
        <div
          className="absolute left-1/2 -translate-x-1/2 z-10 pointer-events-none flex flex-col items-center gap-1"
          style={{ bottom: 12, opacity: ready ? 0.3 : 0, transition: "opacity 0.5s" }}
        >
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
            <path d="M1 1L8 8L15 1" stroke="#C8A96E" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </section>
  );
}
