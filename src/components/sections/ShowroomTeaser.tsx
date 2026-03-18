"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

export default function ShowroomTeaser() {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          once: true,
        },
      });

      tl.from(lineRef.current, {
        scaleX: 0,
        duration: 0.8,
        ease: "power3.inOut",
      })
        .from(
          labelRef.current,
          { y: 20, opacity: 0, duration: 0.6, ease: "power3.out" },
          "-=0.3"
        )
        .from(
          headlineRef.current,
          { y: 40, opacity: 0, duration: 0.8, ease: "power3.out" },
          "-=0.4"
        )
        .from(
          subRef.current,
          { y: 20, opacity: 0, duration: 0.6, ease: "power3.out" },
          "-=0.5"
        )
        .from(
          ctaRef.current,
          { y: 20, opacity: 0, duration: 0.6, ease: "power3.out" },
          "-=0.4"
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-32 md:py-44 px-8 md:px-16 overflow-hidden"
      style={{ background: "#080806" }}
    >
      {/* Subtle gold radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 60% at 50% 50%, rgba(200,169,110,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Gold line */}
        <div
          ref={lineRef}
          className="mx-auto mb-10 h-px origin-center"
          style={{
            width: "min(120px, 30vw)",
            background:
              "linear-gradient(90deg, transparent, #C8A96E 50%, transparent)",
          }}
        />

        {/* Label */}
        <p
          ref={labelRef}
          className="font-sans text-[10px] tracking-[0.4em] uppercase mb-6"
          style={{ color: "#6B6860" }}
        >
          Digital Showroom
        </p>

        {/* Headline */}
        <h2
          ref={headlineRef}
          className="font-editorial font-light leading-[1.05] mb-8"
          style={{
            fontSize: "clamp(36px, 6vw, 72px)",
            color: "#F5F2EC",
          }}
        >
          Find your aircraft
          <span style={{ color: "#C8A96E" }}>.</span>
        </h2>

        {/* Sub */}
        <p
          ref={subRef}
          className="font-sans text-[15px] leading-[1.8] max-w-lg mx-auto mb-12"
          style={{ color: "#6B6860" }}
        >
          Select your routes, passengers, and budget — our showroom instantly
          matches you with the right aircraft from our curated inventory.
        </p>

        {/* CTA */}
        <div ref={ctaRef}>
          <Link
            href="/showroom"
            className="inline-block font-sans text-[12px] tracking-[0.2em] uppercase px-10 py-4 transition-all duration-300"
            style={{
              border: "1px solid #C8A96E",
              color: "#C8A96E",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#C8A96E";
              e.currentTarget.style.color = "#080806";
              e.currentTarget.style.boxShadow =
                "0 0 30px rgba(200,169,110,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#C8A96E";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Enter Showroom
          </Link>
        </div>
      </div>
    </section>
  );
}
