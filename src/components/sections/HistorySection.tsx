"use client";

import Image from "next/image";
import { STORY_TEXT, FOUNDER_QUOTE } from "@/lib/constants";
import SectionLabel from "@/components/ui/SectionLabel";
import WorldClock from "@/components/ui/WorldClock";
import useScrollFade from "@/hooks/useScrollFade";

const SERIF = "var(--font-inter), system-ui, sans-serif";
const SANS = "var(--font-inter), system-ui, sans-serif";
const GOLD = "#B8976A";

export default function HistorySection() {
  const leftRef = useScrollFade<HTMLDivElement>({ y: 30 });
  const rightRef = useScrollFade<HTMLDivElement>({ y: 30, delay: 0.15 });

  return (
    <section
      style={{
        background: "#0a0906",
        padding: "clamp(80px, 10vw, 160px) clamp(24px, 5vw, 80px)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "clamp(40px, 5vw, 80px)",
          alignItems: "start",
        }}
        className="history-grid"
      >
        {/* Left: Image + WorldClock */}
        <div ref={leftRef}>
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "3 / 4",
              borderRadius: 8,
              overflow: "hidden",
              marginBottom: 32,
            }}
          >
            <Image
              src="/images/fleet/detail-1.jpg"
              alt="Private jet detail"
              fill
              sizes="(max-width: 768px) 90vw, 45vw"
              style={{ objectFit: "cover" }}
            />
          </div>
          <WorldClock />
        </div>

        {/* Right: Founder story */}
        <div ref={rightRef}>
          <SectionLabel text="The Founder" />

          <h2
            style={{
              fontFamily: SERIF,
              fontSize: "clamp(32px, 4vw, 40px)",
              fontWeight: 300,
              color: GOLD,
              lineHeight: 1.2,
              margin: "0 0 8px 0",
            }}
          >
            Marcelo Borin
          </h2>

          <p
            style={{
              fontFamily: SANS,
              fontSize: 12,
              fontWeight: 300,
              color: GOLD,
              letterSpacing: "0.08em",
              margin: "0 0 24px 0",
            }}
          >
            S&atilde;o Paulo &rarr; Washington &rarr; Boca Raton
          </p>

          {/* Gold divider */}
          <div
            style={{
              width: 40,
              height: 1,
              background: GOLD,
              marginBottom: 24,
            }}
          />

          <p
            style={{
              fontFamily: SANS,
              fontSize: 15,
              fontWeight: 200,
              color: "rgba(255,255,255,0.55)",
              lineHeight: 2.0,
              margin: "0 0 40px 0",
            }}
          >
            {STORY_TEXT}
          </p>

          {/* Blockquote */}
          <div style={{ position: "relative", paddingLeft: 24 }}>
            {/* Decorative quote mark */}
            <span
              style={{
                position: "absolute",
                top: -20,
                left: -8,
                fontFamily: SERIF,
                fontSize: 120,
                fontWeight: 300,
                color: "rgba(255,255,255,0.03)",
                lineHeight: 1,
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              &ldquo;
            </span>
            <blockquote
              style={{
                fontFamily: SERIF,
                fontSize: "clamp(16px, 2vw, 20px)",
                fontWeight: 300,
                fontStyle: "italic",
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.7,
                margin: 0,
                borderLeft: `2px solid rgba(184,151,106,0.25)`,
                paddingLeft: 20,
              }}
            >
              {FOUNDER_QUOTE}
            </blockquote>
            <cite
              style={{
                display: "block",
                fontFamily: SANS,
                fontSize: 10,
                fontWeight: 300,
                color: GOLD,
                letterSpacing: "0.15em",
                marginTop: 16,
                fontStyle: "normal",
                paddingLeft: 22,
              }}
            >
              &mdash; MARCELO BORIN, FOUNDER
            </cite>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .history-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
