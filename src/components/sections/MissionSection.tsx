"use client";

import { BRAND_MISSION, SERVICES, COMPANY_STATS } from "@/lib/constants";
import SectionLabel from "@/components/ui/SectionLabel";
import StatCounter from "@/components/ui/StatCounter";
import useScrollFade from "@/hooks/useScrollFade";

const SERIF = "var(--font-inter), system-ui, sans-serif";
const SANS = "var(--font-inter), system-ui, sans-serif";
const GOLD = "#B8976A";

export default function MissionSection() {
  const headingRef = useScrollFade<HTMLDivElement>({ y: 30 });
  const cardsRef = useScrollFade<HTMLDivElement>({ y: 30, delay: 0.15 });
  const statsRef = useScrollFade<HTMLDivElement>({ y: 20, delay: 0.1 });

  return (
    <section
      style={{
        position: "relative",
        zIndex: 2,
        background: "#0a0906",
        padding: "clamp(80px, 10vw, 160px) clamp(24px, 5vw, 80px)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Two-column layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "clamp(40px, 5vw, 80px)",
            alignItems: "start",
          }}
          className="mission-grid"
        >
          {/* Left: Mission text */}
          <div ref={headingRef}>
            <SectionLabel text="Our Mission" />
            <h2
              style={{
                fontFamily: SERIF,
                fontSize: "clamp(32px, 4vw, 48px)",
                fontWeight: 300,
                color: "#f5f0e8",
                lineHeight: 1.2,
                margin: "0 0 24px 0",
              }}
            >
              Moving Dreams,
              <br />
              Not Just Aircraft.
            </h2>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 15,
                fontWeight: 200,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.9,
                margin: 0,
                maxWidth: 480,
              }}
            >
              {BRAND_MISSION}
            </p>
          </div>

          {/* Right: Service cards */}
          <div
            ref={cardsRef}
            style={{ display: "flex", flexDirection: "column", gap: 24 }}
          >
            {SERVICES.map((svc) => (
              <div
                key={svc.title}
                style={{
                  borderLeft: `2px solid rgba(184,151,106,0.25)`,
                  paddingLeft: 20,
                  paddingTop: 4,
                  paddingBottom: 4,
                  transition: "border-color 0.3s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderLeftColor = GOLD)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderLeftColor = "rgba(184,151,106,0.25)")
                }
              >
                <h3
                  style={{
                    fontFamily: SERIF,
                    fontSize: 20,
                    fontWeight: 400,
                    color: GOLD,
                    margin: "0 0 8px 0",
                  }}
                >
                  {svc.title}
                </h3>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: 13,
                    fontWeight: 200,
                    color: "rgba(255,255,255,0.45)",
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {svc.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div
          ref={statsRef}
          style={{
            marginTop: "clamp(60px, 8vw, 100px)",
            paddingTop: "clamp(40px, 5vw, 60px)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "center",
            gap: "clamp(40px, 6vw, 80px)",
            flexWrap: "wrap",
          }}
        >
          {COMPANY_STATS.map((stat) => (
            <StatCounter
              key={stat.label}
              value={stat.value}
              prefix={stat.prefix}
              suffix={stat.suffix}
              label={stat.label}
            />
          ))}
        </div>
      </div>

      {/* Responsive: stack columns on mobile */}
      <style>{`
        @media (max-width: 768px) {
          .mission-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
