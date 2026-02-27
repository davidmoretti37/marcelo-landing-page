"use client";

import { useRef, useLayoutEffect, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";
import {
  WORLD_CLOCKS,
  COMPANY_STATS,
  BRAND_MISSION,
  STORY_TEXT,
  SERVICES,
  FOUNDER_QUOTE,
} from "@/lib/constants";

/*
  8-Act HTML text overlay system.
  Position: fixed, z-index: 10, synced to scroll-driver positions.
  Each act has enter + exit animations driven by ScrollTrigger scrub.
*/

function LiveClocks() {
  const [times, setTimes] = useState<string[]>([]);

  useEffect(() => {
    function update() {
      setTimes(
        WORLD_CLOCKS.map((c) =>
          new Intl.DateTimeFormat("en-US", {
            timeZone: c.timezone,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }).format(new Date())
        )
      );
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {WORLD_CLOCKS.map((clock, i) => (
        <div
          key={clock.city}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            padding: "8px 0",
            borderLeft: clock.highlight
              ? "2px solid rgba(184,151,106,0.6)"
              : "2px solid rgba(255,255,255,0.08)",
            paddingLeft: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 400, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: clock.highlight ? "#B8976A" : "rgba(255,255,255,0.4)" }}>
              {clock.city}
            </div>
            <div style={{ fontSize: 8, fontWeight: 500, letterSpacing: "0.2em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase" as const, marginTop: 2 }}>
              {clock.label}
            </div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 200, letterSpacing: "0.05em", color: clock.highlight ? "#B8976A" : "rgba(255,255,255,0.35)", fontVariantNumeric: "tabular-nums", fontFamily: "monospace" }}>
            {times[i] || "--:--:--"}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StoryOverlay() {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        const d = ".scroll-driver";

        /* ─────────────────────────────────────────────────
           ACT 1: SPARK JETS Brand Reveal (0–15%)
        ───────────────────────────────────────────────── */
        const brandSub = new SplitType(".ov-brand-sub", { types: "chars" });
        const brandTitle = new SplitType(".ov-brand h1", { types: "chars" });

        if (brandSub.chars) {
          gsap.fromTo(brandSub.chars,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, stagger: 0.03, duration: 0.6, ease: "power4.out",
              scrollTrigger: { trigger: d, start: "1% top", end: "5% top", scrub: 1 } }
          );
          gsap.to(brandSub.chars, {
            opacity: 0, y: -15, stagger: 0.015,
            scrollTrigger: { trigger: d, start: "11% top", end: "15% top", scrub: 1 },
          });
        }

        if (brandTitle.chars) {
          gsap.fromTo(brandTitle.chars,
            { opacity: 0, y: 40, rotateX: -90 },
            { opacity: 1, y: 0, rotateX: 0, stagger: 0.02, duration: 0.8, ease: "power4.out",
              scrollTrigger: { trigger: d, start: "2% top", end: "6% top", scrub: 1 } }
          );
          gsap.to(brandTitle.chars, {
            opacity: 0, y: -30, stagger: 0.01,
            scrollTrigger: { trigger: d, start: "11% top", end: "15% top", scrub: 1 },
          });
        }

        /* ─────────────────────────────────────────────────
           ACT 2: The Mission (15–30%)
        ───────────────────────────────────────────────── */
        gsap.fromTo(".ov-mission", { opacity: 0 }, {
          opacity: 1,
          scrollTrigger: { trigger: d, start: "15% top", end: "18% top", scrub: 1 },
        });

        const missionTitle = new SplitType(".ov-mission h2", { types: "words" });
        const missionBody = new SplitType(".ov-mission .ov-body", { types: "words" });

        if (missionTitle.words) {
          gsap.fromTo(missionTitle.words,
            { opacity: 0, filter: "blur(8px)", y: 20 },
            { opacity: 1, filter: "blur(0px)", y: 0, stagger: 0.06, duration: 0.8, ease: "power2.out",
              scrollTrigger: { trigger: d, start: "16% top", end: "20% top", scrub: 1 } }
          );
        }

        if (missionBody.words) {
          gsap.fromTo(missionBody.words,
            { opacity: 0, filter: "blur(6px)", y: 10 },
            { opacity: 1, filter: "blur(0px)", y: 0, stagger: 0.015, duration: 0.6, ease: "power2.out",
              scrollTrigger: { trigger: d, start: "18% top", end: "23% top", scrub: 1 } }
          );
        }

        gsap.to(".ov-mission", {
          opacity: 0, y: -40,
          scrollTrigger: { trigger: d, start: "27% top", end: "30% top", scrub: 1 },
        });

        /* ─────────────────────────────────────────────────
           ACT 3: The Story Behind Spark (30–48%)
        ───────────────────────────────────────────────── */
        gsap.fromTo(".ov-story", { opacity: 0 }, {
          opacity: 1,
          scrollTrigger: { trigger: d, start: "30% top", end: "34% top", scrub: 1 },
        });

        const storyLabel = new SplitType(".ov-story .ov-label", { types: "chars" });
        const storyTitle = new SplitType(".ov-story h2", { types: "words" });
        const storyBody = new SplitType(".ov-story .ov-body", { types: "words" });

        if (storyLabel.chars) {
          gsap.fromTo(storyLabel.chars,
            { opacity: 0, x: 10 },
            { opacity: 1, x: 0, stagger: 0.02,
              scrollTrigger: { trigger: d, start: "31% top", end: "35% top", scrub: 1 } }
          );
        }

        if (storyTitle.words) {
          gsap.fromTo(storyTitle.words,
            { opacity: 0, filter: "blur(8px)", x: 30 },
            { opacity: 1, filter: "blur(0px)", x: 0, stagger: 0.06, duration: 0.8, ease: "power2.out",
              scrollTrigger: { trigger: d, start: "31% top", end: "36% top", scrub: 1 } }
          );
        }

        if (storyBody.words) {
          gsap.fromTo(storyBody.words,
            { opacity: 0, filter: "blur(6px)", y: 10 },
            { opacity: 1, filter: "blur(0px)", y: 0, stagger: 0.015, duration: 0.6, ease: "power2.out",
              scrollTrigger: { trigger: d, start: "33% top", end: "40% top", scrub: 1 } }
          );
        }

        gsap.to(".ov-story", {
          opacity: 0, x: 80,
          scrollTrigger: { trigger: d, start: "44% top", end: "48% top", scrub: 1 },
        });

        /* ─────────────────────────────────────────────────
           ACT 4: Globe — Global Reach (48–62%)
        ───────────────────────────────────────────────── */
        gsap.fromTo(".ov-globe", { opacity: 0 }, {
          opacity: 1,
          scrollTrigger: { trigger: d, start: "48% top", end: "51% top", scrub: 1 },
        });

        const globeLabel = new SplitType(".ov-globe .ov-label", { types: "chars" });
        const globeTitle = new SplitType(".ov-globe h2", { types: "words" });

        if (globeLabel.chars) {
          gsap.fromTo(globeLabel.chars,
            { opacity: 0, x: -10 },
            { opacity: 1, x: 0, stagger: 0.02,
              scrollTrigger: { trigger: d, start: "49% top", end: "53% top", scrub: 1 } }
          );
        }

        if (globeTitle.words) {
          gsap.fromTo(globeTitle.words,
            { opacity: 0, filter: "blur(8px)", x: -30 },
            { opacity: 1, filter: "blur(0px)", x: 0, stagger: 0.06,
              scrollTrigger: { trigger: d, start: "49% top", end: "53% top", scrub: 1 } }
          );
        }

        // Counter animation for stats
        COMPANY_STATS.forEach((stat, i) => {
          const el = document.querySelector(`.ov-stat-val-${i}`);
          if (el) {
            const obj = { val: 0 };
            gsap.to(obj, {
              val: stat.value,
              duration: 0.10,
              ease: "power1.inOut",
              scrollTrigger: { trigger: d, start: "50% top", end: "56% top", scrub: 1 },
              onUpdate: () => {
                el.textContent = `${stat.prefix || ""}${Math.round(obj.val)}${stat.suffix || ""}`;
              },
            });
          }
        });

        gsap.fromTo(".ov-stat-label", { opacity: 0 }, {
          opacity: 1, stagger: 0.04,
          scrollTrigger: { trigger: d, start: "51% top", end: "55% top", scrub: 1 },
        });

        gsap.fromTo(".ov-clocks", { opacity: 0, x: 40 }, {
          opacity: 1, x: 0,
          scrollTrigger: { trigger: d, start: "50% top", end: "54% top", scrub: 1 },
        });

        // Globe text exit
        gsap.to(".ov-globe", {
          opacity: 0, x: -80,
          scrollTrigger: { trigger: d, start: "58% top", end: "62% top", scrub: 1 },
        });
        gsap.to(".ov-clocks", {
          opacity: 0, x: 40,
          scrollTrigger: { trigger: d, start: "58% top", end: "62% top", scrub: 1 },
        });

        /* ─────────────────────────────────────────────────
           ACT 5: What We Do — Services (62–74%)
        ───────────────────────────────────────────────── */
        gsap.fromTo(".ov-services", { opacity: 0 }, {
          opacity: 1,
          scrollTrigger: { trigger: d, start: "62% top", end: "65% top", scrub: 1 },
        });

        const servTitle = new SplitType(".ov-services h2", { types: "chars" });
        if (servTitle.chars) {
          gsap.fromTo(servTitle.chars,
            { opacity: 0, y: 30, rotateX: -60 },
            { opacity: 1, y: 0, rotateX: 0, stagger: 0.015, ease: "power3.out",
              scrollTrigger: { trigger: d, start: "62% top", end: "66% top", scrub: 1 } }
          );
        }

        // Service items stagger in
        gsap.fromTo(".ov-service-item", {
          opacity: 0, y: 20, filter: "blur(4px)",
        }, {
          opacity: 1, y: 0, filter: "blur(0px)", stagger: 0.04,
          scrollTrigger: { trigger: d, start: "64% top", end: "70% top", scrub: 1 },
        });

        gsap.to(".ov-services", {
          opacity: 0, y: -40,
          scrollTrigger: { trigger: d, start: "71% top", end: "74% top", scrub: 1 },
        });

        /* ─────────────────────────────────────────────────
           ACT 6: Marcelo's Quote (74–84%)
        ───────────────────────────────────────────────── */
        gsap.fromTo(".ov-quote-wrap", { opacity: 0 }, {
          opacity: 1,
          scrollTrigger: { trigger: d, start: "74% top", end: "77% top", scrub: 1 },
        });

        const quoteSplit = new SplitType(".ov-quote-text", { types: "chars" });
        const founderSplit = new SplitType(".ov-founder", { types: "chars" });

        if (quoteSplit.chars) {
          gsap.fromTo(quoteSplit.chars,
            { opacity: 0 },
            { opacity: 1, stagger: 0.006, ease: "none",
              scrollTrigger: { trigger: d, start: "75% top", end: "82% top", scrub: 1 } }
          );
        }

        if (founderSplit.chars) {
          gsap.fromTo(founderSplit.chars,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, stagger: 0.02,
              scrollTrigger: { trigger: d, start: "81% top", end: "83% top", scrub: 1 } }
          );
        }

        gsap.to(".ov-quote-wrap", {
          opacity: 0,
          scrollTrigger: { trigger: d, start: "82% top", end: "85% top", scrub: 1 },
        });

        /* ─────────────────────────────────────────────────
           ACT 7: ONLY JETS — Aircraft (84–93%)
        ───────────────────────────────────────────────── */
        gsap.fromTo(".ov-jets", { opacity: 0 }, {
          opacity: 1,
          scrollTrigger: { trigger: d, start: "84% top", end: "87% top", scrub: 1 },
        });

        const jetsTitle = new SplitType(".ov-jets h2", { types: "chars" });
        if (jetsTitle.chars) {
          gsap.fromTo(jetsTitle.chars,
            { opacity: 0, y: 50, rotateX: -90 },
            { opacity: 1, y: 0, rotateX: 0, stagger: 0.03, ease: "power4.out",
              scrollTrigger: { trigger: d, start: "84% top", end: "88% top", scrub: 1 } }
          );
        }

        // Spec items pop in
        gsap.fromTo(".ov-spec-item", {
          opacity: 0, y: 20, scale: 0.9,
        }, {
          opacity: 1, y: 0, scale: 1, stagger: 0.05, ease: "back.out(1.4)",
          scrollTrigger: { trigger: d, start: "87% top", end: "91% top", scrub: 1 },
        });

        gsap.to(".ov-jets", {
          opacity: 0,
          scrollTrigger: { trigger: d, start: "91% top", end: "93% top", scrub: 1 },
        });

        /* ─────────────────────────────────────────────────
           ACT 8: Contact (93–100%)
        ───────────────────────────────────────────────── */
        gsap.fromTo(".ov-contact", { opacity: 0 }, {
          opacity: 1,
          scrollTrigger: { trigger: d, start: "93% top", end: "96% top", scrub: 1 },
        });

        const contactTitle = new SplitType(".ov-contact h2", { types: "chars" });
        if (contactTitle.chars) {
          gsap.fromTo(contactTitle.chars,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, stagger: 0.02,
              scrollTrigger: { trigger: d, start: "94% top", end: "97% top", scrub: 1 } }
          );
        }

        gsap.fromTo(".ov-contact .ov-btn", {
          opacity: 0, scale: 0.85, y: 15,
        }, {
          opacity: 1, scale: 1, y: 0, stagger: 0.08, ease: "back.out(1.7)",
          scrollTrigger: { trigger: d, start: "96% top", end: "99% top", scrub: 1 },
        });

      }, ref);

      return () => ctx.revert();
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: "0.35em",
    textTransform: "uppercase",
    color: "#B8976A",
    marginBottom: 16,
    display: "flex",
    alignItems: "center",
    gap: 12,
  };

  const lineEl = <span style={{ width: 28, height: 1, background: "#B8976A", opacity: 0.6, display: "inline-block" }} />;

  return (
    <div ref={ref} style={{ position: "fixed", inset: 0, zIndex: 10, pointerEvents: "none" }}>

      {/* ── ACT 1: SPARK JETS Brand ── */}
      <div className="ov-brand" style={{ position: "absolute", top: "35vh", left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
        <p className="ov-brand-sub" style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>
          Spark Jets
        </p>
        <h1 style={{ fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 200, color: "#fff", lineHeight: 1.15, letterSpacing: "0.06em", textTransform: "uppercase", perspective: "600px" }}>
          Aircraft Sales
          <br />&amp; Acquisitions
        </h1>
      </div>

      {/* ── ACT 2: The Mission ── */}
      <div className="ov-mission" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", maxWidth: 700, opacity: 0 }}>
        <h2 style={{ fontSize: "clamp(32px, 4.5vw, 56px)", fontWeight: 200, color: "#fff", lineHeight: 1.1, marginBottom: 24, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Elevating Excellence
          <br />in Aviation
        </h2>
        <p className="ov-body" style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.8, color: "rgba(255,255,255,0.5)", maxWidth: 560, margin: "0 auto" }}>
          {BRAND_MISSION}
        </p>
      </div>

      {/* ── ACT 3: The Story ── */}
      <div className="ov-story" style={{ position: "absolute", right: "clamp(32px, 6vw, 100px)", top: "50%", transform: "translateY(-50%)", maxWidth: 460, opacity: 0 }}>
        <p className="ov-label" style={labelStyle}>{lineEl} The Story Behind Spark</p>
        <h2 style={{ fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 200, color: "#fff", lineHeight: 1.15, marginBottom: 16, letterSpacing: "0.02em" }}>
          From Brazil to
          <br />the Boardroom
        </h2>
        <p className="ov-body" style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.8, color: "rgba(255,255,255,0.45)", maxWidth: 420 }}>
          {STORY_TEXT}
        </p>
      </div>

      {/* ── ACT 4: Globe stats ── */}
      <div className="ov-globe" style={{ position: "absolute", left: "clamp(32px, 6vw, 100px)", top: "50%", transform: "translateY(-50%)", maxWidth: 380, opacity: 0 }}>
        <p className="ov-label" style={labelStyle}>{lineEl} Global Reach</p>
        <h2 style={{ fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 200, color: "#fff", lineHeight: 1.15, marginBottom: 16 }}>
          Connecting
          <br />Continents
        </h2>
        <div style={{ display: "flex", gap: 24, marginTop: 24 }}>
          {COMPANY_STATS.map((s, i) => (
            <div key={s.label}>
              <div className={`ov-stat-val-${i}`} style={{ fontSize: 28, fontWeight: 200, color: "#B8976A", lineHeight: 1 }}>
                {s.prefix || ""}0{s.suffix || ""}
              </div>
              <div className="ov-stat-label" style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginTop: 4, opacity: 0 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live clocks — right side during globe */}
      <div className="ov-clocks" style={{ position: "absolute", right: "clamp(32px, 6vw, 100px)", bottom: "15vh", opacity: 0 }}>
        <LiveClocks />
      </div>

      {/* ── ACT 5: Services ── */}
      <div className="ov-services" style={{ position: "absolute", left: "clamp(32px, 6vw, 100px)", top: "50%", transform: "translateY(-50%)", maxWidth: 500, opacity: 0 }}>
        <h2 style={{ fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 200, color: "#fff", lineHeight: 1.1, marginBottom: 28, letterSpacing: "0.04em", textTransform: "uppercase", perspective: "600px" }}>
          What We Do
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {SERVICES.map((svc) => (
            <div key={svc.title} className="ov-service-item" style={{ borderLeft: "2px solid rgba(184,151,106,0.4)", paddingLeft: 16, opacity: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "#B8976A", marginBottom: 6 }}>
                {svc.title}
              </div>
              <p style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.7, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                {svc.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── ACT 6: Marcelo's Quote ── */}
      <div className="ov-quote-wrap" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", maxWidth: 700, opacity: 0 }}>
        <p className="ov-quote-text" style={{ fontSize: "clamp(18px, 2.2vw, 28px)", fontWeight: 300, lineHeight: 1.7, color: "#fff", fontStyle: "italic", marginBottom: 20 }}>
          &ldquo;{FOUNDER_QUOTE}&rdquo;
        </p>
        <p className="ov-founder" style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: "#B8976A" }}>
          Marcelo Borin &mdash; Spark Founder
        </p>
      </div>

      {/* ── ACT 7: ONLY JETS ── */}
      <div className="ov-jets" style={{ position: "absolute", right: "clamp(32px, 6vw, 100px)", top: "50%", transform: "translateY(-50%)", maxWidth: 420, opacity: 0 }}>
        <h2 style={{ fontSize: "clamp(48px, 7vw, 96px)", fontWeight: 200, color: "#fff", lineHeight: 1.0, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 32, perspective: "600px" }}>
          Only
          <br />Jets
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 28px" }}>
          {[
            { v: "7,750", k: "Range (nm)" },
            { v: "Mach .935", k: "Top Speed" },
            { v: "19", k: "Passengers" },
            { v: "51,000 ft", k: "Max Altitude" },
          ].map((s) => (
            <div key={s.k} className="ov-spec-item" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 10, opacity: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 300, color: "#fff", lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 9, fontWeight: 400, letterSpacing: "0.18em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginTop: 4 }}>{s.k}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ACT 8: Contact ── */}
      <div className="ov-contact" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "auto", opacity: 0 }}>
        <h2 style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 32 }}>
          Contact
        </h2>
        <p style={{ fontSize: "clamp(20px, 2.5vw, 32px)", fontWeight: 200, color: "#fff", lineHeight: 1.4, marginBottom: 8 }}>
          Marcelo Borin
        </p>
        <p style={{ fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", marginBottom: 32 }}>
          marcelo@sparkaviation.com &nbsp;|&nbsp; +1 954 994 4466
        </p>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", marginBottom: 40 }}>
          <a href="tel:+19549944466" className="ov-btn" style={{ padding: "14px 32px", border: "1px solid rgba(184,151,106,0.5)", color: "#B8976A", fontSize: 12, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none", opacity: 0 }}>
            Call Now
          </a>
          <a href="mailto:marcelo@sparkaviation.com" className="ov-btn" style={{ padding: "14px 32px", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none", opacity: 0 }}>
            Email
          </a>
        </div>
        <p style={{ fontSize: 9, fontWeight: 400, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>
          Boca Raton &nbsp;&bull;&nbsp; São Paulo &nbsp;&bull;&nbsp; Dallas
        </p>
      </div>
    </div>
  );
}
