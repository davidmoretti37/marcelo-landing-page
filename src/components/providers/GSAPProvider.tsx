"use client";

import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";

export default function GSAPProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
  }, []);

  useLenis(() => {
    ScrollTrigger.update();
  });

  return <>{children}</>;
}
