"use client";

import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface ScrollFadeOptions {
  y?: number;
  delay?: number;
  duration?: number;
  start?: string;
}

export default function useScrollFade<T extends HTMLElement>(
  opts: ScrollFadeOptions = {}
) {
  const ref = useRef<T>(null);
  const { y = 30, delay = 0, duration = 0.8, start = "top 85%" } = opts;

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      gsap.from(ref.current!, {
        y,
        opacity: 0,
        duration,
        delay,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ref.current!,
          start,
          once: true,
        },
      });
    });

    return () => ctx.revert();
  }, [y, delay, duration, start]);

  return ref;
}
