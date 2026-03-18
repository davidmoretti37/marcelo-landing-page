"use client";

import { useRef, useEffect, type MutableRefObject } from "react";
import { GLOBE_CITIES } from "@/lib/constants";

interface GlobeCanvasProps {
  scrollProgress?: MutableRefObject<number>;
}

export default function GlobeCanvas({ scrollProgress }: GlobeCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const visibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cities = GLOBE_CITIES;
    const arcs: [number, number][][] = [
      [cities[0].coords, cities[1].coords],
      [cities[0].coords, cities[2].coords],
      [cities[1].coords, cities[2].coords],
    ];

    /* eslint-disable @typescript-eslint/no-explicit-any */
    let d3: any;
    let projection: any;
    let path: any;
    let graticule: any;
    const landDots: number[][] = [];
    const oceanDots: number[][] = [];
    /* eslint-enable @typescript-eslint/no-explicit-any */

    let rotation = 70; // start facing Americas
    let frame = 0;
    let w: number, h: number, R: number, cx: number, cy: number;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let dotsReady = false;

    function setupCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const rect = wrapper!.getBoundingClientRect();
      // Use the smaller dimension to keep it square
      const size = Math.min(rect.width, rect.height);
      canvas!.width = size * dpr;
      canvas!.height = size * dpr;
      canvas!.style.width = `${size}px`;
      canvas!.style.height = `${size}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      w = size;
      h = size;
      R = w * 0.42;
      cx = w / 2;
      cy = h / 2;
      if (projection) {
        projection.scale(R).translate([cx, cy]);
      }
    }

    const onResize = () => setupCanvas();
    window.addEventListener("resize", onResize);

    // Build dot maps in non-blocking chunks to avoid freezing the main thread
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function buildDotsAsync(d3Mod: any, land: any) {
      const LAND_STEP = 4;
      const OCEAN_STEP = 10;
      const lats: number[] = [];
      for (let lat = -80; lat <= 80; lat += LAND_STEP) lats.push(lat);
      let idx = 0;

      function processChunk() {
        const end = Math.min(idx + 4, lats.length);
        for (; idx < end; idx++) {
          const lat = lats[idx];
          for (let lon = -180; lon < 180; lon += LAND_STEP) {
            if (d3Mod.geoContains(land, [lon, lat])) {
              landDots.push([lon, lat]);
            }
          }
        }
        if (idx < lats.length) {
          setTimeout(processChunk, 0);
        } else {
          // Ocean dots (sparse, fast enough to do in one go)
          for (let lat = -80; lat <= 80; lat += OCEAN_STEP) {
            for (let lon = -180; lon < 180; lon += OCEAN_STEP) {
              if (!d3Mod.geoContains(land, [lon, lat])) {
                oceanDots.push([lon, lat]);
              }
            }
          }
          dotsReady = true;
        }
      }
      processChunk();
    }

    // Start loading d3, topojson, and world data immediately on mount
    // so everything is ready by the time the user scrolls here
    let initialized = false;

    Promise.all([
      import("d3"),
      import("topojson-client"),
      fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json").then(
        (r) => r.json()
      ),
    ]).then(([d3Module, topoClient, world]) => {
      d3 = d3Module;

      setupCanvas();
      projection = d3.geoOrthographic().scale(R).translate([cx, cy]).clipAngle(90);
      path = d3.geoPath(projection, ctx!);
      graticule = d3.geoGraticule().step([20, 20])();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const land = (topoClient as any).feature(world, world.objects.land);

      buildDotsAsync(d3, land);
      initialized = true;

      // Start animating only if already visible
      if (visibleRef.current && !animRef.current) animate();
    }).catch((err) => {
      console.error("[Globe] Failed to load:", err);
    });

    // IntersectionObserver only controls animation start/stop (not loading)
    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting && initialized && !animRef.current) {
          animate();
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    function animate() {
      if (!ctx || !d3 || !projection) return;

      ctx.clearRect(0, 0, w, h);
      frame++;
      // Hybrid rotation: scroll-driven + slow ambient
      const sp = scrollProgress?.current ?? 0;
      const scrollRotation = sp * 180;
      const ambientRotation = frame * 0.03;
      rotation = 70 + scrollRotation + ambientRotation;
      projection.rotate([rotation, -15, 0]);
      const center = projection.invert([cx, cy]);

      // 1. Subtle outer shadow
      const glow = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.2);
      glow.addColorStop(0, "rgba(0,0,0,0.04)");
      glow.addColorStop(0.6, "rgba(0,0,0,0.02)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.2, 0, Math.PI * 2);
      ctx.fill();

      // 2. White sphere with subtle depth
      const depth = ctx.createRadialGradient(
        cx - R * 0.2, cy - R * 0.2, 0,
        cx, cy, R
      );
      depth.addColorStop(0, "rgba(255,255,255,0.95)");
      depth.addColorStop(0.6, "rgba(248,247,244,0.9)");
      depth.addColorStop(0.95, "rgba(235,232,225,0.85)");
      depth.addColorStop(1, "rgba(220,216,208,0.7)");
      ctx.fillStyle = depth;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // 3. Thin sphere edge
      ctx.beginPath();
      path({ type: "Sphere" });
      ctx.strokeStyle = "rgba(200,169,110,0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // 4. Graticule — faint grid
      ctx.beginPath();
      path(graticule);
      ctx.strokeStyle = "rgba(200,169,110,0.06)";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // 5. Ocean dots (very subtle)
      oceanDots.forEach((d) => {
        const p = projection(d);
        if (p) {
          const dist = d3.geoDistance(d, center);
          if (dist < Math.PI / 2) {
            const fade = 1 - dist / (Math.PI / 2);
            ctx.fillStyle = `rgba(200,169,110,${0.05 + fade * 0.05})`;
            ctx.beginPath();
            ctx.arc(p[0], p[1], 0.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // 6. Land dots — bold gold
      landDots.forEach((d) => {
        const p = projection(d);
        if (p) {
          const dist = d3.geoDistance(d, center);
          if (dist < Math.PI / 2) {
            const fade = 1 - dist / (Math.PI / 2);
            const alpha = 0.5 + fade * 0.5;
            ctx.fillStyle = `rgba(190,155,90,${alpha})`;
            ctx.beginPath();
            ctx.arc(p[0], p[1], 1.4 + fade * 0.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // 7. Connection arcs — smooth glowing lines
      arcs.forEach(([a, b]) => {
        const interp = d3.geoInterpolate(a, b);
        const steps = 80;
        const dashOffset = (frame * 0.015) % 1;
        for (let i = 0; i < steps; i++) {
          const t1 = i / steps;
          const t2 = (i + 1) / steps;
          const p1 = projection(interp(t1));
          const p2 = projection(interp(t2));
          if (p1 && p2) {
            const d1 = d3.geoDistance(interp(t1), center);
            const d2 = d3.geoDistance(interp(t2), center);
            if (d1 < Math.PI / 2 && d2 < Math.PI / 2) {
              const fade1 = 1 - d1 / (Math.PI / 2);
              // Animated traveling pulse along the arc
              const segPhase = (t1 + dashOffset) % 1;
              const pulseIntensity = Math.max(0, 1 - Math.abs(segPhase - 0.5) * 4);
              const scrollBoost = 1 + sp * 2;
              const baseAlpha = 0.15 + fade1 * 0.25;
              const alpha = (baseAlpha + pulseIntensity * 0.5) * scrollBoost;
              // Glow layer
              ctx.strokeStyle = `rgba(180,145,80,${alpha * 0.3})`;
              ctx.lineWidth = 4;
              ctx.beginPath();
              ctx.moveTo(p1[0], p1[1]);
              ctx.lineTo(p2[0], p2[1]);
              ctx.stroke();
              // Core line
              ctx.strokeStyle = `rgba(180,145,80,${alpha})`;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(p1[0], p1[1]);
              ctx.lineTo(p2[0], p2[1]);
              ctx.stroke();
            }
          }
        }
      });

      // 8. Pulsing city markers — glowing gold
      const pulse = Math.sin(frame * 0.04) * 0.5 + 0.5;
      cities.forEach((city) => {
        const p = projection(city.coords);
        if (p) {
          const dist = d3.geoDistance(city.coords, center);
          if (dist < Math.PI / 2) {
            const fade = 1 - dist / (Math.PI / 2);
            // Soft outer glow
            const glowSize = (18 + pulse * 8) * (1 + sp * 0.5);
            const glowGrad = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], glowSize);
            glowGrad.addColorStop(0, `rgba(180,145,80,${0.3 * fade})`);
            glowGrad.addColorStop(0.5, `rgba(180,145,80,${0.1 * fade})`);
            glowGrad.addColorStop(1, "rgba(180,145,80,0)");
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(p[0], p[1], glowSize, 0, Math.PI * 2);
            ctx.fill();
            // Expanding ring
            const ringR = 5 + pulse * 10;
            ctx.beginPath();
            ctx.arc(p[0], p[1], ringR, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(180,145,80,${(1 - pulse) * 0.5 * fade})`;
            ctx.lineWidth = 1;
            ctx.stroke();
            // Solid center dot
            ctx.beginPath();
            ctx.arc(p[0], p[1], 3.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(180,145,80,${0.9 + fade * 0.1})`;
            ctx.fill();
            // Bright core
            ctx.beginPath();
            ctx.arc(p[0], p[1], 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200,169,110,${0.95 * fade})`;
            ctx.fill();
          }
        }
      });

      animRef.current = visibleRef.current ? requestAnimationFrame(animate) : null;
    }

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
