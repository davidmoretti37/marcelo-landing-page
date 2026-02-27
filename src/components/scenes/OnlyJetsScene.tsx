"use client";

import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { planeProxy } from "@/components/three/PlaneCanvas";

export default function OnlyJetsScene() {
  const section = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: "+=150%",
          pin: true,
          scrub: 1,
        },
      });

      // Ensure plane is in showcase mode (cream bg, no fog)
      tl.call(() => {
        Object.assign(planeProxy, {
          fogNear: 50, fogFar: 100, exposure: 1.4,
          autoRotate: false, floorVisible: false,
        });
      }, [], 0.01);

      // Text animations
      tl.from(".oj-only", { x: "-100%", opacity: 0, duration: 0.3, ease: "power2.out" }, 0);
      tl.from(".oj-jets", { x: "100%", opacity: 0, duration: 0.3, ease: "power2.out" }, 0.05);
      tl.from(".oj-line", { width: 0, duration: 0.2 }, 0.15);
      tl.to(".oj-wrap", { y: "-30vh", scale: 0.5, opacity: 0.15, duration: 0.5 }, 0.4);
      tl.to(".oj-wrap", { opacity: 0, duration: 0.2 }, 0.85);
    }, section);

    return () => ctx.revert();
  }, []);

  const big = {
    fontSize: "clamp(60px, 12vw, 160px)", fontWeight: 200,
    letterSpacing: "0.2em", color: "#0C1220",
    textTransform: "uppercase" as const, lineHeight: 1,
  };

  return (
    <section ref={section} className="h-screen bg-cream relative overflow-hidden flex items-center justify-center">
      <div className="oj-wrap" style={{ textAlign: "center", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(16px, 3vw, 40px)" }}>
          <span className="oj-only" style={big}>Only</span>
          <span className="oj-jets" style={big}>Jets</span>
        </div>
        <div className="oj-line" style={{ width: "30%", height: 1, background: "#B8976A", margin: "20px auto 0" }} />
        <p style={{ marginTop: 20, fontSize: 11, fontWeight: 400, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(12,18,32,0.3)" }}>
          Aircraft Sales · Acquisition · Management
        </p>
      </div>
    </section>
  );
}
