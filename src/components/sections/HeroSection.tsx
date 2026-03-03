"use client";

import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SkyCanvas from "@/components/three/SkyCanvas";

const SERIF = "var(--font-cormorant), Georgia, serif";
const SANS = "var(--font-inter), system-ui, sans-serif";
const HUD = "var(--font-b612), 'B612 Mono', monospace";

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const chevronRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.to(sectionRef.current, {
        opacity: 0,
        y: -60,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      if (chevronRef.current) {
        gsap.to(chevronRef.current, {
          opacity: 0,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "15% top",
            scrub: true,
          },
        });
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1,
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* 3D sky + clouds */}
      <SkyCanvas />

      {/* Subtle vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 85% 85% at 50% 50%, transparent 40%, rgba(0,0,0,0.2) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Text directly on the sky */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "0 24px",
        }}
      >
        <p
          style={{
            fontFamily: HUD,
            fontSize: 10,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "rgba(184,151,106,0.9)",
            marginBottom: 20,
            textShadow: "0 1px 12px rgba(0,0,0,0.3)",
          }}
        >
          SPARK AVIATION
        </p>

        <h1
          style={{
            fontFamily: SERIF,
            fontSize: "clamp(52px, 8vw, 96px)",
            fontWeight: 300,
            color: "#ffffff",
            lineHeight: 1.0,
            margin: 0,
            letterSpacing: "0.02em",
            textShadow: "0 2px 30px rgba(0,0,0,0.2)",
          }}
        >
          Spark Jets
        </h1>

        <div
          style={{
            width: 56,
            height: 1,
            background: "linear-gradient(to right, transparent, rgba(184,151,106,0.8), transparent)",
            margin: "32px 0",
          }}
        />

        <p
          style={{
            fontFamily: SANS,
            fontSize: 16,
            fontWeight: 300,
            color: "rgba(255,255,255,0.9)",
            lineHeight: 1.5,
            margin: 0,
            textShadow: "0 1px 12px rgba(0,0,0,0.2)",
          }}
        >
          Elevating Excellence in Aviation
        </p>

        <p
          style={{
            fontFamily: HUD,
            fontSize: 10,
            letterSpacing: "0.18em",
            color: "rgba(255,255,255,0.5)",
            marginTop: 20,
            textShadow: "0 1px 8px rgba(0,0,0,0.2)",
          }}
        >
          Aircraft Sales &middot; Acquisition &middot; Management
        </p>
      </div>

      {/* Scroll indicator */}
      <div
        ref={chevronRef}
        style={{
          position: "absolute",
          bottom: 36,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          zIndex: 2,
        }}
      >
        <span
          style={{
            fontFamily: HUD,
            fontSize: 8,
            letterSpacing: "0.3em",
            color: "rgba(255,255,255,0.45)",
            textTransform: "uppercase",
            textShadow: "0 1px 6px rgba(0,0,0,0.2)",
          }}
        >
          Scroll
        </span>
        <div
          style={{
            width: 1,
            height: 28,
            background: "linear-gradient(to bottom, rgba(255,255,255,0.45), transparent)",
            animation: "scrollPulse 2s ease-in-out infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.3; transform: scaleY(1); }
          50% { opacity: 0.8; transform: scaleY(1.15); }
        }
      `}</style>
    </section>
  );
}
