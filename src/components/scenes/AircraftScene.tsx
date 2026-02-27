"use client";

import { useRef, useLayoutEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PLANE_INFO } from "@/lib/constants";
import { planeProxy, usePlaneControls } from "@/components/three/PlaneCanvas";

export default function AircraftScene() {
  const section = useRef<HTMLElement>(null);
  const { setState } = usePlaneControls();
  const [idx, setIdx] = useState(0);
  const [showSpecs, setShowSpecs] = useState(false);
  const plane = PLANE_INFO[idx];

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: "+=300%",
          pin: true,
          scrub: 1,
          onUpdate: (self) => {
            const p = self.progress;

            // Model swap
            if (p < 0.45) { setIdx(0); setState({ modelIndex: 0 }); }
            else if (p > 0.55) { setIdx(1); setState({ modelIndex: 1 }); }

            // Specs visibility
            setShowSpecs((p > 0.25 && p < 0.45) || (p > 0.75 && p < 0.95));
          },
          onLeave: () => setState({ visible: false }),
          onLeaveBack: () => setState({ visible: true }),
        },
      });

      // Set dark mode + auto-rotate via proxy (at 1% progress, not 0, to avoid immediate fire)
      tl.call(() => {
        Object.assign(planeProxy, {
          fogNear: 50, fogFar: 100,
          exposure: 1.2,
          autoRotate: true,
          floorVisible: false,
        });
      }, [], 0.01);

      // Info panel animations
      tl.from(".ac-info", { x: -40, opacity: 0, duration: 0.2 }, 0);
      tl.from(".ac-label", { y: 10, opacity: 0, duration: 0.1 }, 0.05);
      tl.from(".ac-name", { y: 20, opacity: 0, duration: 0.15 }, 0.08);
      tl.from(".ac-desc", { y: 15, opacity: 0, duration: 0.15 }, 0.12);
      tl.from(".ac-stat", { y: 10, opacity: 0, stagger: 0.03, duration: 0.1 }, 0.15);

      // Midpoint crossfade
      tl.to(".ac-info", { opacity: 0, x: -20, duration: 0.1 }, 0.45);
      tl.fromTo(".ac-info", { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.1 }, 0.55);

      // Fade out at end
      tl.to(".ac-info", { opacity: 0, y: -20, duration: 0.15 }, 0.9);
    }, section);

    return () => ctx.revert();
  }, [setState]);

  return (
    <section ref={section} style={{ height: "100vh", background: "#08090e", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 65% 50%, rgba(184,151,106,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div className="ac-info" style={{ position: "absolute", left: "clamp(32px, 6vw, 100px)", top: "50%", transform: "translateY(-50%)", maxWidth: 400, zIndex: 10 }}>
        <p className="ac-label" style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.28em", color: "#B8976A", textTransform: "uppercase", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 28, height: 1, background: "#B8976A", opacity: 0.6, display: "inline-block" }} />
          The Fleet
        </p>

        <h2 className="ac-name" style={{ fontSize: "clamp(32px, 4vw, 56px)", fontWeight: 200, color: "#fff", lineHeight: 1.1, marginBottom: 12, letterSpacing: "0.02em" }}>
          {plane.name}
        </h2>

        <p className="ac-desc" style={{ fontSize: 14, fontWeight: 300, color: "rgba(255,255,255,0.45)", lineHeight: 1.75, marginBottom: 32, maxWidth: 340 }}>
          {plane.desc}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 28px", marginBottom: 28 }}>
          {plane.stats.map((s) => (
            <div key={s.key} className="ac-stat" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12 }}>
              <div style={{ fontSize: 22, fontWeight: 300, color: "#fff", letterSpacing: "0.02em", lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 10, fontWeight: 400, letterSpacing: "0.18em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginTop: 5 }}>{s.key}</div>
            </div>
          ))}
        </div>

        {showSpecs && (
          <div style={{ borderTop: "1px solid rgba(184,151,106,0.15)", paddingTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {plane.blueprint.specGroups.slice(0, 2).map((g) => (
              <div key={g.title}>
                <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.3em", color: "#B8976A", textTransform: "uppercase", marginBottom: 8 }}>{g.title}</div>
                {g.specs.slice(0, 3).map((sp) => (
                  <div key={sp.key} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{sp.key}</span>
                    <span style={{ fontSize: 12, color: "#fff", fontWeight: 400, fontVariantNumeric: "tabular-nums" }}>{sp.val}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
          {PLANE_INFO.map((_, i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i === idx ? "#B8976A" : "rgba(255,255,255,0.2)", transition: "all 0.3s", transform: i === idx ? "scale(1.4)" : "scale(1)" }} />
          ))}
        </div>
      </div>
    </section>
  );
}
