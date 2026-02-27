"use client";

import { useRef, useEffect } from "react";
import { GLOBE_CITIES } from "@/lib/constants";

export default function GlobeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const visibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Intersection observer to pause when off-screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting && !animRef.current) animate();
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

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

    function setupCanvas() {
      w = canvas!.width;
      h = canvas!.height;
      R = w * 0.45;
      cx = w / 2;
      cy = h / 2;
      if (projection) {
        projection.scale(R).translate([cx, cy]);
      }
    }

    Promise.all([
      import("d3"),
      import("topojson-client"),
      fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json").then(
        (r) => r.json()
      ),
    ]).then(([d3Module, topoClient, world]) => {
      console.log("[Globe] d3 loaded, topojson loaded, world data loaded");
      d3 = d3Module;

      setupCanvas();
      projection = d3.geoOrthographic().scale(R).translate([cx, cy]).clipAngle(90);
      path = d3.geoPath(projection, ctx!);
      graticule = d3.geoGraticule().step([20, 20])();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const land = (topoClient as any).feature(world, world.objects.land);

      // Build dotted map — 2px spacing for land, 6px for ocean
      for (let lat = -80; lat <= 80; lat += 2) {
        for (let lon = -180; lon < 180; lon += 2) {
          if (d3.geoContains(land, [lon, lat])) {
            landDots.push([lon, lat]);
          }
        }
      }
      for (let lat = -80; lat <= 80; lat += 6) {
        for (let lon = -180; lon < 180; lon += 6) {
          if (!d3.geoContains(land, [lon, lat])) {
            oceanDots.push([lon, lat]);
          }
        }
      }

      console.log("[Globe] Starting animation, landDots:", landDots.length, "oceanDots:", oceanDots.length);
      animate();
    }).catch((err) => {
      console.error("[Globe] Failed to load:", err);
    });

    function animate() {
      if (!ctx || !d3 || !projection) return;

      ctx.clearRect(0, 0, w, h);
      rotation += 0.12;
      frame++;
      projection.rotate([rotation, -15, 0]);
      const center = projection.invert([cx, cy]);

      // 1. Atmospheric glow behind globe
      const glow = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.3);
      glow.addColorStop(0, "rgba(184,151,106,0.06)");
      glow.addColorStop(0.5, "rgba(184,151,106,0.03)");
      glow.addColorStop(1, "rgba(184,151,106,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // 2. Globe inner depth gradient
      const depth = ctx.createRadialGradient(
        cx - R * 0.15, cy - R * 0.15, 0,
        cx, cy, R
      );
      depth.addColorStop(0, "rgba(248,247,244,0.4)");
      depth.addColorStop(0.7, "rgba(220,215,205,0.1)");
      depth.addColorStop(1, "rgba(180,175,165,0.15)");
      ctx.fillStyle = depth;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // 3. Globe outline
      ctx.beginPath();
      path({ type: "Sphere" });
      ctx.strokeStyle = "rgba(12,18,32,0.15)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 4. Graticule
      ctx.beginPath();
      path(graticule);
      ctx.strokeStyle = "rgba(12,18,32,0.04)";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // 5. Ocean dots (very faint)
      oceanDots.forEach((d) => {
        const p = projection(d);
        if (p) {
          const dist = d3.geoDistance(d, center);
          if (dist < Math.PI / 2) {
            const fade = 1 - dist / (Math.PI / 2);
            ctx.fillStyle = `rgba(12,18,32,${0.02 + fade * 0.025})`;
            ctx.beginPath();
            ctx.arc(p[0], p[1], 0.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // 6. Land dots
      landDots.forEach((d) => {
        const p = projection(d);
        if (p) {
          const dist = d3.geoDistance(d, center);
          if (dist < Math.PI / 2) {
            const fade = 1 - dist / (Math.PI / 2);
            const alpha = 0.25 + fade * 0.65;
            ctx.fillStyle = `rgba(12,18,32,${alpha})`;
            ctx.beginPath();
            ctx.arc(p[0], p[1], 1.5 + fade * 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // 7. Connection arcs between cities
      arcs.forEach(([a, b]) => {
        const interp = d3.geoInterpolate(a, b);
        const steps = 60;
        const dashOffset = (frame * 0.02) % 1;
        ctx.strokeStyle = "rgba(184,151,106,0.85)";
        ctx.lineWidth = 2.5;
        for (let i = 0; i < steps; i++) {
          const t1 = i / steps;
          const t2 = (i + 1) / steps;
          const p1 = projection(interp(t1));
          const p2 = projection(interp(t2));
          if (p1 && p2) {
            const d1 = d3.geoDistance(interp(t1), center);
            const d2 = d3.geoDistance(interp(t2), center);
            if (d1 < Math.PI / 2 && d2 < Math.PI / 2) {
              const segPhase = (t1 + dashOffset) % 0.12;
              if (segPhase < 0.07) {
                const fade1 = 1 - d1 / (Math.PI / 2);
                ctx.globalAlpha = 0.5 + fade1 * 0.5;
                ctx.beginPath();
                ctx.moveTo(p1[0], p1[1]);
                ctx.lineTo(p2[0], p2[1]);
                ctx.stroke();
              }
            }
          }
        }
        ctx.globalAlpha = 1;
      });

      // 8. Pulsing city markers
      const pulse = Math.sin(frame * 0.04) * 0.5 + 0.5;
      cities.forEach((city) => {
        const p = projection(city.coords);
        if (p) {
          const dist = d3.geoDistance(city.coords, center);
          if (dist < Math.PI / 2) {
            const fade = 1 - dist / (Math.PI / 2);
            // Expanding ring
            const ringR = 6 + pulse * 12;
            ctx.beginPath();
            ctx.arc(p[0], p[1], ringR, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(184,151,106,${(1 - pulse) * 0.35 * fade})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            // Second ring (offset phase)
            const pulse2 = Math.sin(frame * 0.04 + Math.PI) * 0.5 + 0.5;
            const ringR2 = 6 + pulse2 * 12;
            ctx.beginPath();
            ctx.arc(p[0], p[1], ringR2, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(184,151,106,${(1 - pulse2) * 0.2 * fade})`;
            ctx.stroke();
            // Solid center dot
            ctx.beginPath();
            ctx.arc(p[0], p[1], 4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(184,151,106,${0.7 + fade * 0.3})`;
            ctx.fill();
            // Bright core
            ctx.beginPath();
            ctx.arc(p[0], p[1], 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,240,220,${0.8 * fade})`;
            ctx.fill();
          }
        }
      });

      animRef.current = visibleRef.current ? requestAnimationFrame(animate) : null;
    }

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={1000}
      height={1000}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
