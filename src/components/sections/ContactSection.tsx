"use client";

import useScrollFade from "@/hooks/useScrollFade";

const SERIF = "var(--font-cormorant), Georgia, serif";
const SANS = "var(--font-inter), system-ui, sans-serif";
const HUD = "var(--font-b612), 'B612 Mono', monospace";
const GOLD = "#B8976A";

export default function ContactSection() {
  const headingRef = useScrollFade<HTMLDivElement>({ y: 20 });
  const ctaRef = useScrollFade<HTMLDivElement>({ y: 20, delay: 0.15 });

  return (
    <section
      style={{
        background: "#0a0906",
        padding: "clamp(100px, 12vw, 180px) clamp(24px, 5vw, 80px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle radial gold glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "60vw",
          height: "60vh",
          background: "radial-gradient(ellipse, rgba(184,151,106,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* Decorative quote mark */}
        <span
          style={{
            position: "absolute",
            top: -80,
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: SERIF,
            fontSize: 240,
            fontWeight: 300,
            color: "rgba(255,255,255,0.02)",
            lineHeight: 1,
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          &ldquo;
        </span>

        <div ref={headingRef}>
          <h2
            style={{
              fontFamily: SERIF,
              fontSize: "clamp(36px, 5vw, 56px)",
              fontWeight: 300,
              color: "#f5f0e8",
              lineHeight: 1.2,
              margin: "0 0 16px 0",
            }}
          >
            Let&rsquo;s Take Flight Together.
          </h2>
          <p
            style={{
              fontFamily: SANS,
              fontSize: 13,
              fontWeight: 200,
              color: "rgba(255,255,255,0.4)",
              margin: "0 0 32px 0",
            }}
          >
            Marcelo Borin &middot; +1 954 994 4466
          </p>
        </div>

        <div
          ref={ctaRef}
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 16,
            marginBottom: 40,
            flexWrap: "wrap",
          }}
        >
          <a
            href="tel:+19549944466"
            style={{
              fontFamily: HUD,
              fontSize: 11,
              letterSpacing: "0.1em",
              padding: "12px 32px",
              borderRadius: 24,
              border: `1px solid ${GOLD}`,
              color: GOLD,
              textDecoration: "none",
              transition: "all 0.3s ease",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(184,151,106,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Call Now
          </a>
          <a
            href="mailto:marcelo@sparkjets.com"
            style={{
              fontFamily: HUD,
              fontSize: 11,
              letterSpacing: "0.1em",
              padding: "12px 32px",
              borderRadius: 24,
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.5)",
              textDecoration: "none",
              transition: "all 0.3s ease",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
              e.currentTarget.style.color = "rgba(255,255,255,0.8)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
              e.currentTarget.style.color = "rgba(255,255,255,0.5)";
            }}
          >
            Send Email
          </a>
        </div>

        <p
          style={{
            fontFamily: HUD,
            fontSize: 9,
            letterSpacing: "0.15em",
            color: "rgba(255,255,255,0.2)",
          }}
        >
          Boca Raton &middot; S&atilde;o Paulo &middot; Dallas
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "clamp(60px, 8vw, 100px)",
          paddingTop: 24,
          borderTop: "1px solid rgba(184,151,106,0.1)",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: SANS,
            fontSize: 10,
            fontWeight: 200,
            color: "rgba(255,255,255,0.2)",
            letterSpacing: "0.05em",
            margin: 0,
          }}
        >
          &copy; 2026 Spark Jets. All rights reserved.
        </p>
      </div>
    </section>
  );
}
