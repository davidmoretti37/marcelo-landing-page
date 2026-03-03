"use client";

import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { planeProxy } from "@/components/three/PlaneCanvas";

/*
  5-Act Descent Briefing.
  Camera: cruise (Y=50) → globe orbit → descent through stars → cloud break + plane → landing.
  Globe at Y=48. Clouds at Y=-3 to Y=22. Plane at Y=0.
  3000vh scroll height = slow, cinematic pacing.
*/
export default function StoryScroll() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: scrollRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 3.5,
        },
      });

      /* ═══════════════════════════════════════════════════════
         ACT 1: THE ALTITUDE (0–20%)
         Cruise at 45,000 ft. Stars. Globe below. Brand panel.
       ═══════════════════════════════════════════════════════ */
      tl.to(planeProxy, {
        camX: 0.5,
        camY: 48,
        lookY: 46,
        globeRotY: Math.PI * 1.2,
        duration: 0.20,
        ease: "none",
      }, 0);

      /* ═══════════════════════════════════════════════════════
         ACT 2: THE REACH (20–40%)
         Orbit globe. Arcs animate. Global scale.
       ═══════════════════════════════════════════════════════ */
      tl.to(planeProxy, {
        camX: 0.8,
        camY: 46,
        camZ: 4.5,
        lookX: 0,
        lookY: 45,
        globeRotY: Math.PI * 2.2,
        arcProgress: 1,
        duration: 0.20,
        ease: "none",
      }, 0.20);

      /* ═══════════════════════════════════════════════════════
         ACT 3: THE MAN (40–60%)
         Globe fades. Descend through stars into atmosphere.
       ═══════════════════════════════════════════════════════ */
      // Globe exits
      tl.to(planeProxy, {
        globeVisible: 0,
        globePosX: -2,
        duration: 0.04,
        ease: "power1.in",
      }, 0.40);

      // Camera drops through stars
      tl.to(planeProxy, {
        camX: 0,
        camY: 25,
        camZ: 6,
        lookX: 0,
        lookY: 22,
        skyDarkness: 0.3,
        cloudOpacity: 0.3,
        duration: 0.20,
        ease: "power2.in",
      }, 0.40);

      /* ═══════════════════════════════════════════════════════
         ACT 4: THE FLEET — The Climax (60–85%)
         Phase A: Cloud wall. Phase B: Cloud break + plane.
         Phase C: Showcase orbit.
       ═══════════════════════════════════════════════════════ */
      // Phase A: Descend into thick cloud wall (60-68%)
      tl.to(planeProxy, {
        camY: 10,
        lookY: 5,
        skyDarkness: 0.05,
        cloudOpacity: 0.8,
        duration: 0.08,
        ease: "power1.in",
      }, 0.60);

      // Phase B: Clouds break, plane revealed (68-72%)
      tl.to(planeProxy, {
        camY: 4,
        camZ: 9,
        lookY: 0.5,
        cloudOpacity: 0.2,
        duration: 0.04,
        ease: "power2.out",
      }, 0.68);

      tl.to(planeProxy, {
        showPlane: 1,
        autoRotate: true,
        duration: 0.03,
        ease: "power2.in",
      }, 0.68);

      // Phase C: Showcase — camera drifts, plane rotates (72-85%)
      tl.to(planeProxy, {
        camX: 0.3,
        camY: 3,
        camZ: 10,
        lookY: 0.3,
        lookZ: -2,
        cloudOpacity: 0.15,
        duration: 0.13,
        ease: "none",
      }, 0.72);

      /* ═══════════════════════════════════════════════════════
         ACT 5: THE DOOR (85–100%)
         Plane fades. Settle into soft clouds. Landing.
       ═══════════════════════════════════════════════════════ */
      // Plane fades out
      tl.to(planeProxy, {
        showPlane: 0,
        duration: 0.02,
      }, 0.85);

      // Settle into clouds
      tl.to(planeProxy, {
        camX: 0,
        camY: 1,
        camZ: 10,
        lookY: 0,
        lookZ: 0,
        cloudOpacity: 1,
        skyDarkness: 0,
        duration: 0.15,
        ease: "power2.inOut",
      }, 0.85);
    }, scrollRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={scrollRef}
      className="scroll-driver"
      style={{
        height: "3000vh",
        position: "relative",
        pointerEvents: "none",
      }}
    />
  );
}
