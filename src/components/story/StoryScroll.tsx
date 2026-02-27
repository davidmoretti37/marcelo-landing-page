"use client";

import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { planeProxy } from "@/components/three/PlaneCanvas";

/*
  8-Act cinematic scroll journey.
  Camera physically ascends through clouds → space → globe → descent → aircraft.
  Every proxy value is read by the Three.js render loop each frame.
  2000vh scroll height = slow, cinematic pacing. Each act has room to breathe.
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
         ACT 1: SPARK Brand Reveal (0–15%)
         Camera among close clouds. Gentle rise. Looking horizontal.
       ═══════════════════════════════════════════════════════ */
      tl.to(planeProxy, {
        camY: 3,
        lookY: 1,
        showPlane: 0,
        duration: 0.15,
        ease: "sine.inOut",
      }, 0);

      /* ═══════════════════════════════════════════════════════
         ACT 2: The Mission (15–30%)
         Camera ascends through near clouds. Sky starts hinting dark.
       ═══════════════════════════════════════════════════════ */
      tl.to(planeProxy, {
        camY: 15,
        lookY: 5,
        skyDarkness: 0.3,
        duration: 0.15,
        ease: "power1.inOut",
      }, 0.15);

      /* ═══════════════════════════════════════════════════════
         ACT 3: Into Space — The Story (30–48%)
         Camera rises above clouds into the star sphere.
         Globe made visible early — appears as distant speck.
         Camera smoothly flies toward the globe through stars.
       ═══════════════════════════════════════════════════════ */
      // Phase 1 (30-38%): Rise through clouds into stars, sky darkens
      tl.to(planeProxy, {
        camY: 50,
        camZ: 6,
        lookY: 110,
        skyDarkness: 1,
        duration: 0.08,
        ease: "power1.inOut",
      }, 0.30);

      // Position globe early (still invisible — globeVisible is 0)
      tl.to(planeProxy, {
        globePosY: 110,
        globePosX: 0,
        duration: 0.01,
        ease: "none",
      }, 0.35);

      // Globe fades in as camera approaches (40–48%)
      tl.to(planeProxy, {
        globeVisible: 1,
        duration: 0.08,
        ease: "power1.in",
      }, 0.40);

      // Phase 2 (38-48%): Zoom toward the globe through the stars
      tl.to(planeProxy, {
        camY: 110,
        camZ: 5,
        lookY: 110,
        duration: 0.10,
        ease: "power1.out",
      }, 0.38);

      /* ═══════════════════════════════════════════════════════
         ACT 4: Discover Earth — Globe (48–62%)
         Camera already at globe altitude. Gently frame it.
       ═══════════════════════════════════════════════════════ */
      // Slide to framing position (already at Y≈110)
      tl.to(planeProxy, {
        camX: -1.0,
        camY: 110.8,
        camZ: 4.2,
        lookX: 0,
        lookY: 110,
        lookZ: 0,
        duration: 0.06,
        ease: "power2.out",
      }, 0.48);

      // Orbit the globe slowly
      tl.to(planeProxy, {
        camX: 1.0,
        camY: 109.8,
        camZ: 3.8,
        lookY: 110,
        globeRotY: Math.PI * 1.8,
        duration: 0.08,
        ease: "none",
      }, 0.54);

      // Flight arcs draw during orbit
      tl.to(planeProxy, {
        arcProgress: 1,
        duration: 0.10,
        ease: "power1.inOut",
      }, 0.50);

      /* ═══════════════════════════════════════════════════════
         ACT 5: What We Do — Services (62–74%)
         Continue orbiting globe among the stars.
       ═══════════════════════════════════════════════════════ */
      tl.to(planeProxy, {
        camX: -0.5,
        camY: 110.5,
        camZ: 4.0,
        lookY: 110,
        globeRotY: Math.PI * 2.4,
        duration: 0.12,
        ease: "none",
      }, 0.62);

      /* ═══════════════════════════════════════════════════════
         ACT 6: Descent — Marcelo's Quote (74–84%)
         Globe exits. Camera descends back through clouds.
         Sky brightens. Stars scroll away.
       ═══════════════════════════════════════════════════════ */
      // Phase 1 (74-80%): Globe fades, camera tilts down, sky starts brightening
      // Mirrors the ascent — slow, cinematic descent
      tl.to(planeProxy, {
        globeVisible: 0,
        globePosX: -3,
        camX: 0,
        camY: 50,
        camZ: 6,
        lookY: 5,
        skyDarkness: 0.3,
        duration: 0.06,
        ease: "power1.inOut",
      }, 0.74);

      // Phase 2 (80-84%): Descend through stars into clouds, sky fully bright
      tl.to(planeProxy, {
        camY: 8,
        camZ: 5,
        lookY: 2,
        skyDarkness: 0,
        duration: 0.04,
        ease: "power1.inOut",
      }, 0.80);

      /* ═══════════════════════════════════════════════════════
         ACT 7: Terrain Flyover (84–93%)
         Camera flies over GLSL Perlin-noise terrain hills.
       ═══════════════════════════════════════════════════════ */
      // Terrain fades in
      tl.to(planeProxy, {
        terrainOpacity: 1,
        duration: 0.04,
        ease: "power2.in",
      }, 0.82);

      // Terrain scrolls forward (flyover effect)
      tl.to(planeProxy, {
        terrainScroll: 1,
        duration: 0.16,
        ease: "none",
      }, 0.84);

      // Camera flies over terrain — low altitude, looking forward
      tl.to(planeProxy, {
        camX: 0,
        camY: 4,
        camZ: 6,
        lookY: 0,
        duration: 0.05,
        ease: "power1.inOut",
      }, 0.84);

      // Slight drift for cinematic feel
      tl.to(planeProxy, {
        camX: -1,
        camY: 3,
        camZ: 7,
        lookY: -0.5,
        duration: 0.04,
        ease: "power1.inOut",
      }, 0.89);

      // Terrain fades out before contact
      tl.to(planeProxy, {
        terrainOpacity: 0,
        duration: 0.02,
        ease: "power2.out",
      }, 0.91);

      /* ═══════════════════════════════════════════════════════
         ACT 8: Contact (93–100%)
         Camera settles among close clouds. Final framing.
       ═══════════════════════════════════════════════════════ */
      tl.to(planeProxy, {
        camZ: 10,
        camX: 0,
        camY: 1,
        lookY: 0,
        rotY: Math.PI * 0.5,
        duration: 0.07,
        ease: "power2.inOut",
      }, 0.93);
    }, scrollRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={scrollRef}
      className="scroll-driver"
      style={{
        height: "2000vh",
        position: "relative",
        pointerEvents: "none",
      }}
    />
  );
}
