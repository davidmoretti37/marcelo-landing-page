"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { SHOWROOM_CITIES } from "@/lib/showroom/cities";
import type { City } from "@/lib/showroom/types";

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
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // Store latest props in refs so the animation loop always reads current values
  const selectedRef = useRef(selectedCities);
  selectedRef.current = selectedCities;
  const onCityToggleRef = useRef(onCityToggle);
  onCityToggleRef.current = onCityToggle;
  const hoveredRef = useRef<City | null>(null);

  const setHovered = useCallback(
    (city: City | null, px?: number, py?: number) => {
      hoveredRef.current = city;
      setHoveredCity(city);
      if (city && px !== undefined && py !== undefined) {
        setTooltipPos({ x: px, y: py });
      }
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
    /* eslint-enable @typescript-eslint/no-explicit-any */

    let w = 0;
    let h = 0;
    let frame = 0;
    let initialized = false;

    // ── Canvas sizing ─────────────────────────────────────────────────────────
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
        const padding = Math.min(w, h) * 0.04;
        projection.fitSize(
          [w - padding * 2, h - padding * 2],
          { type: "Sphere" },
        );
        projection.translate([w / 2, h / 2]);
      }
    }

    // ── ResizeObserver ────────────────────────────────────────────────────────
    const resizeObserver = new ResizeObserver(() => {
      setupCanvas();
    });
    resizeObserver.observe(container);

    // ── Async data loading ────────────────────────────────────────────────────
    Promise.all([
      import("d3"),
      import("topojson-client"),
      fetch(
        "https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json",
      ).then((r) => r.json()),
    ])
      .then(([d3Module, topoClient, world]) => {
        d3 = d3Module;

        setupCanvas();

        projection = d3.geoNaturalEarth1();
        const padding = Math.min(w, h) * 0.04;
        projection.fitSize(
          [w - padding * 2, h - padding * 2],
          { type: "Sphere" },
        );
        projection.translate([w / 2, h / 2]);

        path = d3.geoPath(projection, ctx!);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        landFeature = (topoClient as any).feature(
          world,
          world.objects.land,
        );

        initialized = true;

        if (visibleRef.current && !animRef.current) animate();
      })
      .catch((err) => {
        console.error("[ShowroomMap] Failed to load:", err);
      });

    // ── IntersectionObserver ──────────────────────────────────────────────────
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting && initialized && !animRef.current) {
          animate();
        }
      },
      { threshold: 0.05 },
    );
    intersectionObserver.observe(canvas);

    // ── Interaction ───────────────────────────────────────────────────────────
    let lastMoveTime = 0;

    function findNearestCity(
      canvasX: number,
      canvasY: number,
    ): City | null {
      if (!projection) return null;

      let nearest: City | null = null;
      let nearestDist = Infinity;

      for (const city of SHOWROOM_CITIES) {
        const p = projection(city.coords);
        if (!p) continue;
        const dx = p[0] - canvasX;
        const dy = p[1] - canvasY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 20 && dist < nearestDist) {
          nearestDist = dist;
          nearest = city;
        }
      }
      return nearest;
    }

    function getCanvasCoords(e: MouseEvent): [number, number] {
      const rect = canvas!.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top];
    }

    function onMouseMove(e: MouseEvent) {
      const now = performance.now();
      if (now - lastMoveTime < 33) return; // ~30fps throttle
      lastMoveTime = now;

      const [cx, cy] = getCanvasCoords(e);
      const city = findNearestCity(cx, cy);

      if (city) {
        const p = projection(city.coords);
        if (p) {
          setHovered(city, p[0], p[1]);
        }
        canvas!.style.cursor = "pointer";
      } else {
        setHovered(null);
        canvas!.style.cursor = "default";
      }
    }

    function onClick(e: MouseEvent) {
      const [cx, cy] = getCanvasCoords(e);
      const city = findNearestCity(cx, cy);
      if (city) {
        onCityToggleRef.current(city);
      }
    }

    function onMouseLeave() {
      setHovered(null);
      canvas!.style.cursor = "default";
    }

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("mouseleave", onMouseLeave);

    // ── Animation loop ────────────────────────────────────────────────────────
    function animate() {
      if (!ctx || !d3 || !projection || !landFeature) return;

      frame++;
      const selected = selectedRef.current;
      const hovered = hoveredRef.current;
      const pulse = Math.sin(frame * 0.04) * 0.5 + 0.5; // 0..1

      // Clear
      ctx.fillStyle = "#F8F7F4";
      ctx.fillRect(0, 0, w, h);

      // ── Ocean grid lines (subtle latitude lines) ──────────────────────────
      ctx.strokeStyle = "rgba(0,0,0,0.04)";
      ctx.lineWidth = 0.5;
      for (let lat = -60; lat <= 60; lat += 30) {
        const points: [number, number][] = [];
        for (let lon = -180; lon <= 180; lon += 2) {
          const p = projection([lon, lat]);
          if (p) points.push(p);
        }
        if (points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(points[0][0], points[0][1]);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i][0], points[i][1]);
          }
          ctx.stroke();
        }
      }

      // ── Land outlines ─────────────────────────────────────────────────────
      ctx.beginPath();
      path(landFeature);
      ctx.strokeStyle = "rgba(184,151,106,0.2)";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // ── Arcs between selected cities ───────────────────────────────────────
      if (selected.length >= 2) {
        // Split projected points into segments, breaking at antimeridian crossings
        const splitArcSegments = (points: [number, number][]): [number, number][][] => {
          const segments: [number, number][][] = [];
          let current: [number, number][] = [points[0]];
          const wrapThreshold = w * 0.3; // large horizontal jump = antimeridian wrap

          for (let k = 1; k < points.length; k++) {
            const dx = Math.abs(points[k][0] - points[k - 1][0]);
            if (dx > wrapThreshold) {
              // Antimeridian crossing — start a new segment
              if (current.length > 1) segments.push(current);
              current = [points[k]];
            } else {
              current.push(points[k]);
            }
          }
          if (current.length > 1) segments.push(current);
          return segments;
        };

        const drawArcSegments = (segments: [number, number][][], style: string, lineWidth: number) => {
          for (const seg of segments) {
            ctx.beginPath();
            ctx.moveTo(seg[0][0], seg[0][1]);
            for (let k = 1; k < seg.length; k++) {
              ctx.lineTo(seg[k][0], seg[k][1]);
            }
            ctx.strokeStyle = style;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
          }
        };

        for (let i = 0; i < selected.length; i++) {
          for (let j = i + 1; j < selected.length; j++) {
            const a = selected[i].coords;
            const b = selected[j].coords;
            const interp = d3.geoInterpolate(a, b);
            const steps = 50;
            const points: [number, number][] = [];

            for (let s = 0; s <= steps; s++) {
              const t = s / steps;
              const pt = interp(t);
              const p = projection(pt);
              if (p) points.push(p);
            }

            if (points.length > 1) {
              const segments = splitArcSegments(points);
              drawArcSegments(segments, "rgba(184,151,106,0.2)", 4);   // Glow
              drawArcSegments(segments, "rgba(184,151,106,0.7)", 1.5); // Core
            }
          }
        }
      }

      // ── City dots ──────────────────────────────────────────────────────────
      for (const city of SHOWROOM_CITIES) {
        const p = projection(city.coords);
        if (!p) continue;

        const isSelected = selected.some(
          (c) =>
            c.coords[0] === city.coords[0] &&
            c.coords[1] === city.coords[1],
        );
        const isHovered =
          hovered &&
          hovered.coords[0] === city.coords[0] &&
          hovered.coords[1] === city.coords[1];

        if (isSelected) {
          // Pulsing glow ring
          const ringRadius = 8 + pulse * 6; // 8..14
          const ringAlpha = 0.1 + pulse * 0.2; // 0.1..0.3
          ctx.beginPath();
          ctx.arc(p[0], p[1], ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(200,164,78,${ringAlpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Solid dot
          const radius = isHovered ? 6 : 5;
          ctx.beginPath();
          ctx.arc(p[0], p[1], radius, 0, Math.PI * 2);
          ctx.fillStyle = "#B8976A";
          ctx.fill();
        } else {
          // Unselected dot
          const radius = isHovered ? 4 : 3;
          ctx.beginPath();
          ctx.arc(p[0], p[1], radius, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(184,151,106,0.4)";
          ctx.fill();
        }
      }

      animRef.current = visibleRef.current
        ? requestAnimationFrame(animate)
        : null;
    }

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ aspectRatio: "3 / 1" }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: "block" }}
      />
      {hoveredCity && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y - 32,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div
            className="px-3 py-1.5 rounded-md text-xs whitespace-nowrap"
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(184,151,106,0.25)",
              color: "#0F0F0D",
              fontFamily: "var(--font-dm-sans)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            {hoveredCity.name}
            <span
              className="ml-2"
              style={{ color: "#A8A49E", fontSize: "10px" }}
            >
              {hoveredCity.region}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
