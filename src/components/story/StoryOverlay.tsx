"use client";

import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";
import { COMPANY_STATS, PLANE_INFO } from "@/lib/constants";
import GlassSurface from "@/components/ui/GlassSurface";

/*
  Briefing Panel — fixed left panel (38vw) with 5 crossfading acts.
  Content transitions within one GlassSurface container.
  3D scene visible in the right 62vw "window."
*/

const SERIF = "var(--font-cormorant), Georgia, serif";
const SANS = "var(--font-inter), system-ui, sans-serif";
const HUD_FONT = "var(--font-b612), 'B612 Mono', monospace";
const GOLD = "#C4A96B";
const GOLD_BRIGHT = "#d4b978";
const DIM = "rgba(255,255,255,0.35)";

const DESTINATIONS = [
  { code: "KBCT", city: "Boca Raton", region: "FL" },
  { code: "SBGR", city: "S\u00E3o Paulo", region: "BR" },
  { code: "KJFK", city: "New York", region: "NY" },
  { code: "OMDB", city: "Dubai", region: "UAE" },
  { code: "LFPB", city: "Paris Le Bourget", region: "FR" },
  { code: "KDAL", city: "Dallas Love Field", region: "TX" },
];

export default function StoryOverlay() {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    let gsapCtx: ReturnType<typeof gsap.context> | null = null;
    let rafId: number | null = null;

    function init() {
      const scrollDriver = document.querySelector(".scroll-driver");
      if (!scrollDriver) {
        rafId = requestAnimationFrame(init);
        return;
      }
      gsapCtx = gsap.context(() => {
        const d = scrollDriver;

        /* ── ACT 1: BRAND (0-20%) ── */
        gsap.fromTo(".bp-act-1", { opacity: 0 }, {
          opacity: 1,
          scrollTrigger: { trigger: d, start: "1% top", end: "4% top", scrub: 1 },
        });
        gsap.to(".bp-act-1", {
          opacity: 0,
          scrollTrigger: { trigger: d, start: "17% top", end: "20% top", scrub: 1 },
        });

        const brandTitle = new SplitType(".bp-brand-title", { types: "chars" });
        if (brandTitle.chars) {
          gsap.fromTo(brandTitle.chars,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, stagger: 0.02, duration: 0.5, ease: "power4.out",
              scrollTrigger: { trigger: d, start: "2% top", end: "6% top", scrub: 1 } }
          );
        }

        /* ── ACT 2: REACH (20-40%) ── */
        gsap.fromTo(".bp-act-2", { opacity: 0 }, {
          opacity: 1,
          scrollTrigger: { trigger: d, start: "19% top", end: "22% top", scrub: 1 },
        });
        gsap.to(".bp-act-2", {
          opacity: 0,
          scrollTrigger: { trigger: d, start: "37% top", end: "40% top", scrub: 1 },
        });

        // Stat counters
        COMPANY_STATS.forEach((stat, i) => {
          const el = document.querySelector(`.bp-stat-val-${i}`);
          if (el) {
            const obj = { val: 0 };
            gsap.to(obj, {
              val: stat.value,
              duration: 0.10,
              ease: "power1.inOut",
              scrollTrigger: { trigger: d, start: "22% top", end: "30% top", scrub: 1 },
              onUpdate: () => {
                el.textContent = `${stat.prefix || ""}${Math.round(obj.val)}${stat.suffix || ""}`;
              },
            });
          }
        });

        gsap.fromTo(".bp-dest-row", {
          opacity: 0, x: 15,
        }, {
          opacity: 1, x: 0, stagger: 0.02,
          scrollTrigger: { trigger: d, start: "24% top", end: "32% top", scrub: 1 },
        });

        /* ── ACT 3: FOUNDER (40-60%) ── */
        gsap.fromTo(".bp-act-3", { opacity: 0 }, {
          opacity: 1,
          scrollTrigger: { trigger: d, start: "39% top", end: "42% top", scrub: 1 },
        });
        gsap.to(".bp-act-3", {
          opacity: 0,
          scrollTrigger: { trigger: d, start: "57% top", end: "60% top", scrub: 1 },
        });

        const storyBody = new SplitType(".bp-story-body", { types: "lines" });
        if (storyBody.lines) {
          gsap.fromTo(storyBody.lines,
            { opacity: 0, x: -15 },
            { opacity: 1, x: 0, stagger: 0.03, duration: 0.5, ease: "power2.out",
              scrollTrigger: { trigger: d, start: "42% top", end: "50% top", scrub: 1 } }
          );
        }

        gsap.fromTo(".bp-story-kicker", { opacity: 0, y: 8 }, {
          opacity: 1, y: 0,
          scrollTrigger: { trigger: d, start: "50% top", end: "54% top", scrub: 1 },
        });

        /* ── ACT 4: FLEET (60-85%) ── */
        gsap.fromTo(".bp-act-4", { opacity: 0 }, {
          opacity: 1,
          scrollTrigger: { trigger: d, start: "59% top", end: "62% top", scrub: 1 },
        });
        gsap.to(".bp-act-4", {
          opacity: 0,
          scrollTrigger: { trigger: d, start: "82% top", end: "85% top", scrub: 1 },
        });

        gsap.fromTo(".bp-fleet-card", {
          opacity: 0, y: 15,
        }, {
          opacity: 1, y: 0, stagger: 0.05,
          scrollTrigger: { trigger: d, start: "63% top", end: "72% top", scrub: 1 },
        });

        /* ── ACT 5: CONTACT (85-100%) ── */
        gsap.fromTo(".bp-act-5", { opacity: 0 }, {
          opacity: 1,
          scrollTrigger: { trigger: d, start: "84% top", end: "88% top", scrub: 1 },
        });

        const contactTitle = new SplitType(".bp-contact-title", { types: "chars" });
        if (contactTitle.chars) {
          gsap.fromTo(contactTitle.chars,
            { opacity: 0, y: 15 },
            { opacity: 1, y: 0, stagger: 0.03,
              scrollTrigger: { trigger: d, start: "87% top", end: "91% top", scrub: 1 } }
          );
        }

        gsap.fromTo(".bp-act-5 .bp-btn", {
          opacity: 0, y: 10,
        }, {
          opacity: 1, y: 0, stagger: 0.06,
          scrollTrigger: { trigger: d, start: "92% top", end: "96% top", scrub: 1 },
        });

      }, ref);
    }
    rafId = requestAnimationFrame(init);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      gsapCtx?.revert();
    };
  }, []);

  return (
    <div ref={ref} style={{
      position: "fixed",
      left: 0,
      top: 0,
      bottom: 0,
      width: "38vw",
      minWidth: 320,
      zIndex: 10,
      pointerEvents: "none",
      display: "flex",
      alignItems: "center",
      padding: "0 clamp(24px, 3vw, 48px)",
    }}>
      <GlassSurface
        width="100%"
        height="auto"
        borderRadius={8}
        brightness={10}
        opacity={0.9}
        blur={20}
        backgroundOpacity={0.55}
        className="glass-surface--block"
        style={{
          padding: "40px",
          borderRight: "1px solid rgba(196,169,107,0.10)",
          position: "relative",
          minHeight: 400,
        }}
      >
        {/* ── ACT 1: BRAND ── */}
        <div className="bp-act-1" style={{
          position: "absolute",
          inset: 40,
          opacity: 0,
        }}>
          <p style={{
            fontFamily: HUD_FONT,
            fontSize: 8,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(196,169,107,0.4)",
            marginBottom: 20,
          }}>
            Spark Aviation
          </p>
          <h1 className="bp-brand-title" style={{
            fontFamily: SERIF,
            fontSize: "clamp(40px, 4vw, 56px)",
            fontWeight: 300,
            color: "#fff",
            lineHeight: 0.95,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            marginBottom: 24,
          }}>
            Spark<br />Jets
          </h1>
          <div style={{
            width: 40,
            height: 1,
            background: GOLD,
            marginBottom: 24,
          }} />
          <p style={{
            fontFamily: SANS,
            fontSize: 12,
            fontWeight: 200,
            color: "rgba(255,255,255,0.55)",
            lineHeight: 1.8,
            marginBottom: 12,
          }}>
            Elevating Excellence in Aviation
          </p>
          <p style={{
            fontFamily: SANS,
            fontSize: 11,
            fontWeight: 200,
            letterSpacing: "0.08em",
            color: DIM,
          }}>
            Aircraft Sales &middot; Acquisition &middot; Management
          </p>
        </div>

        {/* ── ACT 2: REACH ── */}
        <div className="bp-act-2" style={{
          position: "absolute",
          inset: 40,
          opacity: 0,
        }}>
          <p style={{
            fontFamily: HUD_FONT,
            fontSize: 8,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(196,169,107,0.4)",
            marginBottom: 24,
          }}>
            Global Reach
          </p>

          {/* Stat counters */}
          <div style={{ display: "flex", gap: "clamp(16px, 2vw, 32px)", marginBottom: 24 }}>
            {COMPANY_STATS.map((s, i) => (
              <div key={s.label}>
                <div className={`bp-stat-val-${i}`} style={{
                  fontFamily: SERIF,
                  fontSize: "clamp(32px, 3.5vw, 52px)",
                  fontWeight: 300,
                  color: GOLD_BRIGHT,
                  lineHeight: 1,
                }}>
                  {s.prefix || ""}0{s.suffix || ""}
                </div>
                <div style={{
                  fontFamily: SANS,
                  fontSize: 9,
                  fontWeight: 200,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: DIM,
                  marginTop: 6,
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            width: "100%",
            height: 1,
            background: "rgba(255,255,255,0.06)",
            marginBottom: 16,
          }} />

          {/* Destinations */}
          {DESTINATIONS.map((d) => (
            <div key={d.code} className="bp-dest-row" style={{
              display: "flex",
              alignItems: "baseline",
              gap: 10,
              padding: "5px 0",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              opacity: 0,
            }}>
              <span style={{ fontFamily: HUD_FONT, fontSize: 10, color: "rgba(245,236,216,0.6)", letterSpacing: "0.06em", minWidth: 36 }}>
                {d.code}
              </span>
              <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 200, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                {d.city}
              </span>
              <span style={{ fontFamily: HUD_FONT, fontSize: 8, color: "rgba(196,169,107,0.3)", marginLeft: "auto" }}>
                {d.region}
              </span>
            </div>
          ))}

          <p style={{
            fontFamily: SERIF,
            fontSize: 14,
            fontWeight: 300,
            fontStyle: "italic",
            color: GOLD,
            marginTop: 20,
          }}>
            One man built this.
          </p>
        </div>

        {/* ── ACT 3: FOUNDER ── */}
        <div className="bp-act-3" style={{
          position: "absolute",
          inset: 40,
          opacity: 0,
        }}>
          <p style={{
            fontFamily: HUD_FONT,
            fontSize: 8,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(196,169,107,0.4)",
            marginBottom: 20,
          }}>
            The Founder
          </p>
          <p style={{
            fontFamily: SERIF,
            fontSize: "clamp(28px, 3vw, 38px)",
            fontWeight: 300,
            color: GOLD_BRIGHT,
            lineHeight: 1,
            marginBottom: 12,
          }}>
            Marcelo Borin
          </p>
          <p style={{
            fontFamily: SANS,
            fontSize: 12,
            fontWeight: 300,
            color: GOLD,
            letterSpacing: "0.04em",
            marginBottom: 20,
          }}>
            S&atilde;o Paulo &rarr; Washington &rarr; Boca Raton
          </p>
          <div style={{
            width: "100%",
            height: 1,
            background: "rgba(255,255,255,0.06)",
            marginBottom: 20,
          }} />
          <div className="bp-story-body" style={{
            fontFamily: SANS,
            fontSize: 13,
            fontWeight: 200,
            lineHeight: 2.2,
            color: "rgba(255,255,255,0.6)",
            letterSpacing: "0.03em",
          }}>
            Former U.S. Presidential flight operations.
            <br />
            $2.2 billion in closed transactions.
            <br />
            44 countries.
          </div>
          <p className="bp-story-kicker" style={{
            fontFamily: SANS,
            fontSize: 11,
            fontWeight: 200,
            letterSpacing: "0.08em",
            color: "rgba(255,255,255,0.4)",
            marginTop: 24,
            fontStyle: "italic",
            opacity: 0,
          }}>
            He built Spark for clients who don&rsquo;t settle.
          </p>
        </div>

        {/* ── ACT 4: FLEET ── */}
        <div className="bp-act-4" style={{
          position: "absolute",
          inset: 40,
          opacity: 0,
          overflow: "auto",
        }}>
          <p style={{
            fontFamily: HUD_FONT,
            fontSize: 8,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(196,169,107,0.4)",
            marginBottom: 6,
          }}>
            Currently Available
          </p>
          <p style={{
            fontFamily: SANS,
            fontSize: 10,
            fontWeight: 200,
            letterSpacing: "0.1em",
            color: DIM,
            marginBottom: 20,
          }}>
            Select inventory &middot; Updated weekly
          </p>
          <div style={{
            width: "100%",
            height: 1,
            background: "rgba(255,255,255,0.06)",
            marginBottom: 20,
          }} />

          {PLANE_INFO.map((plane, idx) => (
            <div key={plane.name} className="bp-fleet-card" style={{
              marginBottom: idx < PLANE_INFO.length - 1 ? 24 : 0,
              paddingBottom: idx < PLANE_INFO.length - 1 ? 24 : 0,
              borderBottom: idx < PLANE_INFO.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
              opacity: 0,
            }}>
              <div style={{
                fontFamily: SERIF,
                fontSize: "clamp(20px, 2.5vw, 28px)",
                fontWeight: 300,
                color: GOLD_BRIGHT,
                marginBottom: 4,
              }}>
                {plane.name}
              </div>
              <div style={{
                fontFamily: SANS,
                fontSize: 9,
                fontWeight: 300,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.45)",
                marginBottom: 16,
              }}>
                {plane.blueprint.category}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {plane.stats.map((s) => (
                  <div key={s.key} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    paddingBottom: 6,
                  }}>
                    <span style={{
                      fontFamily: SANS,
                      fontSize: 10,
                      fontWeight: 200,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.4)",
                    }}>
                      {s.key}
                    </span>
                    <span style={{
                      fontFamily: HUD_FONT,
                      fontSize: 13,
                      color: "#fff",
                      letterSpacing: "0.04em",
                    }}>
                      {s.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── ACT 5: CONTACT ── */}
        <div className="bp-act-5" style={{
          position: "absolute",
          inset: 40,
          opacity: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          pointerEvents: "auto",
        }}>
          <h2 className="bp-contact-title" style={{
            fontFamily: SERIF,
            fontSize: "clamp(32px, 4vw, 48px)",
            fontWeight: 300,
            color: "#fff",
            letterSpacing: "0.06em",
            marginBottom: 20,
          }}>
            One call.
          </h2>
          <p style={{
            fontFamily: SANS,
            fontSize: 13,
            fontWeight: 200,
            color: "rgba(255,255,255,0.55)",
            letterSpacing: "0.08em",
            marginBottom: 36,
          }}>
            Marcelo Borin &nbsp;&middot;&nbsp; +1 954 994 4466
          </p>
          <div style={{ display: "flex", gap: 16 }}>
            <a href="tel:+19549944466" className="bp-btn" style={{
              padding: "12px 28px",
              border: `1px solid ${GOLD}`,
              color: GOLD,
              fontFamily: SANS,
              fontSize: 10,
              fontWeight: 300,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              textDecoration: "none",
              opacity: 0,
            }}>
              Call
            </a>
            <a href="mailto:marcelo@sparkaviation.com" className="bp-btn" style={{
              padding: "12px 28px",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.45)",
              fontFamily: SANS,
              fontSize: 10,
              fontWeight: 300,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              textDecoration: "none",
              opacity: 0,
            }}>
              Email
            </a>
          </div>
        </div>

      </GlassSurface>
    </div>
  );
}
