"use client";

import { useState } from "react";
import Image from "next/image";
import { PLANE_INFO } from "@/lib/constants";
import SectionLabel from "@/components/ui/SectionLabel";
import useScrollFade from "@/hooks/useScrollFade";

const SERIF = "var(--font-cormorant), Georgia, serif";
const SANS = "var(--font-inter), system-ui, sans-serif";
const HUD = "var(--font-b612), 'B612 Mono', monospace";
const GOLD = "#B8976A";

const FLEET_IMAGES = ["/images/fleet/fleet-1.jpg", "/images/fleet/fleet-3.jpg"];
const THUMB_IMAGES = [
  "/images/fleet/fleet-1.jpg",
  "/images/fleet/fleet-2.jpg",
  "/images/fleet/detail-1.jpg",
  "/images/fleet/detail-2.jpg",
];

export default function FleetSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const headerRef = useScrollFade<HTMLDivElement>({ y: 20 });
  const contentRef = useScrollFade<HTMLDivElement>({ y: 30, delay: 0.1 });

  const plane = PLANE_INFO[activeIdx];
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  return (
    <section
      style={{
        background: "#0C1220",
        padding: "clamp(80px, 10vw, 160px) clamp(24px, 5vw, 80px)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div ref={headerRef} style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <SectionLabel text="The Fleet" />
          </div>
          <h2
            style={{
              fontFamily: SERIF,
              fontSize: "clamp(36px, 5vw, 52px)",
              fontWeight: 300,
              color: "#f5f0e8",
              margin: "0 0 8px 0",
            }}
          >
            Find Your Jet
          </h2>
          <p
            style={{
              fontFamily: SANS,
              fontSize: 11,
              fontWeight: 200,
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "0.1em",
            }}
          >
            Select inventory &middot; Updated weekly
          </p>
        </div>

        {/* Tab navigation */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 16,
            marginBottom: 48,
          }}
        >
          {PLANE_INFO.map((p, i) => (
            <button
              key={p.name}
              onClick={() => {
                setActiveIdx(i);
                setExpandedGroup(null);
              }}
              style={{
                fontFamily: HUD,
                fontSize: 11,
                letterSpacing: "0.08em",
                padding: "10px 24px",
                borderRadius: 24,
                border: `1px solid ${i === activeIdx ? GOLD : "rgba(255,255,255,0.15)"}`,
                background: i === activeIdx ? "rgba(184,151,106,0.08)" : "transparent",
                color: i === activeIdx ? GOLD : "rgba(255,255,255,0.4)",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Content: image + specs */}
        <div
          ref={contentRef}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "clamp(32px, 4vw, 60px)",
            alignItems: "start",
          }}
          className="fleet-grid"
        >
          {/* Left: Fleet photo */}
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "4 / 3",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <Image
              src={FLEET_IMAGES[activeIdx]}
              alt={plane.name}
              fill
              sizes="(max-width: 768px) 90vw, 50vw"
              style={{ objectFit: "cover", transition: "opacity 0.3s" }}
              priority
            />
          </div>

          {/* Right: Specs panel */}
          <div>
            <h3
              style={{
                fontFamily: SERIF,
                fontSize: "clamp(24px, 3vw, 36px)",
                fontWeight: 300,
                color: "#f5f0e8",
                margin: "0 0 8px 0",
              }}
            >
              {plane.name}
            </h3>

            {/* Category badge */}
            <span
              style={{
                display: "inline-block",
                fontFamily: HUD,
                fontSize: 9,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: GOLD,
                border: `1px solid rgba(184,151,106,0.35)`,
                borderRadius: 12,
                padding: "4px 12px",
                marginBottom: 16,
              }}
            >
              {plane.blueprint.category}
            </span>

            <p
              style={{
                fontFamily: SANS,
                fontSize: 13,
                fontWeight: 200,
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.7,
                margin: "0 0 24px 0",
              }}
            >
              {plane.desc}
            </p>

            {/* Quick stats 2x2 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 32,
              }}
            >
              {plane.stats.map((stat) => (
                <div
                  key={stat.key}
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: SERIF,
                      fontSize: 22,
                      fontWeight: 300,
                      color: "#f5f0e8",
                      lineHeight: 1,
                    }}
                  >
                    {stat.val}
                  </div>
                  <div
                    style={{
                      fontFamily: HUD,
                      fontSize: 8,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.3)",
                      marginTop: 6,
                    }}
                  >
                    {stat.key}
                  </div>
                </div>
              ))}
            </div>

            {/* Spec groups (collapsible) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {plane.blueprint.specGroups.map((group) => {
                const isOpen = expandedGroup === group.title;
                return (
                  <div
                    key={group.title}
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <button
                      onClick={() =>
                        setExpandedGroup(isOpen ? null : group.title)
                      }
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 0",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: isOpen ? GOLD : "rgba(255,255,255,0.5)",
                        fontFamily: HUD,
                        fontSize: 10,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        transition: "color 0.2s",
                      }}
                    >
                      {group.title}
                      <span
                        style={{
                          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                          fontSize: 12,
                        }}
                      >
                        &#9662;
                      </span>
                    </button>
                    {isOpen && (
                      <div style={{ paddingBottom: 16 }}>
                        {group.specs.map((spec) => (
                          <div
                            key={spec.key}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "baseline",
                              padding: "6px 0",
                              borderBottom:
                                "1px dotted rgba(255,255,255,0.04)",
                            }}
                          >
                            <span
                              style={{
                                fontFamily: SANS,
                                fontSize: 12,
                                fontWeight: 200,
                                color: "rgba(255,255,255,0.4)",
                              }}
                            >
                              {spec.key}
                            </span>
                            <span
                              style={{
                                fontFamily: HUD,
                                fontSize: 11,
                                color: "rgba(255,255,255,0.7)",
                              }}
                            >
                              {spec.val}
                              {spec.unit && (
                                <span
                                  style={{
                                    color: "rgba(255,255,255,0.25)",
                                    fontSize: 9,
                                    marginLeft: 6,
                                  }}
                                >
                                  {spec.unit}
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Image strip */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 48,
            overflowX: "auto",
            paddingBottom: 8,
          }}
        >
          {THUMB_IMAGES.map((src, i) => (
            <div
              key={src}
              style={{
                position: "relative",
                width: 160,
                height: 120,
                flexShrink: 0,
                borderRadius: 6,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.06)",
                transition: "border-color 0.3s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "rgba(184,151,106,0.4)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")
              }
            >
              <Image
                src={src}
                alt={`Fleet detail ${i + 1}`}
                fill
                sizes="160px"
                style={{ objectFit: "cover" }}
              />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .fleet-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
