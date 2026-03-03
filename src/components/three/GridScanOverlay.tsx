"use client";

import { useRef, useEffect } from "react";
import { planeProxy } from "@/components/three/PlaneCanvas";
import GarageScene from "@/components/three/GarageScene";

/*
  Thin wrapper that reads planeProxy.terrainOpacity each frame
  and drives the overlay's CSS opacity.
  Uses opacity:0 (not display:none) so the WebGL canvas always
  has proper dimensions and can render immediately when needed.
*/
export default function GridScanOverlay() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const el = wrapRef.current;
    if (!el) return;

    function tick() {
      raf = requestAnimationFrame(tick);
      const opacity = planeProxy.terrainOpacity;
      el!.style.opacity = String(opacity);
      // Hide from compositing when fully invisible
      el!.style.visibility = opacity < 0.01 ? "hidden" : "visible";
    }
    tick();

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={wrapRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 5,
        pointerEvents: "none",
        opacity: 0,
        visibility: "hidden",
        background: "#080604",
      }}
    >
      <GarageScene />
    </div>
  );
}
