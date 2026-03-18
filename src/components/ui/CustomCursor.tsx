"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export default function CustomCursor() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const [hoverState, setHoverState] = useState<"default" | "hover" | "text">("default");
  const rafRef = useRef<number>(0);

  useEffect(() => {
    setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mousePos.current = { x: e.clientX, y: e.clientY };
    if (dotRef.current) {
      dotRef.current.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`;
    }
  }, []);

  useEffect(() => {
    if (isTouchDevice) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive = target.closest("a, button, [data-cursor='hover']");
      const textCursor = target.closest("[data-cursor='text']");
      if (textCursor) {
        setHoverState("text");
      } else if (interactive) {
        setHoverState("hover");
      } else {
        setHoverState("default");
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);

    const animate = () => {
      const lerp = 0.15;
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * lerp;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * lerp;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringPos.current.x - 16}px, ${ringPos.current.y - 16}px)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      cancelAnimationFrame(rafRef.current);
    };
  }, [isTouchDevice, handleMouseMove]);

  if (isTouchDevice) return null;

  const isHover = hoverState === "hover";
  const isText = hoverState === "text";

  return (
    <>
      {/* Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: "#0F0F0D",
          transition: "opacity 200ms, scale 200ms",
          opacity: isHover || isText ? 0 : 1,
          scale: isHover || isText ? "0" : "1",
        }}
      />
      {/* Ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999] flex items-center justify-center"
        style={{
          width: isHover ? 56 : isText ? 80 : 32,
          height: isHover ? 56 : isText ? 32 : 32,
          borderRadius: isText ? 999 : "50%",
          border: `1px solid ${isHover || isText ? "#C8A96E" : "#0F0F0D"}`,
          backgroundColor: isText ? "rgba(200,169,110,0.1)" : "transparent",
          transition: "width 300ms, height 300ms, border-color 300ms, border-radius 300ms, background-color 300ms",
        }}
      >
        {isText && (
          <span
            className="font-sans text-[9px] tracking-widest text-[#C8A96E] uppercase select-none"
          >
            VIEW
          </span>
        )}
      </div>
    </>
  );
}
