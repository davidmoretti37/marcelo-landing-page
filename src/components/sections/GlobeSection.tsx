"use client";

import { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GLOBE_CITIES, WORLD_CLOCKS } from "@/lib/constants";

gsap.registerPlugin(ScrollTrigger);

const GlobeCanvas = dynamic(() => import("@/components/globe/GlobeCanvas"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#F8F7F4]" />,
});

export default function GlobeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollProgressRef = useRef(0);

  const labelRef = useRef<HTMLParagraphElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);
  const clockRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.5,
      onUpdate: (self) => {
        const p = self.progress;
        scrollProgressRef.current = p;

        // Fade out everything near the end (p 0.82→0.95)
        let fadeOut = 1;
        if (p > 0.82) {
          fadeOut = Math.max(0, 1 - (p - 0.82) / 0.13);
        }

        // Left side reveals
        const reveals = [
          { ref: labelRef, enter: 0.10, full: 0.17 },
          { ref: headlineRef, enter: 0.15, full: 0.24 },
          { ref: bodyRef, enter: 0.23, full: 0.32 },
          { ref: pillsRef, enter: 0.30, full: 0.39 },
        ];

        reveals.forEach(({ ref, enter, full }) => {
          if (!ref.current) return;
          let opacity = 0;
          let y = 30;
          if (p < enter) {
            opacity = 0;
            y = 30;
          } else if (p < full) {
            const t = (p - enter) / (full - enter);
            opacity = t;
            y = 30 * (1 - t);
          } else {
            opacity = 1;
            y = 0;
          }
          ref.current.style.opacity = String(opacity * fadeOut);
          ref.current.style.transform = `translateY(${y}px)`;
        });

        // Right side — each clock one by one
        clockRefs.current.forEach((el, i) => {
          if (!el) return;
          const enter = 0.40 + i * 0.08;
          const full = enter + 0.07;
          let opacity = 0;
          let y = 20;
          if (p < enter) {
            opacity = 0;
            y = 20;
          } else if (p < full) {
            const t = (p - enter) / (full - enter);
            opacity = t;
            y = 20 * (1 - t);
          } else {
            opacity = 1;
            y = 0;
          }
          el.style.opacity = String(opacity * fadeOut);
          el.style.transform = `translateY(${y}px)`;
        });

        // Globe stays — panel never fades
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="h-[300vh] relative">
      <div className="sticky top-0 h-screen bg-[#F8F7F4] overflow-hidden">
        {/* 3-column layout: text | globe | clocks */}
        <div className="relative z-10 h-full grid grid-cols-[1fr_auto_1fr] items-center">
          {/* Left — text */}
          <div className="flex items-center justify-center px-6 md:px-12">
            <div className="space-y-5 max-w-[260px]">
              <p
                ref={labelRef}
                className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#C8A96E] opacity-0"
              >
                GLOBAL REACH
              </p>
              <h2
                ref={headlineRef}
                className="font-editorial font-light text-[#0F0F0D] leading-[1.1] opacity-0"
                style={{ fontSize: "clamp(28px, 3.5vw, 48px)" }}
              >
                Everywhere your business demands.
              </h2>
              <p
                ref={bodyRef}
                className="font-sans text-[13px] text-[#6B6860] leading-[1.7] opacity-0"
              >
                Offices across three continents, relationships spanning 44+ countries.
              </p>
              <div
                ref={pillsRef}
                className="flex flex-wrap gap-2 pt-1 opacity-0"
              >
                {GLOBE_CITIES.map((city) => (
                  <span
                    key={city.name}
                    className="border border-[#D4D0C8] text-[#6B6860] font-sans text-[11px] tracking-wide px-3 py-1.5 rounded-none hover:border-[#C8A96E] hover:text-[#C8A96E] transition duration-200"
                  >
                    {city.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Center — globe */}
          <div className="w-[min(80vh,55vw)] h-[min(80vh,55vw)]">
            <GlobeCanvas scrollProgress={scrollProgressRef} />
          </div>

          {/* Right — clocks, each one by one */}
          <div className="flex items-center justify-center px-6 md:px-12">
            <div className="flex flex-col gap-8">
              {WORLD_CLOCKS.map((clock, i) => (
                <ClockItem
                  key={clock.city}
                  clock={clock}
                  index={i}
                  clockRefs={clockRefs}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Inline clock item to attach individual refs
function ClockItem({
  clock,
  index,
  clockRefs,
}: {
  clock: { city: string; highlight: boolean };
  index: number;
  clockRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}) {
  const [time, setTime] = useState("");

  useEffect(() => {
    function update() {
      setTime(
        new Intl.DateTimeFormat("en-US", {
          timeZone: WORLD_CLOCKS[index].timezone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date())
      );
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [index]);

  return (
    <div
      ref={(el) => { clockRefs.current[index] = el; }}
      className="opacity-0"
    >
      <div className="font-sans text-[10px] tracking-[0.15em] uppercase text-[#A8A49E]">
        {clock.city}
      </div>
      <div
        className="font-light tracking-[0.05em] tabular-nums mt-1"
        style={{
          fontSize: 26,
          color: clock.highlight ? "#C8A96E" : "#0F0F0D",
          fontFamily: "var(--font-b612), 'B612 Mono', monospace",
        }}
      >
        {time || "--:--:--"}
      </div>
    </div>
  );
}
