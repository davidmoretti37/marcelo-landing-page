"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { SHOWROOM_CITIES, QUICK_ROUTES } from "@/lib/showroom/cities";
import type { City, ShowroomFilters } from "@/lib/showroom/types";

/* ─── Props ────────────────────────────────────────────────────────────────── */

interface RouteStepProps {
  filters: ShowroomFilters;
  onUpdateFilters: (partial: Partial<ShowroomFilters>) => void;
  onNext?: () => void;
}

/* ─── D3 type shims (loaded dynamically) ───────────────────────────────────── */

type D3Module = typeof import("d3");
type TopoModule = typeof import("topojson-client");
interface WorldTopo {
  objects: { land: TopoJSON.GeometryCollection };
  type: string;
  arcs: number[][][];
}

/* ─── Dot cache types ──────────────────────────────────────────────────────── */

interface DotPoint {
  lng: number;
  lat: number;
  land: boolean;
  twinklePhase: number;
}

/* ─── Constants ────────────────────────────────────────────────────────────── */

const GLOBE_VH = 65;
const LAND_SPACING = 2.5;
const OCEAN_SPACING = 10;
const ROTATE_SPEED = 0.08;
const DRAG_RESUME_MS = 2000;
const CLICK_RADIUS = 18;

const GOLD = "#d4a84b";
const GOLD_BRIGHT = "#f5d280";
const ATMO_INNER = "rgba(100,80,220,0.0)";
const ATMO_OUTER = "rgba(60,40,180,0.22)";
const ARC_COLOR = "rgba(212,168,75,0.55)";
const ARC_PULSE = "rgba(245,210,128,0.95)";
const GRATICULE_COLOR = "rgba(100,110,160,0.08)";

/* ─── Helper: great-circle interpolation ───────────────────────────────────── */

function greatCirclePoints(
  a: [number, number],
  b: [number, number],
  n: number,
): [number, number][] {
  const toRad = Math.PI / 180;
  const [lng1, lat1] = [a[0] * toRad, a[1] * toRad];
  const [lng2, lat2] = [b[0] * toRad, b[1] * toRad];
  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat2 - lat1) / 2) ** 2 +
          Math.cos(lat1) *
            Math.cos(lat2) *
            Math.sin((lng2 - lng1) / 2) ** 2,
      ),
    );
  if (d < 1e-6) return [a];
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
    const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) / toRad;
    const lng = Math.atan2(y, x) / toRad;
    pts.push([lng, lat]);
  }
  return pts;
}

/* ─── Component ────────────────────────────────────────────────────────────── */

