"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "@/lib/useMediaQuery";

gsap.registerPlugin(ScrollTrigger);

const SHIFT = 20; // px for vertical animation

const LINES = [
  { enter: 0.00, hold: 0.04, exit: 0.14, gone: 0.18 },
  { enter: 0.18, hold: 0.22, exit: 0.32, gone: 0.36 },
  { enter: 0.36, hold: 0.40, exit: 0.50, gone: 0.54 },
  { enter: 0.54, hold: 0.58, exit: 0.68, gone: 0.72 },
  { enter: 0.72, hold: 0.76, exit: 0.90, gone: 0.94 },
];

const ATTR_ENTER = 0.86;
const ATTR_HOLD = 0.90;

export default function DescentSection() {
  const flyoverRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);

  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const attributionRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  // Flyover scroll animation — plane rises from below, exits top
  // Lip is pure CSS sticky — no JS position manipulation
  useEffect(() => {
    if (reducedMotion) return;
    if (!flyoverRef.current || !planeRef.current) return;

    const planeEl = planeRef.current;
    planeEl.style.visibility = "hidden";

    const flyoverTrigger = ScrollTrigger.create({
      trigger: flyoverRef.current,
      start: "top 80%",
      end: "bottom+=80% top", // extra 80% of spacer for plane exit
      scrub: true,
      onLeaveBack: () => {
        // Reset plane below viewport when scrolling back to hero
        planeEl.style.visibility = "hidden";
        planeEl.style.transform = "translate(-50%, 120vh)";
      },
      onUpdate: (self) => {
        const p = self.progress;
        const vh = window.innerHeight;
        const vw = window.innerWidth;

        // Lip sits right after the flyover spacer in the DOM.
        const spacerH = flyoverRef.current!.offsetHeight;
        const totalRange = spacerH * 1.8; // spacer + 80% extra

        // Lip's natural viewport Y
        const lipPx = spacerH - p * totalRange;
        const lipVh = (lipPx / vh) * 100;

        // Plane is 1:1 aspect. Mobile: 150vw, desktop: 125vw.
        const planeScale = vw < 768 ? 1.5 : 1.25;
        const planeHPx = vw * planeScale;
        const planeHVh = (planeHPx / vh) * 100;
        const wingVh = planeHVh * 0.56;

        // Lip pins at top when lipVh <= 0
        const lipPinP = spacerH / totalRange; // ≈ 0.556

        let planeY: number;

        // Entry offset — pushes plane below viewport at start, decays to 0
        // so the nose enters from below the screen
        const enterOffset = Math.max(0, 70 * (1 - p * 8)); // 70vh at p=0, gone by p=0.125

        if (p <= lipPinP) {
          // Track the lip: wing-line aligns with lip
          planeY = lipVh - wingVh + enterOffset;
        } else {
          // Lip pinned at top — accelerate plane off screen
          const t = (p - lipPinP) / (1 - lipPinP);
          const startY = -wingVh;
          const endY = -planeHVh - 10; // fully off screen
          planeY = startY + t * (endY - startY);
        }

        // Visible only if part of the plane is on screen
        const visible = (planeY + planeHVh > 0) && (planeY < 110);
        planeEl.style.visibility = visible ? "visible" : "hidden";
        planeEl.style.transform = `translate(-50%, ${planeY}vh)`;

      },
    });

    return () => {
      flyoverTrigger.kill();
    };
  }, [reducedMotion]);

  // Phrases scroll animation (unchanged)
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
            opacity = 0;
            y = SHIFT;
          } else if (p < cfg.hold) {
            const t = (p - cfg.enter) / (cfg.hold - cfg.enter);
            opacity = t;
            y = SHIFT * (1 - t);
          } else if (p < cfg.exit) {
            opacity = 1;
            y = 0;
          } else if (p < cfg.gone) {
            const t = (p - cfg.exit) / (cfg.gone - cfg.exit);
            opacity = 1 - t;
            y = -SHIFT * t;
          } else {
            opacity = 0;
            y = -SHIFT;
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
          } else {
            attr.style.opacity = "1";
            attr.style.transform = "translateY(0)";
          }
        }
      },
    });

    return () => {
      trigger.kill();
    };
  }, [reducedMotion]);

  const lineClasses =
    "col-start-1 row-start-1 font-editorial font-light text-[clamp(36px,8vw,96px)] leading-[1.1] tracking-[-0.02em] text-center text-[#0F0F0D] px-8";

  // --- Shared sub-components ---

  const lip = (
    <div className="w-full relative" style={{ height: 500, marginTop: -200 }}>
      {/* Wing-sweep V shape — steep to match wing angle */}
      <svg
        viewBox="0 0 1440 300"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        style={{ display: "block" }}
      >
        {/* Cream fill — steep V tracing the wing sweep */}
        <path
          d="M0,295 C250,240 550,30 720,4 C890,30 1190,240 1440,295 L1440,300 L0,300 Z"
          fill="#F8F7F4"
        />
      </svg>
    </div>
  );

  const storyLines = (
    <>
      <div data-line className={`${lineClasses} opacity-0`}>
        Born to fly.
      </div>
      <div data-line className={`${lineClasses} opacity-0`}>
        <span>Trusted at the </span>
        <span className="text-[#C8A96E]">highest level.</span>
      </div>
      <div data-line className={`${lineClasses} opacity-0`}>
        Three decades. Every continent.
      </div>
      <div data-line className={`${lineClasses} opacity-0`}>
        He doesn&apos;t broker deals.
      </div>
      <div data-line className={`${lineClasses} opacity-0`}>
        <span>He builds </span>
        <span className="text-[#C8A96E]">legacies.</span>
      </div>
      <div
        ref={attributionRef}
        className="absolute left-0 right-0 text-center font-sans text-[12px] tracking-[0.2em] uppercase text-[#A8A49E] opacity-0"
        style={{ top: "calc(50% + 120px)" }}
      >
        Marcelo Borin &mdash; Founder, Spark Aviation
      </div>
    </>
  );

  // --- Reduced motion fallback ---
  if (reducedMotion) {
    return (
      <section id="about" className="relative z-20 -mt-6">
        {lip}
        <div className="bg-[#F8F7F4] py-24 flex flex-col items-center gap-6 px-8">
          <p className={lineClasses.replace("col-start-1 row-start-1 ", "")}>Born to fly.</p>
          <p className={lineClasses.replace("col-start-1 row-start-1 ", "")}>
            Trusted at the <span className="text-[#C8A96E]">highest level.</span>
          </p>
          <p className={lineClasses.replace("col-start-1 row-start-1 ", "")}>
            Three decades. Every continent.
          </p>
          <p className={lineClasses.replace("col-start-1 row-start-1 ", "")}>
            He doesn&apos;t broker deals.
          </p>
          <p className={lineClasses.replace("col-start-1 row-start-1 ", "")}>
            He builds <span className="text-[#C8A96E]">legacies.</span>
          </p>
          <p className="font-sans text-[12px] tracking-[0.2em] uppercase text-[#A8A49E] mt-16">
            Marcelo Borin &mdash; Founder, Spark Aviation
          </p>
        </div>
      </section>
    );
  }

  // --- Full animated version ---
  return (
    <section id="about" className="relative z-20 -mt-6">

      {/* ===== ZONE 1: Flyover scroll spacer ===== */}
      <div ref={flyoverRef} className="h-[120vh] md:h-[150vh] relative" />

      {/* THE PLANE — fixed to viewport, flies over EVERYTHING */}
      <div
        ref={planeRef}
        className="fixed top-0 left-1/2 w-[150vw] md:w-[125vw] pointer-events-none select-none will-change-transform z-[60] overflow-hidden"
        style={{
          aspectRatio: "1 / 1",
          transform: "translate(-50%, 110vh)", // initial: below viewport
        }}
        aria-hidden="true"
      >
        {/* Cream V-fill behind transparent areas below the wing — matches wing sweep */}
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

      {/* ===== ZONE 2: Lip (pure CSS sticky) ===== */}
      <div className="sticky top-0 w-full" style={{ zIndex: 25 }}>
        {lip}
      </div>

      {/* ===== ZONE 3: Phrases ===== */}
      <div ref={triggerRef} className="h-[250vh] relative">
        <div
          ref={panelRef}
          className="sticky top-0 h-screen bg-[#F8F7F4] overflow-hidden grid place-items-center"
          style={{ paddingTop: 80, zIndex: 26 }} // above lip (z-25), slight offset
        >
          {storyLines}
        </div>
      </div>
    </section>
  );
}
