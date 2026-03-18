"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";

const SkyCanvas = dynamic(() => import("@/components/three/SkyCanvas"), {
  ssr: false,
});

export default function HeroSection({ ready = false }: { ready?: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const statRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const scrollLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Brand name
      gsap.to(brandRef.current, {
        opacity: 1,
        y: 0,
        duration: 1.2,
        delay: 0.4,
        ease: "power3.out",
      });

      // Gold rule draws from center
      gsap.to(ruleRef.current, {
        width: 80,
        duration: 0.8,
        delay: 1.0,
        ease: "power2.inOut",
      });

      // Tagline
      gsap.to(taglineRef.current, {
        opacity: 1,
        duration: 0.7,
        delay: 1.2,
        ease: "power2.out",
      });

      // Stat block
      gsap.to(statRef.current, {
        opacity: 1,
        duration: 0.6,
        delay: 1.6,
        ease: "power2.out",
      });

      // Bottom strip
      gsap.to(stripRef.current, {
        opacity: 1,
        duration: 0.6,
        delay: 1.8,
        ease: "power2.out",
      });

      // Scroll line pulse
      gsap.fromTo(
        scrollLineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          duration: 1.4,
          ease: "power1.inOut",
          yoyo: true,
          repeat: -1,
          transformOrigin: "top center",
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <div className="h-[100dvh]" />
      <section
        ref={sectionRef}
        className="fixed inset-0 w-full h-[100dvh] overflow-hidden flex flex-col justify-center items-center"
        style={{ background: "transparent" }}
        role="banner"
        aria-label="Spark Jets — Private Aviation"
      >
        {/* Sky gradient */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `linear-gradient(
              to bottom,
              #0B1120 0%,
              #162040 20%,
              #1E3060 45%,
              #2A4A7F 65%,
              #3D5C8A 78%,
              #7B8FA8 88%,
              #C4B49A 94%,
              #E8D9C0 100%
            )`,
          }}
        />

        {/* 3D Cloud layer — only mounts after intro finishes to avoid GPU contention */}
        {ready && (
          <div className="absolute inset-0 z-[1] w-full h-full pointer-events-none">
            <SkyCanvas />
          </div>
        )}

        {/* Vignette */}
        <div
          className="absolute inset-0 z-[2] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(8, 12, 24, 0.45) 100%)",
          }}
        />

        {/* Brand block — minimal, centered */}
        <div className="relative z-10 text-center pointer-events-none">
          <div
            ref={brandRef}
            style={{
              fontSize: "clamp(14px, 3.5vw, 22px)",
              fontWeight: 400,
              color: "#FFFFFF",
              letterSpacing: "0.35em",
              textTransform: "uppercase" as const,
              opacity: 0,
              transform: "translateY(30px)",
            }}
          >
            SPARK JETS
          </div>

          {/* Gold rule */}
          <div
            ref={ruleRef}
            style={{
              height: 1,
              background: "#C8A96E",
              margin: "20px auto 0",
              width: 0,
            }}
          />

          {/* Tagline */}
          <p
            ref={taglineRef}
            style={{
              fontSize: 11,
              fontWeight: 300,
              color: "rgba(255, 255, 255, 0.4)",
              letterSpacing: "0.2em",
              textTransform: "uppercase" as const,
              textAlign: "center",
              opacity: 0,
              margin: "16px auto 0",
            }}
          >
            Private Aviation
          </p>
        </div>

        {/* Stat block */}
        <div
          ref={statRef}
          className="absolute z-10 left-6 sm:left-10"
          style={{ bottom: 56, opacity: 0 }}
        >
          <div
            className="font-editorial"
            style={{ fontSize: 22, fontWeight: 300, color: "#FFFFFF" }}
          >
            $2B+
          </div>
          <div
            style={{
              fontSize: 7,
              letterSpacing: "0.25em",
              color: "rgba(255, 255, 255, 0.35)",
              textTransform: "uppercase" as const,
              marginTop: 4,
            }}
          >
            IN GLOBAL TRANSACTIONS
          </div>
        </div>

        {/* Bottom strip */}
        <div
          ref={stripRef}
          className="absolute z-10 pointer-events-none px-6 sm:px-10"
          style={{
            bottom: 0,
            left: 0,
            right: 0,
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: 0,
          }}
        >
          <div
            style={{
              fontSize: 8,
              fontWeight: 500,
              letterSpacing: "0.32em",
              color: "rgba(255, 255, 255, 0.28)",
              textTransform: "uppercase" as const,
            }}
          >
            01 — ARRIVAL
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column" as const,
              alignItems: "flex-end",
              gap: 6,
            }}
          >
            <div
              style={{
                fontSize: 7,
                letterSpacing: "0.3em",
                color: "rgba(255, 255, 255, 0.3)",
                textTransform: "uppercase" as const,
              }}
            >
              SCROLL
            </div>
            <div
              ref={scrollLineRef}
              style={{
                width: 1,
                height: 32,
                background: "rgba(200, 169, 110, 0.4)",
                transformOrigin: "top center",
                transform: "scaleY(0)",
              }}
            />
          </div>
        </div>
      </section>
    </>
  );
}
