"use client";

import { useEffect, useRef, useState } from "react";

/*
  Aviation HUD — confined to the right 62vw "window" area.
  Cockpit instruments frame the 3D scene.
  z-index: 9 — above 3D canvas (0), below briefing panel (10).
*/

const PANEL_W = "38vw"; // briefing panel width
const HUD = "var(--font-inter), system-ui, sans-serif";
const DIM = "rgba(255,255,255,0.18)";
const LIVE = "rgba(245,236,216,0.70)";
const ACCENT = "rgba(196,169,107,0.55)";

/* ── Altitude tape levels ── */
const FL_LEVELS = ["FL450", "FL350", "FL240", "FL180", "FL100", "FL050", "GND"];

function getAltIndex(pct: number): number {
  if (pct < 0.20) return 0;  // FL450
  if (pct < 0.35) return 1;  // FL350
  if (pct < 0.50) return 2;  // FL240
  if (pct < 0.60) return 3;  // FL180
  if (pct < 0.70) return 4;  // FL100
  if (pct < 0.80) return 5;  // FL050
  return 6;                   // GND
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function getHeading(pct: number): number {
  return Math.round(lerp(274, 155, pct));
}

function getMach(pct: number): number {
  if (pct < 0.20) return 0.90;
  if (pct >= 0.82) return 0;
  const t = (pct - 0.20) / (0.82 - 0.20);
  return +(0.90 * (1 - t)).toFixed(2);
}

function getCoords(pct: number): { lat: string; lon: string } {
  const latDeg = Math.round(lerp(26, 18, pct));
  const latMin = Math.round(lerp(22, 45, pct));
  const lonDeg = Math.round(lerp(80, 65, pct));
  const lonMin = Math.round(lerp(6, 30, pct));
  return {
    lat: `N ${latDeg}\u00B0${String(latMin).padStart(2, "0")}'`,
    lon: `W ${lonDeg}\u00B0${String(lonMin).padStart(2, "0")}'`,
  };
}

function getAltitudeFt(pct: number): number {
  if (pct >= 0.85) return 0;
  return Math.max(0, Math.round(45000 * (1 - pct / 0.85)));
}

function formatAlt(ft: number): string {
  return ft.toLocaleString("en-US");
}

/* ── ATC radio messages ── */
const ATC_EVENTS = [
  {
    trigger: 0.01,
    end: 0.07,
    from: "KBCT CLNC DEL",
    msg: "SPARK ONE, CLEARED TO\nGUARULHOS INTERNATIONAL AIRPORT\nVIA RADAR VECTORS DIRECT ROPME\nTHEN AS FILED. CLIMB AND MAINTAIN\nFIVE THOUSAND, EXPECT FLIGHT LEVEL\nFOUR FIVE ZERO ONE ZERO MINUTES\nAFTER DEPARTURE. SQUAWK FOUR\nTHREE TWO ONE.",
  },
  {
    trigger: 0.42,
    end: 0.48,
    from: "MIAMI CENTER",
    msg: "SPARK ONE, MIAMI CENTER,\nRADAR CONTACT. CLEARED DIRECT\nITABO. DESCEND PILOT\u2019S DISCRETION\nMAINTAIN FLIGHT LEVEL THREE FIVE\nZERO. MACH POINT EIGHT FIVE\nOR BETTER.",
  },
  {
    trigger: 0.65,
    end: 0.71,
    from: "MAIQUETIA CONTROL",
    msg: "SPARK ONE, DESCEND AND\nMAINTAIN FLIGHT LEVEL ONE EIGHT\nZERO. EXPECT LOWER IN FIVE ZERO\nMILES. ALTIMETER TWO NINER NINER\nSEVEN.",
  },
  {
    trigger: 0.88,
    end: 0.94,
    from: "GUARULHOS APPROACH",
    msg: "SPARK ONE, TURN LEFT\nHEADING ONE EIGHT ZERO. CLEARED\nILS RUNWAY TWO SEVEN RIGHT.\nCONTACT TOWER ONE ONE EIGHT\nPOINT ZERO. WELCOME TO BRAZIL.",
  },
];

export default function AviationHUD() {
  const [scrollPct, setScrollPct] = useState(0);
  const prevRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    function tick() {
      rafRef.current = requestAnimationFrame(tick);
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      const pct = Math.min(1, Math.max(0, window.scrollY / maxScroll));

      if (Math.abs(pct - prevRef.current) > 0.001) {
        prevRef.current = pct;
        setScrollPct(pct);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const altIndex = getAltIndex(scrollPct);
  const heading = getHeading(scrollPct);
  const mach = getMach(scrollPct);
  const coords = getCoords(scrollPct);
  const altFt = getAltitudeFt(scrollPct);

  // ATC typewriter
  const activeATC = ATC_EVENTS.find(
    (e) => scrollPct >= e.trigger && scrollPct <= e.end
  );
  const atcProgress = activeATC
    ? Math.min(1, Math.max(0, (scrollPct - activeATC.trigger) / (activeATC.end - activeATC.trigger)))
    : 0;
  const atcOpacity = activeATC
    ? Math.min(1, atcProgress / 0.05, (1 - atcProgress) / 0.05)
    : 0;
  const visibleChars = activeATC
    ? Math.floor(atcProgress * activeATC.msg.length)
    : 0;

  // Tape fades when grounded
  const tapeOpacity = scrollPct > 0.92 ? Math.max(0, 1 - (scrollPct - 0.92) / 0.06) : 1;

  return (
    <>
      {/* ── Cabin Window Vignette (right 62vw only) ── */}
      <div style={{
        position: "fixed",
        top: 0,
        bottom: 0,
        left: PANEL_W,
        right: 0,
        zIndex: 9,
        pointerEvents: "none",
        background: "radial-gradient(ellipse 88% 85% at 50% 48%, transparent 50%, rgba(0,0,0,0.55) 100%)",
      }} />

      {/* ── Top Ribbon: Heading / Mach / Coords (window area only) ── */}
      <div style={{
        position: "fixed",
        top: 0,
        left: PANEL_W,
        right: 0,
        height: 28,
        zIndex: 9,
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        fontFamily: HUD,
        fontSize: 11,
        background: "rgba(0,0,0,0.20)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        opacity: tapeOpacity,
        transition: "opacity 0.3s",
      }}>
        <span>
          <span style={{ color: DIM }}>HDG </span>
          <span style={{ color: LIVE }}>{heading}&deg;</span>
        </span>
        <span style={{ color: "rgba(255,255,255,0.10)" }}>&middot;</span>
        <span>
          <span style={{ color: DIM }}>M </span>
          <span style={{ color: LIVE }}>{mach.toFixed(2)}</span>
        </span>
        <span style={{ color: "rgba(255,255,255,0.10)" }}>&middot;</span>
        <span>
          <span style={{ color: LIVE }}>{coords.lat}</span>
          <span style={{ color: DIM }}> </span>
          <span style={{ color: LIVE }}>{coords.lon}</span>
        </span>
      </div>

      {/* ── Altitude Tape (right edge of window) ── */}
      <div style={{
        position: "fixed",
        right: 24,
        top: 0,
        bottom: 0,
        width: 56,
        zIndex: 9,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-end",
        gap: 0,
        opacity: tapeOpacity,
        transition: "opacity 0.3s",
      }}>
        <div style={{
          position: "absolute",
          right: 27,
          top: "20%",
          bottom: "20%",
          width: 1,
          background: "rgba(255,255,255,0.06)",
        }} />
        {FL_LEVELS.map((fl, i) => {
          const isActive = i === altIndex;
          return (
            <div key={fl} style={{
              fontFamily: HUD,
              fontSize: isActive ? 12 : 10,
              color: isActive ? LIVE : DIM,
              padding: "3px 6px",
              border: isActive
                ? "1px solid rgba(255,255,255,0.35)"
                : "1px solid transparent",
              textAlign: "right",
              marginBottom: i < FL_LEVELS.length - 1 ? 16 : 0,
              transition: "all 0.4s ease",
              letterSpacing: "0.05em",
            }}>
              {fl}
            </div>
          );
        })}
      </div>

      {/* ── Smooth Altitude Counter (bottom-right of window) ── */}
      <div style={{
        position: "fixed",
        right: 24,
        bottom: 40,
        zIndex: 9,
        pointerEvents: "none",
        textAlign: "right",
        opacity: tapeOpacity,
        transition: "opacity 0.3s",
      }}>
        <div style={{
          fontFamily: HUD,
          fontSize: 28,
          color: LIVE,
          letterSpacing: "0.04em",
          lineHeight: 1,
        }}>
          {formatAlt(altFt)}
        </div>
        <div style={{
          fontFamily: HUD,
          fontSize: 9,
          color: DIM,
          letterSpacing: "0.2em",
          marginTop: 4,
        }}>
          FT MSL
        </div>
      </div>

      {/* ── ATC Radio (typewriter, bottom of window area) ── */}
      <div style={{
        position: "fixed",
        bottom: 40,
        left: `calc(${PANEL_W} + clamp(24px, 2vw, 48px))`,
        zIndex: 9,
        pointerEvents: "none",
        maxWidth: 340,
        opacity: atcOpacity,
        transition: "opacity 0.15s",
      }}>
        {activeATC && (
          <>
            <div style={{
              fontFamily: HUD,
              fontSize: 8,
              letterSpacing: "0.3em",
              color: "rgba(196,169,107,0.30)",
              marginBottom: 6,
              textTransform: "uppercase",
            }}>
              {activeATC.from}
            </div>
            <div style={{
              fontFamily: HUD,
              fontSize: 10,
              lineHeight: 1.7,
              color: ACCENT,
              whiteSpace: "pre-line",
            }}>
              {activeATC.msg.substring(0, visibleChars)}
              <span style={{
                display: "inline-block",
                width: 6,
                height: 12,
                background: ACCENT,
                marginLeft: 2,
                animation: "hudBlink 1s step-end infinite",
              }} />
            </div>
          </>
        )}
      </div>

      {/* ── Flight Progress Bar (full width, bottom edge) ── */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        height: 2,
        width: `${scrollPct * 100}%`,
        background: "linear-gradient(to right, rgba(196,169,107,0.2), rgba(196,169,107,0.5))",
        zIndex: 9,
        pointerEvents: "none",
        transition: "width 0.1s linear",
      }} />

      {/* Blink keyframe */}
      <style>{`
        @keyframes hudBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </>
  );
}
