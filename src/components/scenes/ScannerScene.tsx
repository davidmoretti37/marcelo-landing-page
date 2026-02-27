"use client";

import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import XRaySection from "@/components/xray/XRaySection";
import { usePlaneControls } from "@/components/three/PlaneCanvas";

export default function ScannerScene() {
  const introRef = useRef<HTMLElement>(null);
  const { setState } = usePlaneControls();

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // Brief intro text before scanner
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: introRef.current,
          start: "top top",
          end: "+=80%",
          pin: true,
          scrub: 1,
          onEnter: () => setState({ visible: false }),
        },
      });

      tl.from(".scanner-label", { y: 15, opacity: 0, duration: 0.3 }, 0);
      tl.from(".scanner-heading", { y: 25, opacity: 0, duration: 0.3 }, 0.1);
      tl.to(".scanner-intro-content", { y: -30, opacity: 0, duration: 0.4 }, 0.6);
    }, introRef);

    return () => ctx.revert();
  }, [setState]);

  return (
    <>
      {/* Intro */}
      <section
        ref={introRef}
        className="h-screen bg-cream relative overflow-hidden flex items-center justify-center"
      >
        <div className="scanner-intro-content" style={{ textAlign: "center" }}>
          <p
            className="scanner-label"
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#B8976A",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <span
              style={{
                width: 28,
                height: 1,
                background: "#B8976A",
                display: "inline-block",
              }}
            />
            Interior Layout
            <span
              style={{
                width: 28,
                height: 1,
                background: "#B8976A",
                display: "inline-block",
              }}
            />
          </p>

          <h2
            className="scanner-heading"
            style={{
              fontSize: "clamp(36px, 5vw, 64px)",
              fontWeight: 200,
              lineHeight: 1.1,
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              color: "#0C1220",
            }}
          >
            Cabin
            <br />
            Revealed
          </h2>
        </div>
      </section>

      {/* Actual X-Ray scanner */}
      <XRaySection />
    </>
  );
}
