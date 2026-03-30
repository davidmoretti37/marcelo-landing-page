"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { SHOWROOM_CITIES } from "@/lib/showroom/cities";
import type { City } from "@/lib/showroom/types";

const TIER1_CITIES = new Set(["New York", "London", "Dubai", "Tokyo", "São Paulo", "Los Angeles"]);
const TIER2_CITIES = new Set([
  "Paris", "Miami", "Hong Kong", "Singapore", "Chicago", "San Francisco",
  "Moscow", "Istanbul", "Shanghai", "Mumbai", "Buenos Aires",
]);
function getCityTier(name: string): 1 | 2 | 3 {
  if (TIER1_CITIES.has(name)) return 1;
  if (TIER2_CITIES.has(name)) return 2;
  return 3;
}

interface ShowroomMapProps {
  selectedCities: City[];
  onCityToggle: (city: City) => void;
}

export function ShowroomMap({ selectedCities, onCityToggle }: ShowroomMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const visibleRef = useRef(true);

  const [hoveredCity, setHoveredCity] = useState<City | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const selectedRef = useRef(selectedCities);
  selectedRef.current = selectedCities;
  const onCityToggleRef = useRef(onCityToggle);
  onCityToggleRef.current = onCityToggle;
  const hoveredRef = useRef<City | null>(null);

  const setHovered = useCallback(
    (city: City | null, px?: number, py?: number) => {
      hoveredRef.current = city;
      setHoveredCity(city);
      if (city && px !== undefined && py !== undefined) setTooltipPos({ x: px, y: py });
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /* eslint-disable @typescript-eslint/no-explicit-any */
    let d3: any;
    let projection: any;
    let path: any;
    let landFeature: any;
    let countriesFeature: any;
    /* eslint-enable @typescript-eslint/no-explicit-any */

    let w = 0, h = 0, frame = 0, initialized = false;

    // Pre-rendered static layers (offscreen canvases)
    let terrainLayer: HTMLCanvasElement | null = null;

    // Ambient particles
    const particles: { x: number; y: number; vx: number; vy: number; a: number; s: number }[] = [];

    const BG = "#FAF7F2";

    function initParticles() {
      particles.length = 0;
      for (let i = 0; i < 20; i++) {
        particles.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.15,
          a: 0.02 + Math.random() * 0.03, s: 0.5 + Math.random() * 0.8,
        });
      }
    }

    // ── Render the entire terrain to an offscreen canvas (once) ──────────
    function renderTerrainLayer() {
      if (!projection || !path || !landFeature || !d3) return;
      const dpr = window.devicePixelRatio || 1;

      terrainLayer = document.createElement("canvas");
      terrainLayer.width = w * dpr;
      terrainLayer.height = h * dpr;
      const tc = terrainLayer.getContext("2d")!;
      tc.setTransform(dpr, 0, 0, dpr, 0, 0);
      const tPath = d3.geoPath(projection, tc);

      // ── 1. Base land fill — warm parchment ────────────────────────────
      tc.beginPath();
      tPath(landFeature);
      tc.fillStyle = "rgba(215,200,172,0.55)";
      tc.fill();

      // ── 2. Sunlit gradient overlay clipped to land ────────────────────
      tc.save();
      tc.beginPath();
      tPath(landFeature);
      tc.clip();

      // Light from upper-left — creates relief impression
      const lightGrad = tc.createLinearGradient(0, 0, w * 0.8, h * 0.9);
      lightGrad.addColorStop(0, "rgba(240,230,205,0.35)");
      lightGrad.addColorStop(0.25, "rgba(225,215,185,0.2)");
      lightGrad.addColorStop(0.5, "rgba(210,195,165,0.08)");
      lightGrad.addColorStop(0.75, "rgba(180,165,135,0.12)");
      lightGrad.addColorStop(1, "rgba(155,140,110,0.25)");
      tc.fillStyle = lightGrad;
      tc.fillRect(0, 0, w, h);

      // Equatorial warmth band
      const eqGrad = tc.createLinearGradient(0, h * 0.15, 0, h * 0.75);
      eqGrad.addColorStop(0, "rgba(200,185,155,0.0)");
      eqGrad.addColorStop(0.3, "rgba(210,190,145,0.12)");
      eqGrad.addColorStop(0.5, "rgba(215,195,150,0.15)");
      eqGrad.addColorStop(0.7, "rgba(205,185,145,0.08)");
      eqGrad.addColorStop(1, "rgba(195,180,150,0.0)");
      tc.fillStyle = eqGrad;
      tc.fillRect(0, 0, w, h);

      tc.restore();

      // ── 3. Raised coastline shadow (drop shadow on southeast) ─────────
      tc.save();
      tc.beginPath();
      tPath(landFeature);
      tc.shadowColor = "rgba(120,100,65,0.3)";
      tc.shadowBlur = 12;
      tc.shadowOffsetX = 3;
      tc.shadowOffsetY = 3;
      tc.strokeStyle = "rgba(0,0,0,0)";
      tc.lineWidth = 0.1;
      tc.stroke();
      tc.restore();

      // ── 4. Inner highlight (northwest — lit edge) ─────────────────────
      tc.save();
      tc.beginPath();
      tPath(landFeature);
      tc.shadowColor = "rgba(255,245,220,0.4)";
      tc.shadowBlur = 8;
      tc.shadowOffsetX = -2;
      tc.shadowOffsetY = -2;
      tc.strokeStyle = "rgba(0,0,0,0)";
      tc.lineWidth = 0.1;
      tc.stroke();
      tc.restore();

      // ── 5. Crisp coastline ────────────────────────────────────────────
      tc.beginPath();
      tPath(landFeature);
      tc.strokeStyle = "rgba(165,145,105,0.35)";
      tc.lineWidth = 0.8;
      tc.lineJoin = "round";
      tc.stroke();

      // ── 6. Country borders ────────────────────────────────────────────
      if (countriesFeature) {
        for (const feat of countriesFeature.features) {
          tc.beginPath();
          tPath(feat);
          tc.strokeStyle = "rgba(155,140,105,0.12)";
          tc.lineWidth = 0.5;
          tc.lineJoin = "round";
          tc.stroke();
        }
      }

      // ── 7. Inner contour lines (topographic) ─────────────────────────
      tc.save();
      tc.beginPath();
      tPath(landFeature);
      tc.clip();

      for (let c = 1; c <= 4; c++) {
        const scale = 1 - c * 0.012;
        const a = (0.06 - c * 0.012);
        if (a <= 0) break;
        tc.save();
        tc.translate(w / 2 * (1 - scale), h / 2 * (1 - scale));
        tc.scale(scale, scale);
        tc.beginPath();
        tPath(landFeature);
        tc.strokeStyle = `rgba(160,140,100,${a.toFixed(3)})`;
        tc.lineWidth = 0.6 / scale;
        tc.lineJoin = "round";
        tc.stroke();
        tc.restore();
      }
      tc.restore();

      // ── 8. Second coastline pass — outer glow for raised effect ───────
      tc.save();
      tc.beginPath();
      tPath(landFeature);
      tc.shadowColor = "rgba(140,120,80,0.15)";
      tc.shadowBlur = 4;
      tc.shadowOffsetX = 0;
      tc.shadowOffsetY = 0;
      tc.strokeStyle = "rgba(175,155,115,0.25)";
      tc.lineWidth = 0.5;
      tc.lineJoin = "round";
      tc.stroke();
      tc.restore();
    }

    function setupCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const rect = container!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (projection && d3) {
        const bounds = {
          type: "Feature" as const,
          geometry: { type: "Polygon" as const, coordinates: [[[-180, -58], [180, -58], [180, 85], [-180, 85], [-180, -58]]] },
          properties: {},
        };
        const padX = w * 0.02, padY = h * 0.08;
        projection.fitSize([w - padX * 2, h - padY * 2], bounds);
        projection.translate([w / 2, h / 2 - padY * 0.1]);
        projection.clipExtent([[0, 0], [w, h]]);
        if (path) renderTerrainLayer();
        initParticles();
      }
    }

    const resizeObserver = new ResizeObserver(() => setupCanvas());
    resizeObserver.observe(container);

    Promise.all([
      import("d3"),
      import("topojson-client"),
      fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json").then((r) => r.json()),
      fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json").then((r) => r.json()),
    ])
      .then(([d3Module, topoClient, world, countriesWorld]) => {
        d3 = d3Module;
        projection = d3.geoNaturalEarth1();
        setupCanvas();

        const bounds = {
          type: "Feature" as const,
          geometry: { type: "Polygon" as const, coordinates: [[[-180, -58], [180, -58], [180, 85], [-180, 85], [-180, -58]]] },
          properties: {},
        };
        const padX = w * 0.02, padY = h * 0.12;
        projection.fitSize([w - padX * 2, h - padY * 2], bounds);
        projection.translate([w / 2, h / 2 + padY * 0.15]);
        projection.clipExtent([[0, 0], [w, h]]);

        path = d3.geoPath(projection, ctx!);
        landFeature = (topoClient as any).feature(world, world.objects.land);
        countriesFeature = (topoClient as any).feature(countriesWorld, countriesWorld.objects.countries);

        renderTerrainLayer();
        initParticles();
        initialized = true;

        if (visibleRef.current && !animRef.current) animate();
      })
      .catch((err) => console.error("[ShowroomMap] Failed to load:", err));

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting && initialized && !animRef.current) animate();
      },
      { threshold: 0.05 },
    );
    intersectionObserver.observe(canvas);

    // ── Interaction ───────────────────────────────────────────────────
    let lastMoveTime = 0;
    function findNearestCity(cx: number, cy: number): City | null {
      if (!projection) return null;
      let nearest: City | null = null, nearestDist = Infinity;
      for (const city of SHOWROOM_CITIES) {
        const p = projection(city.coords);
        if (!p) continue;
        const dist = Math.hypot(p[0] - cx, p[1] - cy);
        if (dist < 22 && dist < nearestDist) { nearestDist = dist; nearest = city; }
      }
      return nearest;
    }
    function getCoords(e: MouseEvent | Touch): [number, number] {
      const r = canvas!.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    }
    function onMouseMove(e: MouseEvent) {
      const now = performance.now();
      if (now - lastMoveTime < 33) return;
      lastMoveTime = now;
      const [cx, cy] = getCoords(e);
      const city = findNearestCity(cx, cy);
      if (city) {
        const p = projection(city.coords);
        if (p) setHovered(city, p[0], p[1]);
        canvas!.style.cursor = "pointer";
      } else { setHovered(null); canvas!.style.cursor = "default"; }
    }
    function onClick(e: MouseEvent) {
      const [cx, cy] = getCoords(e);
      const city = findNearestCity(cx, cy);
      if (city) onCityToggleRef.current(city);
    }
    function onMouseLeave() { setHovered(null); canvas!.style.cursor = "default"; }
    function onTouchEnd(e: TouchEvent) {
      if (!e.changedTouches.length) return;
      const [cx, cy] = getCoords(e.changedTouches[0]);
      const city = findNearestCity(cx, cy);
      if (city) { e.preventDefault(); onCityToggleRef.current(city); }
    }

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });

    // ── Animation ─────────────────────────────────────────────────────
    function animate() {
      if (!ctx || !d3 || !projection || !landFeature) return;
      frame++;
      const selected = selectedRef.current;
      const hovered = hoveredRef.current;
      const t = frame * 0.008;

      // ── Background ──────────────────────────────────────────────────
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);

      // ── Subtle graticule ────────────────────────────────────────────
      ctx.strokeStyle = "rgba(190,180,160,0.04)";
      ctx.lineWidth = 0.5;
      for (let lat = -40; lat <= 80; lat += 20) {
        ctx.beginPath();
        let started = false;
        for (let lon = -180; lon <= 180; lon += 2) {
          const p = projection([lon, lat]);
          if (p) { if (!started) { ctx.moveTo(p[0], p[1]); started = true; } else ctx.lineTo(p[0], p[1]); }
        }
        ctx.stroke();
      }
      for (let lon = -180; lon <= 180; lon += 30) {
        ctx.beginPath();
        let started = false;
        for (let lat = -50; lat <= 85; lat += 2) {
          const p = projection([lon, lat]);
          if (p) { if (!started) { ctx.moveTo(p[0], p[1]); started = true; } else ctx.lineTo(p[0], p[1]); }
        }
        ctx.stroke();
      }

      // ── Ocean — subtle animated current lines ───────────────────────
      ctx.strokeStyle = "rgba(170,180,200,0.025)";
      ctx.lineWidth = 0.7;
      for (let lat = -25; lat <= 65; lat += 12) {
        ctx.beginPath();
        let started = false;
        for (let lon = -180; lon <= 180; lon += 2) {
          const wLat = lat + Math.sin((lon + frame * 0.06) * 0.035) * 3
            + Math.cos((lon * 0.05 + frame * 0.02)) * 1.5;
          const p = projection([lon, wLat]);
          if (p) { if (!started) { ctx.moveTo(p[0], p[1]); started = true; } else ctx.lineTo(p[0], p[1]); }
        }
        ctx.stroke();
      }

      // ── Pre-rendered terrain (static) ───────────────────────────────
      if (terrainLayer) {
        ctx.drawImage(terrainLayer, 0, 0, w, h);
      }

      // ── Route arcs ──────────────────────────────────────────────────
      if (selected.length >= 2) {
        const splitSegs = (pts: [number, number][]): [number, number][][] => {
          const segs: [number, number][][] = [];
          let cur: [number, number][] = [pts[0]];
          for (let k = 1; k < pts.length; k++) {
            if (Math.abs(pts[k][0] - pts[k - 1][0]) > w * 0.3) {
              if (cur.length > 1) segs.push(cur);
              cur = [pts[k]];
            } else cur.push(pts[k]);
          }
          if (cur.length > 1) segs.push(cur);
          return segs;
        };

        for (let i = 0; i < selected.length; i++) {
          for (let j = i + 1; j < selected.length; j++) {
            const interp = d3.geoInterpolate(selected[i].coords, selected[j].coords);
            const pts: [number, number][] = [];
            for (let s = 0; s <= 80; s++) {
              const p = projection(interp(s / 80));
              if (p) pts.push(p);
            }
            if (pts.length < 2) continue;
            const segs = splitSegs(pts);

            // Wide glow
            for (const seg of segs) {
              ctx.beginPath();
              ctx.moveTo(seg[0][0], seg[0][1]);
              for (let k = 1; k < seg.length; k++) ctx.lineTo(seg[k][0], seg[k][1]);
              ctx.strokeStyle = "rgba(200,170,110,0.08)";
              ctx.lineWidth = 10;
              ctx.lineCap = "round";
              ctx.stroke();
            }

            // Dashed arc
            ctx.setLineDash([6, 5]);
            for (const seg of segs) {
              ctx.beginPath();
              ctx.moveTo(seg[0][0], seg[0][1]);
              for (let k = 1; k < seg.length; k++) ctx.lineTo(seg[k][0], seg[k][1]);
              ctx.strokeStyle = "rgba(184,151,106,0.35)";
              ctx.lineWidth = 1.2;
              ctx.lineCap = "round";
              ctx.stroke();
            }
            ctx.setLineDash([]);

            // Endpoint flares
            for (const ep of [pts[0], pts[pts.length - 1]]) {
              if (!ep) continue;
              const fg = ctx.createRadialGradient(ep[0], ep[1], 0, ep[0], ep[1], 14);
              fg.addColorStop(0, "rgba(200,170,110,0.25)");
              fg.addColorStop(1, "rgba(200,170,110,0.0)");
              ctx.beginPath();
              ctx.arc(ep[0], ep[1], 14, 0, Math.PI * 2);
              ctx.fillStyle = fg;
              ctx.fill();
            }

            // Particles
            for (let p = 0; p < 3; p++) {
              const baseT = (t * 0.28 + i * 0.37 + j * 0.23 + p / 3) % 1;
              for (let tail = 0; tail < 4; tail++) {
                const tt = baseT - tail * 0.015;
                const clamped = ((tt % 1) + 1) % 1;
                const idx = Math.min(Math.floor(clamped * pts.length), pts.length - 1);
                const pt = pts[idx];
                if (!pt) continue;
                const fade = 1 - tail / 4;
                const sz = (tail === 0 ? 2.8 : 1.8) * fade;
                const al = (tail === 0 ? 0.8 : 0.35) * fade;
                if (tail === 0) {
                  const glow = ctx.createRadialGradient(pt[0], pt[1], 0, pt[0], pt[1], 9);
                  glow.addColorStop(0, `rgba(210,175,90,${(al * 0.4).toFixed(3)})`);
                  glow.addColorStop(1, "rgba(210,175,90,0.0)");
                  ctx.beginPath();
                  ctx.arc(pt[0], pt[1], 9, 0, Math.PI * 2);
                  ctx.fillStyle = glow;
                  ctx.fill();
                }
                ctx.beginPath();
                ctx.arc(pt[0], pt[1], sz, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(195,160,80,${al.toFixed(3)})`;
                ctx.fill();
              }
            }
          }
        }
      }

      // ── City dots ───────────────────────────────────────────────────
      for (const city of SHOWROOM_CITIES) {
        const p = projection(city.coords);
        if (!p) continue;
        const tier = getCityTier(city.name);
        const isSel = selected.some(c => c.coords[0] === city.coords[0] && c.coords[1] === city.coords[1]);
        const isHov = hovered && hovered.coords[0] === city.coords[0] && hovered.coords[1] === city.coords[1];
        const baseR = tier === 1 ? 5 : tier === 2 ? 3.8 : 2.8;
        const glowR = tier === 1 ? 16 : tier === 2 ? 12 : 8;
        const glowMul = tier === 1 ? 1 : tier === 2 ? 0.7 : 0.45;

        if (isSel) {
          // Rings
          const r1 = (frame * 0.015) % 1;
          ctx.beginPath(); ctx.arc(p[0], p[1], 6 + r1 * 28, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(184,151,106,${((1 - r1) * 0.3).toFixed(3)})`; ctx.lineWidth = 1.5; ctx.stroke();
          const r2 = ((frame * 0.015 + 0.5) % 1);
          ctx.beginPath(); ctx.arc(p[0], p[1], 6 + r2 * 28, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(184,151,106,${((1 - r2) * 0.15).toFixed(3)})`; ctx.lineWidth = 1; ctx.stroke();

          // Glow
          const gl = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], 22);
          gl.addColorStop(0, "rgba(210,175,90,0.45)"); gl.addColorStop(0.4, "rgba(210,175,90,0.12)"); gl.addColorStop(1, "rgba(210,175,90,0.0)");
          ctx.beginPath(); ctx.arc(p[0], p[1], 22, 0, Math.PI * 2); ctx.fillStyle = gl; ctx.fill();

          // Core
          ctx.beginPath(); ctx.arc(p[0], p[1], isHov ? baseR + 1.5 : baseR + 0.5, 0, Math.PI * 2);
          ctx.fillStyle = "#C8A44E"; ctx.fill();
          // Highlight
          ctx.beginPath(); ctx.arc(p[0], p[1], 2.2, 0, Math.PI * 2);
          ctx.fillStyle = "#F0DCA8"; ctx.fill();
        } else {
          const breath = 0.5 + Math.sin(frame * 0.016 + p[0] * 0.01 + p[1] * 0.007) * 0.3;

          // Outer glow
          const gl = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], glowR);
          gl.addColorStop(0, `rgba(170,140,80,${(breath * 0.4 * glowMul).toFixed(3)})`);
          gl.addColorStop(0.5, `rgba(170,140,80,${(breath * 0.12 * glowMul).toFixed(3)})`);
          gl.addColorStop(1, "rgba(170,140,80,0.0)");
          ctx.beginPath(); ctx.arc(p[0], p[1], glowR, 0, Math.PI * 2); ctx.fillStyle = gl; ctx.fill();

          // Hover ring
          if (isHov) {
            ctx.beginPath(); ctx.arc(p[0], p[1], 16, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(184,151,106,0.2)"; ctx.lineWidth = 1; ctx.stroke();
          }

          // Shadow under dot (raised effect)
          ctx.beginPath(); ctx.arc(p[0] + 0.8, p[1] + 0.8, baseR, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(100,80,40,${(0.12 * glowMul).toFixed(3)})`; ctx.fill();

          // Core dot
          const dotR = isHov ? baseR + 1.2 : baseR;
          ctx.beginPath(); ctx.arc(p[0], p[1], dotR, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(160,130,65,${(breath + 0.3).toFixed(3)})`; ctx.fill();

          // Specular highlight (top-left of dot)
          ctx.beginPath(); ctx.arc(p[0] - baseR * 0.25, p[1] - baseR * 0.25, baseR * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(240,225,185,${(0.3 * glowMul).toFixed(3)})`; ctx.fill();

          if (isHov) {
            ctx.beginPath(); ctx.arc(p[0], p[1], 1.8, 0, Math.PI * 2);
            ctx.fillStyle = "#E8D098"; ctx.fill();
          }
        }

        // City labels — Tier 1
        if (tier === 1 && !isSel) {
          ctx.save();
          ctx.font = "600 8px var(--font-inter), system-ui, sans-serif";
          ctx.textAlign = "left"; ctx.textBaseline = "middle";
          // Text shadow
          ctx.fillStyle = "rgba(250,247,242,0.7)";
          ctx.fillText(city.name.toUpperCase(), p[0] + baseR + 7, p[1] + 2);
          ctx.fillStyle = "rgba(120,105,75,0.5)";
          ctx.fillText(city.name.toUpperCase(), p[0] + baseR + 6, p[1] + 1);
          ctx.restore();
        }
      }

      // ── Ambient particles ───────────────────────────────────────────
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(190,175,140,${p.a.toFixed(3)})`; ctx.fill();
      }

      // ── Fades ───────────────────────────────────────────────────────
      const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.4, w / 2, h / 2, Math.max(w, h) * 0.7);
      vg.addColorStop(0, "rgba(250,247,242,0.0)"); vg.addColorStop(0.7, "rgba(250,247,242,0.0)"); vg.addColorStop(1, "rgba(250,247,242,0.4)");
      ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);

      const topFade = ctx.createLinearGradient(0, 0, 0, h * 0.14);
      topFade.addColorStop(0, "rgba(250,247,242,0.9)"); topFade.addColorStop(0.6, "rgba(250,247,242,0.3)"); topFade.addColorStop(1, "rgba(250,247,242,0.0)");
      ctx.fillStyle = topFade; ctx.fillRect(0, 0, w, h * 0.14);

      const botFade = ctx.createLinearGradient(0, h * 0.68, 0, h);
      botFade.addColorStop(0, "rgba(250,247,242,0.0)"); botFade.addColorStop(0.35, "rgba(250,247,242,0.5)"); botFade.addColorStop(0.7, "rgba(250,247,242,0.85)"); botFade.addColorStop(1, "rgba(250,247,242,0.95)");
      ctx.fillStyle = botFade; ctx.fillRect(0, h * 0.68, w, h * 0.32);

      animRef.current = visibleRef.current ? requestAnimationFrame(animate) : null;
    }

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={containerRef} className="relative w-full h-full" style={{ background: BG }}>
      <canvas ref={canvasRef} className="w-full h-full" style={{ display: "block" }} />
      {hoveredCity && (
        <div className="absolute pointer-events-none" style={{ left: tooltipPos.x, top: tooltipPos.y - 38, transform: "translate(-50%, -100%)" }}>
          <div className="px-3.5 py-2 rounded-lg text-xs whitespace-nowrap" style={{
            background: "rgba(255,255,255,0.95)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(184,151,106,0.2)", color: "#0F0F0D", fontFamily: "var(--font-inter)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(184,151,106,0.1)",
          }}>
            <span style={{ color: "#B8976A", marginRight: 5, fontSize: "8px" }}>◆</span>
            {hoveredCity.name}
            <span className="ml-2" style={{ color: "#A8A49E", fontSize: "10px" }}>{hoveredCity.region}</span>
          </div>
        </div>
      )}
    </div>
  );
}

const BG = "#FAF7F2";
