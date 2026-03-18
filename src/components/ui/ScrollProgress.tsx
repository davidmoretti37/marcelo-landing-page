"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!barRef.current) return;

    const trigger = ScrollTrigger.create({
      trigger: document.documentElement,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        if (barRef.current) {
          barRef.current.style.transform = `scaleY(${self.progress})`;
        }
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  return (
    <div
      ref={barRef}
      className="fixed top-0 right-0 w-[2px] h-full z-[9997] pointer-events-none origin-top"
      style={{
        background: "linear-gradient(to bottom, #C8A96E, #8A7550)",
        transform: "scaleY(0)",
      }}
    />
  );
}
