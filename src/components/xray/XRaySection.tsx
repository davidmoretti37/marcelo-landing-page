"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function XRaySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const exteriorRef = useRef<HTMLImageElement>(null);
  const interiorRef = useRef<HTMLImageElement>(null);
  const lineTopRef = useRef<HTMLDivElement>(null);
  const lineBotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const viewport = viewportRef.current;
    const wrap = wrapRef.current;
    const exterior = exteriorRef.current;
    const interior = interiorRef.current;
    const lineTop = lineTopRef.current;
    const lineBot = lineBotRef.current;
    if (!viewport || !wrap || !exterior || !interior || !lineTop || !lineBot)
      return;

    const stripPct = 12;
    const parallax = 0.35;
    let Hv: number, Hi: number, stripPx: number, scannerTopPx: number;

    function measure() {
      Hv = viewport!.offsetHeight;
      Hi = wrap!.offsetHeight;
      stripPx = (stripPct / 100) * Hi;
      scannerTopPx = Hv / 2 - stripPx / 2;
      lineTop!.style.top = scannerTopPx + "px";
      lineBot!.style.top = scannerTopPx + stripPx + "px";
    }

    // Wait for images to load
    let loaded = 0;
    function onImgReady() {
      loaded++;
      if (loaded < 2) return;
      init();
    }

    [exterior, interior].forEach((img) => {
      if (img.complete) {
        onImgReady();
      } else {
        img.addEventListener("load", onImgReady);
        img.addEventListener("error", onImgReady);
      }
    });

    function init() {
      measure();
      window.addEventListener("resize", () => {
        measure();
        ScrollTrigger.refresh();
      });

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "+=200%",
        pin: true,
        scrub: 1,
        onUpdate: (self) => {
          const p = self.progress;
          const tyInterior = scannerTopPx - p * (Hi - stripPx);
          const tyExterior = tyInterior * (1 - parallax);

          wrap!.style.transform = "translateX(-50%)";
          exterior!.style.transform = `translateY(${tyExterior}px)`;
          interior!.style.transform = `translateY(${tyInterior}px)`;

          const topPct = ((scannerTopPx - tyInterior) / Hi) * 100;
          const botPct = 100 - topPct - stripPct;
          interior!.style.clipPath = `inset(${topPct}% 0 ${botPct}% 0)`;

          // Fade
          const fade = 0.08;
          let alpha = 1;
          if (p < fade) alpha = p / fade;
          else if (p > 1 - fade) alpha = (1 - p) / fade;
          if (p <= 0.001 || p >= 0.999) alpha = 0;

          lineTop!.style.opacity = String(alpha);
          lineBot!.style.opacity = String(alpha);
          interior!.style.opacity = String(alpha);
        },
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === sectionRef.current) t.kill();
      });
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="scanner"
      style={{
        background: "#F8F7F4",
        paddingTop: "clamp(60px, 8vw, 100px)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "clamp(24px, 3vw, 40px)", padding: "0 clamp(24px, 5vw, 64px)" }}>
        <p className="text-gold text-xs tracking-[0.4em] uppercase mb-4">
          Interior Layout
        </p>
        <h2 className="font-display text-4xl lg:text-5xl text-navy font-light">
          Cabin<br />Revealed
        </h2>
      </div>

      {/* Viewport — exactly matching original */}
      <div
        ref={viewportRef}
        style={{ position: "relative", flex: 1, overflow: "hidden" }}
      >
        <div
          ref={wrapRef}
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(900px, 100%)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={exteriorRef}
            src="/plane-top.png"
            alt="Top view exterior"
            style={{ width: "100%", display: "block" }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={interiorRef}
            src="/plane-interior.png"
            alt="Cabin interior cutaway"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center top",
              clipPath: "inset(0% 0 100% 0)",
            }}
          />
        </div>

        {/* Scan lines */}
        <div
          ref={lineTopRef}
          style={{
            position: "absolute",
            left: "5%",
            right: "5%",
            height: "1.5px",
            background: "linear-gradient(90deg, transparent, #B8976A, transparent)",
            opacity: 0,
            pointerEvents: "none",
            boxShadow: "0 0 12px rgba(184,151,106,0.4)",
            zIndex: 2,
          }}
        />
        <div
          ref={lineBotRef}
          style={{
            position: "absolute",
            left: "5%",
            right: "5%",
            height: "1.5px",
            background: "linear-gradient(90deg, transparent, #B8976A, transparent)",
            opacity: 0,
            pointerEvents: "none",
            boxShadow: "0 0 12px rgba(184,151,106,0.4)",
            zIndex: 2,
          }}
        />
      </div>
    </section>
  );
}
