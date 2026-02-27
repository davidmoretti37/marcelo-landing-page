"use client";

import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import GlobeCanvas from "@/components/globe/GlobeCanvas";
import WorldClock from "@/components/ui/WorldClock";
import { usePlaneControls } from "@/components/three/PlaneCanvas";

export default function GlobeScene() {
  const section = useRef<HTMLElement>(null);
  const { setState } = usePlaneControls();

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section.current, start: "top top", end: "+=200%", pin: true, scrub: 1,
          onEnter: () => setState({ visible: false }),
          onEnterBack: () => setState({ visible: false }),
        },
      });

      tl.from(".g-label", { y: 20, opacity: 0, duration: 0.15 }, 0);
      tl.from(".g-heading", { y: 30, opacity: 0, duration: 0.2 }, 0.05);
      tl.from(".g-sub", { y: 20, opacity: 0, duration: 0.15 }, 0.1);
      tl.from(".g-globe", { scale: 0.9, opacity: 0, duration: 0.25 }, 0.05);
      tl.from(".clock-card", { x: 30, opacity: 0, duration: 0.15, stagger: 0.06 }, 0.15);
      tl.to(".g-content", { y: -30, opacity: 0, duration: 0.3 }, 0.75);
    }, section);

    return () => ctx.revert();
  }, [setState]);

  return (
    <section ref={section} className="h-screen bg-cream relative overflow-hidden">
      <div className="g-content" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(24px, 4vw, 60px)", maxWidth: 1280, margin: "0 auto", height: "100%", padding: "0 clamp(24px, 5vw, 64px)", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div className="g-globe" style={{ width: "100%", maxWidth: 480, aspectRatio: "1" }}>
            <GlobeCanvas />
          </div>
        </div>
        <div>
          <p className="g-label" style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: "#B8976A", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 28, height: 1, background: "#B8976A", display: "inline-block" }} />
            Global Presence
          </p>
          <h2 className="g-heading" style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 200, lineHeight: 1.1, textTransform: "uppercase", letterSpacing: "0.02em", color: "#0C1220", marginBottom: 12 }}>
            Worldwide<br />Reach
          </h2>
          <p className="g-sub" style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.8, color: "rgba(12,18,32,0.45)", maxWidth: 400, marginBottom: 32 }}>
            Three decades of trusted relationships across borders, connecting buyers and sellers on every continent.
          </p>
          <WorldClock />
        </div>
      </div>
    </section>
  );
}