export function RouteStep({ filters, onUpdateFilters, onNext }: RouteStepProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Refs for animation state ─────────────────────────────────────────── */
  const d3Ref = useRef<D3Module | null>(null);
  const projRef = useRef<d3.GeoProjection | null>(null);
  const dotsRef = useRef<DotPoint[]>([]);
  const rotRef = useRef<[number, number, number]>([0, -20, 0]);
  const draggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; rot: [number, number, number] } | null>(null);
  const lastInteractRef = useRef(0);
  const rafRef = useRef(0);
  const frameRef = useRef(0);
  const selectedRef = useRef<City[]>(filters.selectedCities);
  const visibleRef = useRef(true);
  const dprRef = useRef(1);
  const sizeRef = useRef({ w: 0, h: 0, r: 0 });

  /* ── Sync selected cities prop into ref ───────────────────────────────── */
  useEffect(() => {
    selectedRef.current = filters.selectedCities;
  }, [filters.selectedCities]);

  const [, setReady] = useState(false);

  /* ── Toggle a city ────────────────────────────────────────────────────── */
  const toggleCity = useCallback(
    (city: City) => {
      const sel = filters.selectedCities;
      const already = sel.some((c) => c.name === city.name);
      onUpdateFilters({
        selectedCities: already
          ? sel.filter((c) => c.name !== city.name)
          : [...sel, city],
      });
    },
    [filters.selectedCities, onUpdateFilters],
  );

  /* ── Quick route handler ──────────────────────────────────────────────── */
  const handleQuickRoute = useCallback(
    (cityNames: [string, string]) => {
      const sel = [...filters.selectedCities];
      for (const name of cityNames) {
        if (!sel.some((c) => c.name === name)) {
          const city = SHOWROOM_CITIES.find((c) => c.name === name);
          if (city) sel.push(city);
        }
      }
      onUpdateFilters({ selectedCities: sel });
    },
    [filters.selectedCities, onUpdateFilters],
  );

  /* ── Build land/ocean dots async ──────────────────────────────────────── */
  const buildDots = useCallback(
    async (land: GeoJSON.MultiPolygon | GeoJSON.Polygon, d3: D3Module) => {
      const dots: DotPoint[] = [];
      const geoContains = d3.geoContains;

      // Build land dots in chunks to avoid blocking
      const lngSteps: number[] = [];
      for (let lng = -180; lng <= 180; lng += LAND_SPACING) lngSteps.push(lng);

      const CHUNK = 30;
      for (let ci = 0; ci < lngSteps.length; ci += CHUNK) {
        const chunk = lngSteps.slice(ci, ci + CHUNK);
        for (const lng of chunk) {
          for (let lat = -85; lat <= 85; lat += LAND_SPACING) {
            if (geoContains(land, [lng, lat])) {
              dots.push({
                lng,
                lat,
                land: true,
                twinklePhase: Math.random() * Math.PI * 2,
              });
            }
          }
        }
        // Yield to main thread every chunk
        if (ci + CHUNK < lngSteps.length) {
          await new Promise((r) => setTimeout(r, 0));
        }
      }

      // Sparse ocean dots
      for (let lng = -180; lng <= 180; lng += OCEAN_SPACING) {
        for (let lat = -85; lat <= 85; lat += OCEAN_SPACING) {
          if (!geoContains(land, [lng, lat])) {
            dots.push({
              lng,
              lat,
              land: false,
              twinklePhase: Math.random() * Math.PI * 2,
            });
          }
        }
      }

      return dots;
    },
    [],
  );

  /* ── Main init effect ─────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
      const [d3, topo, worldData] = await Promise.all([
        import("d3") as Promise<D3Module>,
        import("topojson-client") as Promise<TopoModule>,
        fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json").then(
          (r) => r.json(),
        ) as Promise<WorldTopo>,
      ]);

      if (cancelled) return;
      d3Ref.current = d3;

      // Extract land geometry
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const landGeo = topo.feature(
        worldData as any,
        worldData.objects.land as any,
      ) as any;
      /* eslint-enable @typescript-eslint/no-explicit-any */
      const landGeom = landGeo.features[0].geometry as GeoJSON.MultiPolygon;

      // Build dots
      const dots = await buildDots(landGeom, d3);
      if (cancelled) return;
      dotsRef.current = dots;

      // Setup canvas
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dprRef.current = dpr;

      const resize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        const r = Math.min(w, h) * (GLOBE_VH / 100) * 0.5;
        sizeRef.current = { w, h, r };
        const proj = d3.geoOrthographic()
          .scale(r)
          .translate([w / 2, h / 2])
          .clipAngle(90)
          .rotate(rotRef.current);
        projRef.current = proj;
      };

      resize();
      window.addEventListener("resize", resize);

      setReady(true);

      // Start animation
      const draw = () => {
        if (cancelled) return;
        if (!visibleRef.current) {
          rafRef.current = requestAnimationFrame(draw);
          return;
        }

        frameRef.current++;
        const frame = frameRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx || !projRef.current) {
          rafRef.current = requestAnimationFrame(draw);
          return;
        }

        const { w, h, r } = sizeRef.current;
        const proj = projRef.current;
        const selected = selectedRef.current;

        // Auto-rotation
        const now = performance.now();
        if (!draggingRef.current && now - lastInteractRef.current > DRAG_RESUME_MS) {
          rotRef.current[0] += ROTATE_SPEED;
          proj.rotate(rotRef.current);
        }

        ctx.save();
        ctx.scale(dprRef.current, dprRef.current);

        // Clear
        ctx.clearRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;

        // ── Atmospheric glow ───────────────────────────────────────────
        const atmoR = r * 1.15;
        const atmo = ctx.createRadialGradient(cx, cy, r * 0.92, cx, cy, atmoR);
        atmo.addColorStop(0, ATMO_INNER);
        atmo.addColorStop(0.5, ATMO_OUTER);
        atmo.addColorStop(1, "rgba(60,40,180,0.0)");
        ctx.beginPath();
        ctx.arc(cx, cy, atmoR, 0, Math.PI * 2);
        ctx.fillStyle = atmo;
        ctx.fill();

        // ── Globe base ──────────────────────────────────────────────────
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = "#0a0a18";
        ctx.fill();

        // ── 3D depth shading (radial gradient lighter upper-left) ──────
        const depthGrad = ctx.createRadialGradient(
          cx - r * 0.3,
          cy - r * 0.3,
          r * 0.05,
          cx,
          cy,
          r,
        );
        depthGrad.addColorStop(0, "rgba(140,130,180,0.08)");
        depthGrad.addColorStop(0.5, "rgba(60,50,100,0.04)");
        depthGrad.addColorStop(1, "rgba(0,0,0,0.15)");
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = depthGrad;
        ctx.fill();

        // ── Graticule ──────────────────────────────────────────────────
        const pathGen = d3.geoPath(proj, ctx);
        const graticule = d3.geoGraticule10();
        ctx.beginPath();
        pathGen(graticule);
        ctx.strokeStyle = GRATICULE_COLOR;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // ── Dots ───────────────────────────────────────────────────────
        for (const dot of dotsRef.current) {
          const projected = proj([dot.lng, dot.lat]);
          if (!projected) continue;

          const [px, py] = projected;

          // Distance from center for fading
          const dx = px - cx;
          const dy = py - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > r * 0.98) continue;

          const edgeFade = 1 - Math.pow(dist / r, 3);

          if (dot.land) {
            // Twinkling
            const twinkle =
              0.55 + 0.45 * Math.sin(frame * 0.015 + dot.twinklePhase);
            const alpha = edgeFade * twinkle * 0.65;
            ctx.beginPath();
            ctx.arc(px, py, 0.9, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200,165,60,${alpha.toFixed(3)})`;
            ctx.fill();
          } else {
            const alpha = edgeFade * 0.12;
            ctx.beginPath();
            ctx.arc(px, py, 0.6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(100,120,180,${alpha.toFixed(3)})`;
            ctx.fill();
          }
        }

        // ── Great circle arcs between selected city pairs ──────────────
        if (selected.length >= 2) {
          for (let i = 0; i < selected.length; i++) {
            for (let j = i + 1; j < selected.length; j++) {
              const a = selected[i].coords;
              const b = selected[j].coords;
              const pts = greatCirclePoints(a, b, 80);

              // Draw arc
              ctx.beginPath();
              let started = false;
              for (const pt of pts) {
                const p = proj(pt);
                if (!p) {
                  started = false;
                  continue;
                }
                if (!started) {
                  ctx.moveTo(p[0], p[1]);
                  started = true;
                } else {
                  ctx.lineTo(p[0], p[1]);
                }
              }
              ctx.strokeStyle = ARC_COLOR;
              ctx.lineWidth = 1.5;
              ctx.stroke();

              // Animated traveling pulse
              const pulseT = ((frame * 0.008 + i * 0.3 + j * 0.17) % 1);
              const pulseIdx = Math.floor(pulseT * pts.length);
              const pulsePt = pts[Math.min(pulseIdx, pts.length - 1)];
              const pp = proj(pulsePt);
              if (pp) {
                const pulseGrad = ctx.createRadialGradient(
                  pp[0], pp[1], 0,
                  pp[0], pp[1], 6,
                );
                pulseGrad.addColorStop(0, ARC_PULSE);
                pulseGrad.addColorStop(1, "rgba(245,210,128,0.0)");
                ctx.beginPath();
                ctx.arc(pp[0], pp[1], 6, 0, Math.PI * 2);
                ctx.fillStyle = pulseGrad;
                ctx.fill();
              }
            }
          }
        }

        // ── City dots ──────────────────────────────────────────────────
        for (const city of SHOWROOM_CITIES) {
          const p = proj(city.coords);
          if (!p) continue;

          const [px, py] = p;
          const dx = px - cx;
          const dy = py - cy;
          if (dx * dx + dy * dy > r * r * 0.96) continue;

          const isSelected = selected.some((c) => c.name === city.name);

          if (isSelected) {
            // Pulsing expanding ring
            const ringPhase = (frame * 0.03) % 1;
            const ringR = 4 + ringPhase * 18;
            const ringAlpha = (1 - ringPhase) * 0.5;
            ctx.beginPath();
            ctx.arc(px, py, ringR, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(212,168,75,${ringAlpha.toFixed(3)})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Second ring offset
            const ringPhase2 = ((frame * 0.03 + 0.5) % 1);
            const ringR2 = 4 + ringPhase2 * 18;
            const ringAlpha2 = (1 - ringPhase2) * 0.35;
            ctx.beginPath();
            ctx.arc(px, py, ringR2, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(212,168,75,${ringAlpha2.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Bright glow
            const glow = ctx.createRadialGradient(px, py, 0, px, py, 12);
            glow.addColorStop(0, "rgba(245,210,128,0.6)");
            glow.addColorStop(0.5, "rgba(212,168,75,0.2)");
            glow.addColorStop(1, "rgba(212,168,75,0.0)");
            ctx.beginPath();
            ctx.arc(px, py, 12, 0, Math.PI * 2);
            ctx.fillStyle = glow;
            ctx.fill();

            // Core dot
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fillStyle = GOLD_BRIGHT;
            ctx.fill();
          } else {
            // Subtle glow
            const glow = ctx.createRadialGradient(px, py, 0, px, py, 7);
            glow.addColorStop(0, "rgba(212,168,75,0.25)");
            glow.addColorStop(1, "rgba(212,168,75,0.0)");
            ctx.beginPath();
            ctx.arc(px, py, 7, 0, Math.PI * 2);
            ctx.fillStyle = glow;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fillStyle = GOLD;
            ctx.fill();
          }
        }

        ctx.restore();
        rafRef.current = requestAnimationFrame(draw);
      };

      rafRef.current = requestAnimationFrame(draw);

      // Cleanup
      return () => {
        window.removeEventListener("resize", resize);
      };
    } catch (err) {
      console.error("[RouteStep Globe] init error:", err);
    }
    }

    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [buildDots]);

  /* ── Intersection observer ────────────────────────────────────────────── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* ── Mouse / touch handlers ───────────────────────────────────────────── */
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    draggingRef.current = true;
    lastInteractRef.current = performance.now();
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      rot: [...rotRef.current] as [number, number, number],
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current || !dragStartRef.current || !projRef.current) return;
    lastInteractRef.current = performance.now();
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const sensitivity = 0.3;
    rotRef.current = [
      dragStartRef.current.rot[0] + dx * sensitivity,
      Math.max(-80, Math.min(80, dragStartRef.current.rot[1] - dy * sensitivity)),
      0,
    ];
    projRef.current.rotate(rotRef.current);
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      const ds = dragStartRef.current;
      draggingRef.current = false;
      lastInteractRef.current = performance.now();

      // Click detection — only if minimal drag distance
      if (ds) {
        const movedX = Math.abs(e.clientX - ds.x);
        const movedY = Math.abs(e.clientY - ds.y);
        if (movedX < 4 && movedY < 4 && projRef.current) {
          // Check proximity to cities
          const proj = projRef.current;
          for (const city of SHOWROOM_CITIES) {
            const p = proj(city.coords);
            if (!p) continue;
            const cdx = p[0] - e.clientX;
            const cdy = p[1] - e.clientY;
            if (cdx * cdx + cdy * cdy < CLICK_RADIUS * CLICK_RADIUS) {
              toggleCity(city);
              break;
            }
          }
        }
      }
      dragStartRef.current = null;
    },
    [toggleCity],
  );

  /* ── Selected city names ──────────────────────────────────────────────── */
  const { selectedCities } = filters;

  /* ── Render ───────────────────────────────────────────────────────────── */
  if (typeof document === "undefined") return null;

  const content = (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        background: "#06060f",
        zIndex: 9999,
        fontFamily: "var(--font-inter)",
        overflow: "hidden",
      }}
    >
      {/* Canvas layer */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          position: "absolute",
          inset: 0,
          cursor: draggingRef.current ? "grabbing" : "grab",
          touchAction: "none",
        }}
      />

      {/* Floating UI layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "min(4vh, 36px) 24px min(3vh, 24px)",
          overflow: "hidden",
        }}
      >
        {/* ── Top: Title ─────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", pointerEvents: "none" }}>
          <h2
            style={{
              color: "#fff",
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 300,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              margin: 0,
              textShadow: "0 2px 40px rgba(0,0,0,0.7)",
            }}
          >
            Where do you fly?
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: "clamp(13px, 1.5vw, 16px)",
              fontWeight: 400,
              marginTop: 10,
              letterSpacing: "0.02em",
              textShadow: "0 1px 20px rgba(0,0,0,0.6)",
            }}
          >
            Select cities on the globe or choose a popular route
          </p>
        </div>

        {/* ── Middle: selected cities pills ──────────────────────────── */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 8,
            maxWidth: 600,
            pointerEvents: "auto",
          }}
        >
          {selectedCities.map((city) => (
            <button
              key={city.name}
              onClick={() => toggleCity(city)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                background: "rgba(212,168,75,0.12)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(212,168,75,0.3)",
                borderRadius: 100,
                color: GOLD_BRIGHT,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: "var(--font-inter)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(212,168,75,0.22)";
                e.currentTarget.style.borderColor = "rgba(212,168,75,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(212,168,75,0.12)";
                e.currentTarget.style.borderColor = "rgba(212,168,75,0.3)";
              }}
            >
              {city.name}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "rgba(212,168,75,0.2)",
                  fontSize: 11,
                  lineHeight: 1,
                }}
              >
                x
              </span>
            </button>
          ))}
        </div>

        {/* ── Bottom: Popular routes ─────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            pointerEvents: "auto",
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 11,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            Popular Routes
          </span>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 8,
              maxWidth: 720,
            }}
          >
            {QUICK_ROUTES.map((route) => {
              const isActive = route.cities.every((name) =>
                selectedCities.some((c) => c.name === name),
              );
              return (
                <button
                  key={route.label}
                  onClick={() => handleQuickRoute(route.cities)}
                  style={{
                    padding: "7px 14px",
                    background: isActive
                      ? "rgba(212,168,75,0.15)"
                      : "rgba(255,255,255,0.04)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: `1px solid ${
                      isActive
                        ? "rgba(212,168,75,0.35)"
                        : "rgba(255,255,255,0.08)"
                    }`,
                    borderRadius: 100,
                    color: isActive
                      ? GOLD_BRIGHT
                      : "rgba(255,255,255,0.5)",
                    fontSize: 13,
                    fontWeight: 400,
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                    fontFamily: "var(--font-inter)",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.75)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                    }
                  }}
                >
                  {route.label}
                </button>
              );
            })}
          </div>
          {/* Next button */}
          {onNext && (
            <button
              onClick={onNext}
              style={{
                marginTop: 16,
                padding: "10px 28px",
                background: "rgba(212,168,75,0.9)",
                border: "none",
                borderRadius: 8,
                color: "#0a0a0f",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-inter)",
                letterSpacing: "0.04em",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(212,168,75,1)";
                e.currentTarget.style.transform = "scale(1.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(212,168,75,0.9)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
