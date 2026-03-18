"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";

// Bolt logo paths (viewBox 0 0 362 448)
const PATH_TOP = "M200.264 1.188L0.618 225.27C0.263 225.669 0.066 226.185 0.066 226.719V330.356C0.066 331.558 1.041 332.533 2.244 332.533H153.334C154.536 332.533 155.511 331.558 155.511 330.356V258.665C155.511 257.463 154.536 256.488 153.334 256.488H79.937C78.042 256.488 77.051 254.236 78.332 252.839L203.494 116.334C203.862 115.933 204.067 115.408 204.067 114.863V2.637C204.067 0.636 201.595-0.306 200.264 1.188Z";
const PATH_BOTTOM = "M161.803 446.69L361.449 222.608C361.804 222.21 362 221.694 362 221.16V117.523C362 116.32 361.025 115.346 359.823 115.346H208.733C207.531 115.346 206.556 116.32 206.556 117.523V189.214C206.556 190.416 207.531 191.391 208.733 191.391H282.13C284.025 191.391 285.015 193.643 283.735 195.04L158.572 331.545C158.204 331.946 158 332.471 158 333.016V445.242C158 447.243 160.472 448.184 161.803 446.69Z";

interface IntroSplashProps {
  onComplete?: () => void;
}

export default function IntroSplash({ onComplete }: IntroSplashProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);
  const [done, setDone] = useState(false);

  // Pre-calculate path lengths before paint — avoids layout thrashing during animation
  useLayoutEffect(() => {
    const p1 = path1Ref.current;
    const p2 = path2Ref.current;
    if (!p1 || !p2) return;

    const len1 = p1.getTotalLength();
    const len2 = p2.getTotalLength();
    p1.style.strokeDasharray = `${len1}`;
    p1.style.strokeDashoffset = `${len1}`;
    p2.style.strokeDasharray = `${len2}`;
    p2.style.strokeDashoffset = `${len2}`;
  }, []);

  useEffect(() => {
    const overlay = overlayRef.current;
    const svg = svgRef.current;
    const glow = glowRef.current;
    const p1 = path1Ref.current;
    const p2 = path2Ref.current;
    if (!overlay || !svg || !glow || !p1 || !p2) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Fade in SVG
      tl.to(svg, { opacity: 1, duration: 0.4, ease: "power2.out" }, 0.2);

      // Draw both paths
      tl.to(p1, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut" }, 0.3);
      tl.to(p2, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut" }, 0.5);

      // Flash glow behind logo
      tl.to(glow, { opacity: 1, duration: 0.12, ease: "power2.in" }, 2.1);
      tl.to(glow, { opacity: 0, duration: 0.5, ease: "power2.out" }, 2.22);

      // Fill paths + hide stroke
      tl.to([p1, p2], { fill: "rgba(184,151,106,0.9)", duration: 0.3, ease: "power1.in" }, 2.1);
      tl.to([p1, p2], { stroke: "transparent", duration: 0.2 }, 2.3);

      // Zoom + fade out logo
      tl.to(svg, {
        scale: 15,
        opacity: 0,
        duration: 0.7,
        ease: "expo.in",
      }, 2.6);

      // Overlay fades
      tl.to(overlay, {
        opacity: 0,
        duration: 0.4,
        onComplete: () => { setDone(true); onComplete?.(); },
      }, 3.0);
    }, overlayRef);

    return () => ctx.revert();
  }, [onComplete]);

  if (done) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "#0a0c14" }}
    >
      {/* Glow flash — static radial gradient, just animate opacity */}
      <div
        ref={glowRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0,
          background: "radial-gradient(ellipse at 50% 50%, rgba(200,169,110,0.35) 0%, transparent 50%)",
          willChange: "opacity",
        }}
      />
      <svg
        ref={svgRef}
        viewBox="0 0 362 448"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: 100, height: "auto", opacity: 0, willChange: "transform, opacity" }}
      >
        <path
          ref={path1Ref}
          d={PATH_TOP}
          fill="none"
          stroke="#C8A96E"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          ref={path2Ref}
          d={PATH_BOTTOM}
          fill="none"
          stroke="#C8A96E"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
