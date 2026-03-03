"use client";

import { ReactLenis } from "lenis/react";

export default function LenisProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.04,
        duration: 2.0,
        smoothWheel: true,
        wheelMultiplier: 0.35,
        touchMultiplier: 0.8,
      }}
    >
      {children}
    </ReactLenis>
  );
}
