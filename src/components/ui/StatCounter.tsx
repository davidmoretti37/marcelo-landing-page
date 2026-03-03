"use client";

import { useRef, useLayoutEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const SERIF = "var(--font-cormorant), Georgia, serif";

interface StatCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
}

export default function StatCounter({ value, prefix = "", suffix = "", label }: StatCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const numRef = useRef({ val: 0 });
  const [display, setDisplay] = useState("0");

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      gsap.to(numRef.current, {
        val: value,
        duration: 2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ref.current!,
          start: "top 85%",
          once: true,
        },
        onUpdate: () => {
          setDisplay(Math.round(numRef.current.val).toLocaleString("en-US"));
        },
      });
    });

    return () => ctx.revert();
  }, [value]);

  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily: SERIF,
          fontSize: "clamp(36px, 5vw, 48px)",
          fontWeight: 300,
          color: "#B8976A",
          lineHeight: 1,
        }}
      >
        {prefix}{display}{suffix}
      </div>
      <div
        style={{
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          fontSize: 9,
          fontWeight: 400,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.4)",
          marginTop: 8,
        }}
      >
        {label}
      </div>
    </div>
  );
}
