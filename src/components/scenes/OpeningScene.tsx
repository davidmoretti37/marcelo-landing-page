"use client";

import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { planeProxy } from "@/components/three/PlaneCanvas";

export default function OpeningScene() {
  const section = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 2, // slower scrub for smooth feel
        },
      });

      // Gentle camera drift — like floating through the sky
      // 0%–40%: very slow upward drift
      tl.to(planeProxy, {
        camY: 0.3,
        duration: 0.4,
        ease: "sine.inOut",
      }, 0);

      // 40%–100%: clouds slowly part, sky opens up
      tl.to(planeProxy, {
        cloudSpread: 1.0,
        duration: 0.6,
        ease: "power1.inOut",
      }, 0.4);

      tl.to(planeProxy, {
        cloudOpacity: 0,
        duration: 0.5,
        ease: "power1.in",
      }, 0.5);
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={section}
      style={{
        height: "300vh",
        background: "transparent",
        position: "relative",
      }}
    />
  );
}
