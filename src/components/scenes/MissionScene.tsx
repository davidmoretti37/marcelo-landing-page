"use client";

import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { COMPANY_STATS } from "@/lib/constants";

export default function MissionScene() {
  const section = useRef<HTMLElement>(null);
  const statEls = useRef<(HTMLSpanElement | null)[]>([]);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: section.current, start: "top top", end: "+=200%", pin: true, scrub: 1 },
      });

      tl.from(".m-label", { y: 20, opacity: 0, duration: 0.15 }, 0);
      tl.from(".m-heading", { y: 30, opacity: 0, duration: 0.2 }, 0.05);
      tl.from(".m-body", { y: 20, opacity: 0, duration: 0.2 }, 0.12);
      tl.from(".m-qmark", { scale: 0.8, opacity: 0, duration: 0.2 }, 0.1);
      tl.from(".m-quote", { y: 20, opacity: 0, duration: 0.2 }, 0.15);
      tl.from(".m-cite", { opacity: 0, duration: 0.15 }, 0.2);
      tl.from(".m-stats", { y: 30, opacity: 0, duration: 0.2 }, 0.25);

      // Animated counters
      COMPANY_STATS.forEach((stat, i) => {
        const obj = { v: 0 };
        tl.to(obj, {
          v: stat.value, duration: 0.3, ease: "power1.out",
          onUpdate: () => {
            const el = statEls.current[i];
            if (el) el.textContent = (stat.prefix || "") + Math.round(obj.v).toLocaleString() + (stat.suffix || "");
          },
        }, 0.25);
      });

      tl.to(".m-content", { y: -40, opacity: 0, duration: 0.3 }, 0.7);
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={section} className="h-screen bg-cream relative overflow-hidden">
      <div
        className="m-content"
        style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(40px, 6vw, 100px)",
          maxWidth: 1200, margin: "0 auto", height: "100%",
          padding: "0 clamp(24px, 5vw, 80px)", alignItems: "center",
        }}
      >
        {/* Left — Story */}
        <div>
          <p className="m-label" style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: "#B8976A", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 28, height: 1, background: "#B8976A", display: "inline-block" }} />
            The Spark Story
          </p>

          <h2 className="m-heading" style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 200, lineHeight: 1.1, color: "#0C1220", marginBottom: 24, textTransform: "uppercase", letterSpacing: "0.02em" }}>
            Three Decades of<br />Aviation Excellence
          </h2>

          <p className="m-body" style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.8, color: "rgba(12,18,32,0.5)", maxWidth: 440 }}>
            Spark Jets was born from a pilot&apos;s conviction that the aircraft transaction experience could be better — more personal, more informed, and built on genuine relationships rather than transactional pressure.
          </p>
        </div>

        {/* Right — Quote */}
        <div style={{ position: "relative" }}>
          <span className="m-qmark" style={{ position: "absolute", top: -40, left: -20, fontSize: "clamp(160px, 20vw, 300px)", fontWeight: 200, color: "rgba(12,18,32,0.04)", lineHeight: 1, pointerEvents: "none", userSelect: "none" }}>
            &ldquo;
          </span>
          <blockquote className="m-quote" style={{ fontSize: "clamp(20px, 2.5vw, 32px)", fontWeight: 300, lineHeight: 1.6, color: "#0C1220", fontStyle: "italic", position: "relative", zIndex: 1 }}>
            &ldquo;I knew how to serve, how to fly, and how to connect with people. That&apos;s what this company is built on.&rdquo;
          </blockquote>
          <cite className="m-cite" style={{ display: "block", marginTop: 20, fontSize: 10, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "#B8976A", fontStyle: "normal" }}>
            Marcelo Borin — Founder
          </cite>
        </div>
      </div>

      {/* Stats bar */}
      <div className="m-stats" style={{ position: "absolute", bottom: "10%", left: 0, right: 0, display: "flex", justifyContent: "center", gap: "clamp(40px, 6vw, 80px)" }}>
        {COMPANY_STATS.map((stat, i) => (
          <div key={stat.label} style={{ textAlign: "center" }}>
            <span
              ref={(el) => { statEls.current[i] = el; }}
              style={{ fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 200, color: "#B8976A", lineHeight: 1, display: "block" }}
            >
              {stat.prefix || ""}0{stat.suffix || ""}
            </span>
            <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(12,18,32,0.3)", marginTop: 6, display: "block" }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
