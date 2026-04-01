"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "@/lib/useMediaQuery";

gsap.registerPlugin(ScrollTrigger);

const SHIFT = 20;

const LINES = [
  { enter: 0.00, hold: 0.04, exit: 0.12, gone: 0.16 },
  { enter: 0.16, hold: 0.20, exit: 0.28, gone: 0.32 },
  { enter: 0.32, hold: 0.36, exit: 0.44, gone: 0.48 },
  { enter: 0.48, hold: 0.52, exit: 0.60, gone: 0.64 },
  { enter: 0.64, hold: 0.68, exit: 0.78, gone: 0.82 },
];

const ATTR_ENTER = 0.68;
const ATTR_HOLD = 0.72;
const ATTR_EXIT = 0.78;
const ATTR_GONE = 0.82;

export default function DescentSection() {
  const planeRef = useRef<HTMLDivElement>(null);
  const planeTriggerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const attributionRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  // Phrases scroll animation — text floats in the sky
  useEffect(() => {
    if (reducedMotion) return;
    if (!triggerRef.current || !panelRef.current) return;

    const lines = panelRef.current.querySelectorAll<HTMLElement>("[data-line]");
    const attr = attributionRef.current;

    const trigger = ScrollTrigger.create({
      trigger: triggerRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.5,
      onUpdate: (self) => {
        const p = self.progress;

        lines.forEach((el, i) => {
          const cfg = LINES[i];
          let opacity = 0;
          let y = SHIFT;

          if (p < cfg.enter) {
            opacity = 0; y = SHIFT;
          } else if (p < cfg.hold) {
            const t = (p - cfg.enter) / (cfg.hold - cfg.enter);
            opacity = t; y = SHIFT * (1 - t);
          } else if (p < cfg.exit) {
            opacity = 1; y = 0;
          } else if (p < cfg.gone) {
            const t = (p - cfg.exit) / (cfg.gone - cfg.exit);
            opacity = 1 - t; y = -SHIFT * t;
          } else {
            opacity = 0; y = -SHIFT;
          }

          el.style.opacity = String(opacity);
          el.style.transform = `translateY(${y}px)`;
        });

        if (attr) {
          if (p < ATTR_ENTER) {
            attr.style.opacity = "0";
            attr.style.transform = `translateY(${SHIFT}px)`;
          } else if (p < ATTR_HOLD) {
            const t = (p - ATTR_ENTER) / (ATTR_HOLD - ATTR_ENTER);
            attr.style.opacity = String(t);
            attr.style.transform = `translateY(${SHIFT * (1 - t)}px)`;
          } else if (p < ATTR_EXIT) {
            attr.style.opacity = "1";
            attr.style.transform = "translateY(0)";
          } else if (p < ATTR_GONE) {
            const t = (p - ATTR_EXIT) / (ATTR_GONE - ATTR_EXIT);
            attr.style.opacity = String(1 - t);
            attr.style.transform = `translateY(${-SHIFT * t}px)`;
          } else {
            attr.style.opacity = "0";
            attr.style.transform = `translateY(${-SHIFT}px)`;
          }
        }
      },
    });

    return () => trigger.kill();
  }, [reducedMotion]);

  // Plane flies up AFTER phrases
  useEffect(() => {
    if (reducedMotion) return;
    if (!planeTriggerRef.current || !planeRef.current) return;

    const planeEl = planeRef.current;
    planeEl.style.visibility = "hidden";

    const trigger = ScrollTrigger.create({
      trigger: planeTriggerRef.current,
      start: "top 80%",
      end: "bottom+=80% top",
      scrub: true,
      onLeaveBack: () => {
        planeEl.style.visibility = "hidden";
        planeEl.style.transform = "translate(-50%, 120vh)";
      },
      onUpdate: (self) => {
        const p = self.progress;
        const vh = window.innerHeight;
        const vw = window.innerWidth;

        const planeScale = vw < 768 ? 1.5 : 1.25;
        const planeHPx = vw * planeScale;
        const planeHVh = (planeHPx / vh) * 100;

        // Simple: plane rises from below viewport to above
        const startY = 80; // start below screen
        const endY = -planeHVh - 10; // fully off top
        const planeY = startY + p * (endY - startY);

        const visible = (planeY + planeHVh > 0) && (planeY < 110);
        planeEl.style.visibility = visible ? "visible" : "hidden";
        planeEl.style.transform = `translate(-50%, ${planeY}vh)`;
      },
    });

    return () => trigger.kill();
  }, [reducedMotion]);

  const lineClasses =
    "col-start-1 row-start-1 font-editorial font-light text-[clamp(36px,8vw,96px)] leading-[1.1] tracking-[-0.02em] text-center px-8";

  if (reducedMotion) {
    return (
      <section id="about" className="relative z-20 -mt-6">
        <div className="py-24 flex flex-col items-center gap-6 px-8">
          <p className={lineClasses} style={{ color: "#fff", textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>Born to fly.</p>
          <p className={lineClasses} style={{ color: "#fff", textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>
            Trusted at the <span className="text-[#C8A96E]">highest level.</span>
          </p>
          <p className={lineClasses} style={{ color: "#fff", textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>Three decades. Every continent.</p>
          <p className={lineClasses} style={{ color: "#fff", textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>He doesn&apos;t broker deals.</p>
          <p className={lineClasses} style={{ color: "#fff", textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>
            He builds <span className="text-[#C8A96E]">legacies.</span>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="about" className="relative z-20 -mt-6">

      {/* ===== ZONE 1: Phrases floating in sky (transparent bg) ===== */}
      <div ref={triggerRef} className="h-[300vh] relative">
        <div
          ref={panelRef}
          className="sticky top-0 h-screen overflow-hidden grid place-items-center"
          style={{ paddingTop: 80 }}
        >
          <div data-line className={`${lineClasses} opacity-0`} style={{ color: "rgba(255,255,255,0.95)", textShadow: "0 2px 24px rgba(0,0,0,0.25), 0 0 80px rgba(0,0,0,0.1)" }}>
            Born to fly.
          </div>
          <div data-line className={`${lineClasses} opacity-0`} style={{ color: "rgba(255,255,255,0.95)", textShadow: "0 2px 24px rgba(0,0,0,0.25), 0 0 80px rgba(0,0,0,0.1)" }}>
            <span>Trusted at the </span>
            <span className="text-[#C8A96E]" style={{ textShadow: "0 2px 24px rgba(200,169,110,0.4)" }}>highest level.</span>
          </div>
          <div data-line className={`${lineClasses} opacity-0`} style={{ color: "rgba(255,255,255,0.95)", textShadow: "0 2px 24px rgba(0,0,0,0.25), 0 0 80px rgba(0,0,0,0.1)" }}>
            Three decades. Every continent.
          </div>
          <div data-line className={`${lineClasses} opacity-0`} style={{ color: "rgba(255,255,255,0.95)", textShadow: "0 2px 24px rgba(0,0,0,0.25), 0 0 80px rgba(0,0,0,0.1)" }}>
            He doesn&apos;t broker deals.
          </div>
          <div data-line className={`${lineClasses} opacity-0`} style={{ color: "rgba(255,255,255,0.95)", textShadow: "0 2px 24px rgba(0,0,0,0.25), 0 0 80px rgba(0,0,0,0.1)" }}>
            <span>He builds </span>
            <span className="text-[#C8A96E]" style={{ textShadow: "0 2px 24px rgba(200,169,110,0.4)" }}>legacies.</span>
          </div>
          <div
            ref={attributionRef}
            className="absolute left-0 right-0 text-center font-sans text-[12px] tracking-[0.2em] uppercase opacity-0"
            style={{ top: "calc(50% + 120px)", color: "rgba(255,255,255,0.5)" }}
          >
            Marcelo Borin &mdash; Founder, Spark Aviation
          </div>
        </div>
      </div>

      {/* ===== ZONE 2: Plane flyover spacer ===== */}
      <div ref={planeTriggerRef} className="h-[120vh] md:h-[150vh] relative" />

      {/* THE PLANE — flies up AFTER phrases */}
      <div
        ref={planeRef}
        className="fixed top-0 left-1/2 w-[150vw] md:w-[125vw] pointer-events-none select-none will-change-transform z-[60] overflow-hidden"
        style={{
          aspectRatio: "1 / 1",
          transform: "translate(-50%, 110vh)",
        }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          <path
            d="M0,68 C15,63 35,50 50,46 C65,50 85,63 100,68 L100,100 L0,100 Z"
            fill="#F8F7F4"
          />
        </svg>
        <Image
          src="/plane-hero.png"
          alt=""
          fill
          className="object-contain relative"
          sizes="200vw"
          unoptimized
          priority
          style={{ zIndex: 1 }}
        />
      </div>

      {/* ===== ZONE 3: Cream buffer — real scroll distance so globe triggers start fresh ===== */}
      <div className="relative w-full bg-[#F8F7F4]" style={{ zIndex: 30, height: "120vh" }} />
    </section>
  );
}
