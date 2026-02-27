"use client";

import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FOUNDER_QUOTE } from "@/lib/constants";

export default function ContactScene() {
  const sectionRef = useRef<HTMLElement>(null);

  // Parse the quote — words wrapped in |...| get gold emphasis
  const words = FOUNDER_QUOTE.replace(/\|/g, "").split(" ");
  const emphStart = FOUNDER_QUOTE.indexOf("|");
  const emphWords = FOUNDER_QUOTE.slice(emphStart)
    .replace(/\|/g, "")
    .split(" ");

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=150%",
          pin: true,
          scrub: 1,
        },
      });

      // Quote mark fades in
      tl.from(".contact-mark", { scale: 0.9, opacity: 0, duration: 0.2 }, 0);

      // Each word lights up
      words.forEach((_, i) => {
        const startT = 0.05 + (i / words.length) * 0.5;
        tl.to(`.quote-word-${i}`, { opacity: 1, duration: 0.02 }, startT);
      });

      // Cite fades in
      tl.from(".contact-cite", { opacity: 0, duration: 0.1 }, 0.6);

      // Contact info fades in
      tl.from(".contact-info", { y: 20, opacity: 0, duration: 0.15 }, 0.65);
      tl.from(".contact-footer", { opacity: 0, duration: 0.1 }, 0.8);
    }, sectionRef);

    return () => ctx.revert();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      ref={sectionRef}
      className="h-screen bg-cream relative overflow-hidden flex flex-col items-center justify-center"
      style={{ padding: "0 clamp(24px, 8vw, 120px)" }}
    >
      {/* Big quote mark */}
      <span
        className="contact-mark"
        style={{
          position: "absolute",
          top: "8%",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "clamp(200px, 30vw, 500px)",
          fontWeight: 200,
          color: "rgba(12,18,32,0.04)",
          lineHeight: 1,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        &ldquo;
      </span>

      {/* Quote text — word by word */}
      <p
        style={{
          fontSize: "clamp(22px, 3vw, 40px)",
          fontWeight: 300,
          lineHeight: 1.6,
          textAlign: "center",
          maxWidth: 900,
          position: "relative",
          zIndex: 1,
        }}
      >
        {words.map((word, i) => {
          const isEmph = emphWords.includes(word.replace(/[.,]/g, ""));
          return (
            <span
              key={i}
              className={`quote-word-${i}`}
              style={{
                opacity: 0.08,
                color: isEmph ? "#B8976A" : "#0C1220",
                fontStyle: isEmph ? "italic" : "normal",
                transition: "opacity 0.3s",
              }}
            >
              {word}{" "}
            </span>
          );
        })}
      </p>

      <cite
        className="contact-cite"
        style={{
          display: "block",
          marginTop: 32,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "#B8976A",
          fontStyle: "normal",
        }}
      >
        Marcelo Borin — Founder, Spark Jets
      </cite>

      {/* Contact info */}
      <div
        className="contact-info"
        style={{
          marginTop: 60,
          display: "flex",
          gap: 32,
          alignItems: "center",
        }}
      >
        <a
          href="tel:+19549944466"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 32px",
            border: "1px solid rgba(184,151,106,0.4)",
            color: "#B8976A",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            textDecoration: "none",
            transition: "all 0.3s",
          }}
        >
          Call Now
        </a>
        <a
          href="mailto:marcelo@sparkjets.com"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 32px",
            border: "1px solid rgba(12,18,32,0.1)",
            color: "rgba(12,18,32,0.5)",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            textDecoration: "none",
            transition: "all 0.3s",
          }}
        >
          Email
        </a>
      </div>

      <p
        style={{
          marginTop: 16,
          fontSize: 11,
          fontWeight: 400,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "rgba(12,18,32,0.25)",
        }}
      >
        Available 24/7 &middot; Boca Raton &middot; São Paulo &middot; Dallas
      </p>

      {/* Footer */}
      <div
        className="contact-footer"
        style={{
          position: "absolute",
          bottom: 32,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "80%",
            maxWidth: 600,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(184,151,106,0.2), transparent)",
            margin: "0 auto 16px",
          }}
        />
        <p
          style={{
            fontSize: 10,
            color: "rgba(12,18,32,0.15)",
            letterSpacing: "0.1em",
          }}
        >
          &copy; 2026 Spark Jets. All rights reserved.
        </p>
      </div>
    </section>
  );
}
