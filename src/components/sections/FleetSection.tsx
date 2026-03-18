"use client";

import { useRef, useEffect, useMemo, useState, useCallback, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { gsap } from "gsap";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { PLANE_INFO } from "@/lib/constants";
import { usePrefersReducedMotion } from "@/lib/useMediaQuery";

/* ─── Shared view state (no re-renders in useFrame) ─── */
const targetOpacity = [1, 0];
const currentOpacity = [0, 0];

/* ─── 3D Aircraft with cross-fade ─── */
function AircraftModel({
  index,
  modelPath,
  visible,
}: {
  index: number;
  modelPath: string;
  visible: boolean;
}) {
  const { scene } = useGLTF(modelPath);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const oldMat = mesh.material as THREE.MeshStandardMaterial;
        mesh.material = new THREE.MeshPhysicalMaterial({
          metalness: 0.85,
          roughness: 0.15,
          clearcoat: 0.8,
          clearcoatRoughness: 0.1,
          transparent: true,
          opacity: 0,
          map: oldMat.map ?? null,
          normalMap: oldMat.normalMap ?? null,
          metalnessMap: oldMat.metalnessMap ?? null,
          roughnessMap: oldMat.roughnessMap ?? null,
        });
      }
    });
    return clone;
  }, [scene]);

  useEffect(() => {
    targetOpacity[index] = visible ? 1 : 0;
  }, [visible, index]);

  useFrame(() => {
    currentOpacity[index] +=
      (targetOpacity[index] - currentOpacity[index]) * 0.06;
    const opacity = currentOpacity[index];

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh)
          .material as THREE.MeshPhysicalMaterial;
        if (mat.isMeshPhysicalMaterial) mat.opacity = opacity;
      }
    });
    clonedScene.visible = opacity > 0.01;
  });

  return (
    <group scale={2.5} position={[0, -0.3, 0]}>
      <primitive object={clonedScene} />
    </group>
  );
}

/* ─── Main Fleet Section ─── */
export default function FleetSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSwitching, setIsSwitching] = useState(false);
  const [expandedCabin, setExpandedCabin] = useState<number | null>(null);
  const [expandedTech, setExpandedTech] = useState<"blueprint" | "scanner" | null>(null);
  const [detailZone, setDetailZone] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [detailFading, setDetailFading] = useState(false);
  const [xrayReady, setXrayReady] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const infoRef = useRef<HTMLDivElement>(null);
  const cabinPanelRef = useRef<HTMLDivElement>(null);
  const cabinInnerRef = useRef<HTMLDivElement>(null);
  const techPanelRef = useRef<HTMLDivElement>(null);
  const techInnerRef = useRef<HTMLDivElement>(null);
  const cabinRowRef = useRef<HTMLDivElement>(null);
  const techRowRef = useRef<HTMLDivElement>(null);

  // X-ray refs
  const xrayViewportRef = useRef<HTMLDivElement>(null);
  const xrayWrapRef = useRef<HTMLDivElement>(null);
  const xrayExteriorRef = useRef<HTMLImageElement>(null);
  const xrayInteriorRef = useRef<HTMLImageElement>(null);
  const xrayLineTopRef = useRef<HTMLDivElement>(null);
  const xrayLineBotRef = useRef<HTMLDivElement>(null);
  const xrayPosRef = useRef(0.5);
  const xrayDragging = useRef(false);

  const aircraft = PLANE_INFO[activeIndex];
  const bp = aircraft.blueprint;
  const zones = aircraft.cabinZones;

  /* ─── Switch aircraft ─── */
  const switchTo = useCallback(
    (newIndex: number) => {
      if (newIndex === activeIndex || isSwitching) return;

      // Collapse any open panel
      if (cabinPanelRef.current && expandedCabin !== null) {
        gsap.to(cabinPanelRef.current, { height: 0, duration: 0.2, ease: "power2.in" });
      }
      if (techPanelRef.current && expandedTech !== null) {
        gsap.to(techPanelRef.current, { height: 0, duration: 0.2, ease: "power2.in" });
      }
      setExpandedCabin(null);
      setExpandedTech(null);
      setDetailZone(0);

      setIsSwitching(true);
      setTimeout(() => {
        setActiveIndex(newIndex);
        setTimeout(() => setIsSwitching(false), 50);
      }, 350);
    },
    [activeIndex, isSwitching, expandedCabin, expandedTech],
  );

  const goNext = useCallback(() => {
    switchTo((activeIndex + 1) % PLANE_INFO.length);
  }, [activeIndex, switchTo]);

  const goPrev = useCallback(() => {
    switchTo((activeIndex - 1 + PLANE_INFO.length) % PLANE_INFO.length);
  }, [activeIndex, switchTo]);

  /* ─── Expand / collapse helpers ─── */
  const expandPanel = useCallback(
    (panelRef: React.RefObject<HTMLDivElement | null>, innerRef: React.RefObject<HTMLDivElement | null>, scrollTo = true) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const panel = panelRef.current;
          const inner = innerRef.current;
          if (!panel || !inner) return;

          gsap.fromTo(panel, { height: 0 }, { height: inner.offsetHeight, duration: 0.5, ease: "power2.out" });

          const animItems = inner.querySelectorAll<HTMLElement>("[data-anim]");
          gsap.fromTo(
            animItems,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, stagger: 0.04, duration: 0.35, delay: 0.15, ease: "power2.out" },
          );

          if (scrollTo) {
            setTimeout(() => panel.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
          }
        });
      });
    },
    [],
  );

  const collapsePanel = useCallback(
    (panelRef: React.RefObject<HTMLDivElement | null>, onDone?: () => void) => {
      const panel = panelRef.current;
      if (!panel) { onDone?.(); return; }
      gsap.to(panel, {
        height: 0,
        duration: 0.4,
        ease: "power2.inOut",
        onComplete: onDone,
      });
    },
    [],
  );

  /* ─── Toggle cabin zone card ─── */
  const toggleCabin = useCallback(
    (zoneIndex: number) => {
      // If clicking the same zone that's open → collapse
      if (expandedCabin === zoneIndex) {
        collapsePanel(cabinPanelRef, () => {
          setExpandedCabin(null);
          setDetailZone(0);
        });
        return;
      }

      // Close tech panel if open
      if (expandedTech !== null) {
        collapsePanel(techPanelRef, () => setExpandedTech(null));
      }

      const wasOpen = expandedCabin !== null;
      setExpandedCabin(zoneIndex);
      setDetailZone(zoneIndex);

      if (wasOpen) {
        // Panel already open — just update content height
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const inner = cabinInnerRef.current;
            const panel = cabinPanelRef.current;
            if (!inner || !panel) return;
            gsap.to(panel, { height: inner.offsetHeight, duration: 0.3, ease: "power2.out" });

            const animItems = inner.querySelectorAll<HTMLElement>("[data-anim]");
            gsap.fromTo(animItems, { opacity: 0, y: 8 }, { opacity: 1, y: 0, stagger: 0.03, duration: 0.3, delay: 0.1, ease: "power2.out" });
          });
        });
      } else {
        expandPanel(cabinPanelRef, cabinInnerRef);
      }
    },
    [expandedCabin, expandedTech, collapsePanel, expandPanel],
  );

  /* ─── Toggle tech card ─── */
  const toggleTech = useCallback(
    (techId: "blueprint" | "scanner") => {
      if (expandedTech === techId) {
        collapsePanel(techPanelRef, () => {
          setExpandedTech(null);
          setXrayReady(false);
        });
        return;
      }

      // Close cabin panel if open
      if (expandedCabin !== null) {
        collapsePanel(cabinPanelRef, () => {
          setExpandedCabin(null);
          setDetailZone(0);
        });
      }

      const wasOpen = expandedTech !== null;
      setExpandedTech(techId);
      setXrayReady(false);

      if (wasOpen) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const inner = techInnerRef.current;
            const panel = techPanelRef.current;
            if (!inner || !panel) return;
            gsap.to(panel, { height: inner.offsetHeight, duration: 0.3, ease: "power2.out" });

            const animItems = inner.querySelectorAll<HTMLElement>("[data-anim]");
            gsap.fromTo(animItems, { opacity: 0, y: 8 }, { opacity: 1, y: 0, stagger: 0.03, duration: 0.3, delay: 0.1, ease: "power2.out" });
          });
        });
      } else {
        expandPanel(techPanelRef, techInnerRef);
      }
    },
    [expandedTech, expandedCabin, collapsePanel, expandPanel],
  );

  /* ─── Animate detail specs on zone change ─── */
  useEffect(() => {
    if (expandedCabin === null || !cabinInnerRef.current) return;
    const specs = cabinInnerRef.current.querySelectorAll<HTMLElement>("[data-spec]");
    gsap.fromTo(specs, { opacity: 0, x: -8 }, { opacity: 1, x: 0, stagger: 0.05, duration: 0.3, delay: 0.08, ease: "power2.out" });
  }, [detailZone, expandedCabin]);

  /* ─── Update cabin panel height on zone change ─── */
  useEffect(() => {
    if (expandedCabin === null || !cabinPanelRef.current || !cabinInnerRef.current) return;
    gsap.to(cabinPanelRef.current, {
      height: cabinInnerRef.current.offsetHeight,
      duration: 0.3,
      ease: "power2.out",
    });
  }, [detailZone, expandedCabin]);

  /* ─── Update tech panel height on content change ─── */
  useEffect(() => {
    if (expandedTech === null || !techPanelRef.current || !techInnerRef.current) return;
    requestAnimationFrame(() => {
      const inner = techInnerRef.current;
      if (!inner) return;
      gsap.to(techPanelRef.current!, {
        height: inner.offsetHeight,
        duration: 0.3,
        ease: "power2.out",
      });
    });
  }, [activeIndex, expandedTech]);

  /* ─── IntersectionObserver entrance animations ─── */
  useEffect(() => {
    if (reducedMotion) return;
    const rows = [cabinRowRef.current, techRowRef.current].filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const row = entry.target as HTMLElement;
            // Animate row line
            const line = row.querySelector(".fleet-row-line");
            if (line) line.classList.add("fleet-row-line--visible");

            // Stagger cards
            const cards = row.querySelectorAll<HTMLElement>("[data-card]");
            gsap.fromTo(
              cards,
              { opacity: 0, x: 40 },
              { opacity: 1, x: 0, stagger: 0.08, duration: 0.4, delay: 0.2, ease: "power2.out" },
            );

            // Label fade
            const label = row.querySelector("[data-row-label]") as HTMLElement;
            if (label) {
              gsap.fromTo(label, { opacity: 0 }, { opacity: 1, duration: 0.3, delay: 0.1 });
            }

            observer.unobserve(row);
          }
        });
      },
      { threshold: 0.1 },
    );

    rows.forEach((r) => observer.observe(r));
    return () => observer.disconnect();
  }, [reducedMotion, activeIndex]);

  /* ─── X-Ray scanner logic ─── */
  const updateXray = useCallback((pos: number) => {
    const viewport = xrayViewportRef.current;
    const wrap = xrayWrapRef.current;
    const exterior = xrayExteriorRef.current;
    const interior = xrayInteriorRef.current;
    const lineTop = xrayLineTopRef.current;
    const lineBot = xrayLineBotRef.current;
    if (!viewport || !wrap || !exterior || !interior || !lineTop || !lineBot) return;

    const Hv = viewport.offsetHeight;
    const Hi = wrap.offsetHeight;
    const stripPct = 14;
    const stripPx = (stripPct / 100) * Hi;
    const parallax = 0.3;

    const scannerTopPx = Hv / 2 - stripPx / 2;
    const tyInterior = scannerTopPx - pos * (Hi - stripPx);
    const tyExterior = tyInterior * (1 - parallax);

    exterior.style.transform = `translateY(${tyExterior}px)`;
    interior.style.transform = `translateY(${tyInterior}px)`;

    const topPct = ((scannerTopPx - tyInterior) / Hi) * 100;
    const botPct = 100 - topPct - stripPct;
    interior.style.clipPath = `inset(${topPct}% 0 ${botPct}% 0)`;

    lineTop.style.top = `${scannerTopPx}px`;
    lineBot.style.top = `${scannerTopPx + stripPx}px`;
    lineTop.style.opacity = "1";
    lineBot.style.opacity = "1";
    interior.style.opacity = "1";
  }, []);

  useEffect(() => {
    if (expandedTech !== "scanner") {
      setXrayReady(false);
      return;
    }
    const ext = xrayExteriorRef.current;
    const int = xrayInteriorRef.current;
    if (!ext || !int) return;

    let loaded = 0;
    function onLoad() {
      loaded++;
      if (loaded >= 2) setXrayReady(true);
    }
    [ext, int].forEach((img) => {
      if (img.complete) onLoad();
      else {
        img.addEventListener("load", onLoad);
        img.addEventListener("error", onLoad);
      }
    });
  }, [expandedTech]);

  useEffect(() => {
    if (!xrayReady) return;
    setTimeout(() => updateXray(0.5), 50);
  }, [xrayReady, updateXray]);

  useEffect(() => {
    if (!xrayReady) return;
    const viewport = xrayViewportRef.current;
    if (!viewport) return;

    function getPos(clientY: number) {
      const rect = viewport!.getBoundingClientRect();
      return Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    }
    function onPointerDown(e: PointerEvent) {
      xrayDragging.current = true;
      viewport!.setPointerCapture(e.pointerId);
      const pos = getPos(e.clientY);
      xrayPosRef.current = pos;
      updateXray(pos);
    }
    function onPointerMove(e: PointerEvent) {
      if (!xrayDragging.current) return;
      const pos = getPos(e.clientY);
      xrayPosRef.current = pos;
      updateXray(pos);
    }
    function onPointerUp() {
      xrayDragging.current = false;
    }

    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", onPointerUp);
    viewport.addEventListener("pointercancel", onPointerUp);
    return () => {
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", onPointerUp);
      viewport.removeEventListener("pointercancel", onPointerUp);
    };
  }, [xrayReady, updateXray]);

  /* ─── Active detail zone ─── */
  const dZone = zones[detailZone] || zones[0];

  /* ─── Reduced motion fallback ─── */
  if (reducedMotion) {
    return (
      <section id="fleet" className="bg-[#08090e]">
        <div className="px-8 md:px-16 py-16 max-w-4xl">
          {PLANE_INFO.map((plane) => (
            <div key={plane.name} className="mb-16">
              <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#C8A96E]">
                {plane.blueprint.category}
              </p>
              <h3 className="font-editorial font-light text-[#F5F2EC] text-[36px] leading-[1.1] mt-2">
                {plane.name}
              </h3>
              <p className="font-sans text-[13px] text-[rgba(255,255,255,0.45)] leading-[1.7] mt-3">
                {plane.desc}
              </p>
              <div className="grid grid-cols-2 gap-x-7 gap-y-4 mt-6">
                {plane.stats.map((s) => (
                  <div key={s.key} className="border-t border-[rgba(255,255,255,0.08)] pt-3">
                    <div className="text-white text-[22px] font-light" style={{ fontFamily: "var(--font-b612), 'B612 Mono', monospace" }}>{s.val}</div>
                    <div className="font-sans text-[10px] tracking-[0.18em] uppercase text-[rgba(255,255,255,0.35)] mt-1">{s.key}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      id="fleet"
      className="relative"
      style={{ background: "#08090e", overflow: "hidden" }}
    >
      {/* Vertical gold divider between panels (desktop) */}
      <div
        className="absolute top-0 w-px hidden md:block pointer-events-none"
        style={{
          left: "50%",
          height: "100vh",
          background: "linear-gradient(to bottom, transparent 10%, rgba(184,151,106,0.15) 30%, rgba(184,151,106,0.15) 70%, transparent 90%)",
        }}
      />

      {/* ═══ TOP: AIRCRAFT SHOWCASE (50/50 split) ═══ */}
      <div className="w-full min-h-screen grid grid-cols-1 md:grid-cols-2">
        {/* ─── LEFT: Info Panel ─── */}
        <div
          ref={infoRef}
          className="flex flex-col justify-center order-2 md:order-1 px-6 md:px-[clamp(40px,5vw,80px)] lg:px-[clamp(60px,6vw,120px)] py-10 md:py-0 relative z-10"
          style={{
            transition: "opacity 0.35s ease, transform 0.35s ease",
            opacity: isSwitching ? 0 : 1,
            transform: isSwitching ? "translateY(14px)" : "translateY(0)",
          }}
        >
          <div className="flex items-center gap-2.5 mb-5">
            <span className="block w-7 h-px opacity-60" style={{ background: "#C8A96E" }} />
            <span className="font-sans text-[10px] tracking-[0.28em] uppercase text-[#C8A96E]">
              The Fleet
            </span>
          </div>

          <h2
            className="font-editorial font-light text-white leading-[1.05] mb-3"
            style={{ fontSize: "clamp(40px, 5vw, 72px)" }}
          >
            {aircraft.name}
          </h2>

          <div className="inline-flex items-center gap-2 mb-5">
            <span className="block w-3 h-3 border border-[#C8A96E] rotate-45 opacity-40" />
            <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-[rgba(255,255,255,0.3)]">
              {bp.category}
            </span>
          </div>

          <p className="font-sans text-[14px] font-light text-[rgba(255,255,255,0.45)] leading-[1.75] mb-8 max-w-[360px]">
            {aircraft.desc}
          </p>

          <div className="grid grid-cols-2 gap-x-8 gap-y-5 mb-8 max-w-[400px]">
            {aircraft.stats.map((stat) => (
              <div key={stat.key} className="border-t border-[rgba(184,151,106,0.12)] pt-3">
                <div
                  className="text-white font-light tracking-[0.02em] leading-none"
                  style={{
                    fontSize: 24,
                    fontFamily: "var(--font-b612), 'B612 Mono', monospace",
                  }}
                >
                  {stat.val}
                </div>
                <p className="font-sans text-[9px] tracking-[0.2em] uppercase text-[#C8A96E] opacity-60 mt-2">
                  {stat.key}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={goPrev}
              disabled={isSwitching}
              className="w-11 h-11 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] flex items-center justify-center text-[rgba(255,255,255,0.5)] hover:bg-[rgba(184,151,106,0.12)] hover:border-[rgba(184,151,106,0.5)] hover:text-[#C8A96E] transition-all duration-300 disabled:opacity-30"
              aria-label="Previous aircraft"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={goNext}
              disabled={isSwitching}
              className="w-11 h-11 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] flex items-center justify-center text-[rgba(255,255,255,0.5)] hover:bg-[rgba(184,151,106,0.12)] hover:border-[rgba(184,151,106,0.5)] hover:text-[#C8A96E] transition-all duration-300 disabled:opacity-30"
              aria-label="Next aircraft"
            >
              <ChevronRight size={18} />
            </button>
            <div className="flex gap-2 items-center ml-2">
              {PLANE_INFO.map((plane, i) => (
                <button
                  key={plane.name}
                  onClick={() => switchTo(i)}
                  className="group flex items-center gap-1.5"
                  aria-label={`Select ${plane.name}`}
                >
                  <div
                    className="transition-all duration-400"
                    style={{
                      width: i === activeIndex ? 24 : 8,
                      height: 3,
                      borderRadius: 2,
                      background: i === activeIndex ? "#C8A96E" : "rgba(255,255,255,0.15)",
                    }}
                  />
                  {i === activeIndex && (
                    <span
                      className="font-sans text-[9px] tracking-[0.15em] uppercase text-[rgba(255,255,255,0.35)]"
                      style={{ fontFamily: "var(--font-b612), 'B612 Mono', monospace" }}
                    >
                      {plane.blueprint.label}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── RIGHT: 3D Model ─── */}
        <div className="relative order-1 md:order-2 h-[50vh] md:h-screen">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(184,151,106,0.04) 0%, transparent 70%)",
            }}
          />

          <Canvas
            camera={{ position: [0, 0.8, 8], fov: 45 }}
            gl={{ antialias: true, alpha: true }}
            style={{ width: "100%", height: "100%" }}
          >
            <ambientLight intensity={0.12} color="#ffffff" />
            <spotLight position={[0, 8, 4]} angle={0.35} penumbra={0.8} color="#FFF5E6" intensity={100} />
            <spotLight position={[-4, 3, 2]} color="#E8F0FF" intensity={45} />
            <spotLight position={[4, -2, 6]} color="#FFF5E6" intensity={25} />

            <Suspense fallback={null}>
              {PLANE_INFO.map((plane, i) => (
                <AircraftModel key={plane.model} index={i} modelPath={plane.model} visible={i === activeIndex} />
              ))}
              <Environment files="/hangar.hdr" />
            </Suspense>

            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate
              autoRotateSpeed={0.5}
              maxPolarAngle={Math.PI / 1.8}
              minPolarAngle={Math.PI / 3}
            />
          </Canvas>

          <div
            className="absolute bottom-6 right-8 pointer-events-none hidden md:block"
            style={{ fontFamily: "var(--font-b612), 'B612 Mono', monospace" }}
          >
            <span className="text-[#C8A96E] text-[28px] font-light">
              {String(activeIndex + 1).padStart(2, "0")}
            </span>
            <span className="text-[rgba(255,255,255,0.15)] text-[14px] mx-1">/</span>
            <span className="text-[rgba(255,255,255,0.15)] text-[14px]">
              {String(PLANE_INFO.length).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ROW 1: STEP INSIDE — Cabin Zones                   */}
      {/* ═══════════════════════════════════════════════════ */}
      <div
        ref={cabinRowRef}
        className="relative z-10 border-t border-[rgba(184,151,106,0.08)]"
        style={{
          transition: "opacity 0.35s ease",
          opacity: isSwitching ? 0 : 1,
        }}
      >
        <div className="px-6 md:px-12 lg:px-16 pt-10 pb-6">
          {/* Row label */}
          <div className="flex items-center gap-3 mb-7">
            <span className="fleet-row-line block h-px bg-[#C8A96E] opacity-40" />
            <span data-row-label className="font-sans text-[10px] tracking-[0.3em] uppercase text-[rgba(255,255,255,0.35)]">
              Explore the Cabin
            </span>
            <span className="block w-px h-3 bg-[rgba(255,255,255,0.08)]" />
            <span data-row-label className="font-sans text-[10px] tracking-[0.15em] text-[rgba(255,255,255,0.2)]">
              Tap any area to learn more
            </span>
          </div>

          {/* Card row — horizontal scroll */}
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-1 px-1 snap-x snap-mandatory md:snap-none">
            {zones.map((zone, i) => {
              const isActive = expandedCabin === i;
              return (
                <button
                  key={zone.name}
                  data-card
                  onClick={() => toggleCabin(i)}
                  className={`fleet-card flex-shrink-0 cursor-pointer text-left relative ${isActive ? "fleet-card--active" : ""} snap-start`}
                  style={{
                    width: "clamp(220px, 28vw, 320px)",
                    border: isActive ? "1px solid #C8A96E" : "1px solid rgba(184,151,106,0.06)",
                  }}
                >
                  <div
                    className="relative overflow-hidden rounded-lg"
                    style={{ aspectRatio: "3 / 4" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={zone.image}
                      alt={zone.title}
                      className="fleet-card-img w-full h-full object-cover"
                      draggable={false}
                    />
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: isActive
                          ? "linear-gradient(to top, rgba(200,169,110,0.2), transparent 50%)"
                          : "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 40%, transparent 65%)",
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="font-sans text-[9px] tracking-[0.25em] uppercase text-[#C8A96E] opacity-70 mb-1">
                        {zone.name}
                      </p>
                      <h4 className="font-editorial font-light text-white text-[18px] leading-[1.2] mb-1.5">
                        {zone.title}
                      </h4>
                      <p className="font-sans text-[11px] text-[rgba(255,255,255,0.45)] leading-[1.5]">
                        {zone.desc.length > 60 ? zone.desc.slice(0, 60) + "..." : zone.desc}
                      </p>
                      {/* Spec preview — shows on hover only */}
                      <div className="fleet-card-preview mt-3 flex gap-4">
                        {zone.specs.slice(0, 2).map((s) => (
                          <div key={s.key}>
                            <div className="font-sans text-[8px] text-[rgba(255,255,255,0.3)] tracking-[0.08em] uppercase">{s.key}</div>
                            <div className="text-white text-[11px] mt-0.5" style={{ fontFamily: "var(--font-b612), 'B612 Mono', monospace" }}>{s.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {isActive && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-[3px]"
                        style={{ background: "linear-gradient(90deg, transparent, #C8A96E, transparent)" }}
                      />
                    )}
                  </div>

                  {isActive && (
                    <div className="flex justify-center mt-2">
                      <div
                        style={{
                          width: 0,
                          height: 0,
                          borderLeft: "10px solid transparent",
                          borderRight: "10px solid transparent",
                          borderTop: "10px solid #C8A96E",
                        }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ CABIN DETAIL PANEL ═══ */}
      <div
        ref={cabinPanelRef}
        style={{
          height: 0,
          overflow: "hidden",
          background: "#08090e",
        }}
      >
        <div
          ref={cabinInnerRef}
          className="max-w-[1200px] mx-auto relative"
          style={{ padding: "clamp(40px, 6vw, 80px) clamp(24px, 5vw, 64px)" }}
        >
          {/* Close */}
          <button
            onClick={() => expandedCabin !== null && toggleCabin(expandedCabin)}
            className="absolute z-[2] flex items-center justify-center w-10 h-10 border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] text-[rgba(255,255,255,0.4)] hover:border-[#C8A96E] hover:text-[#C8A96E] transition-all duration-300 cursor-pointer"
            style={{ top: "clamp(16px, 3vw, 40px)", right: "clamp(16px, 3vw, 40px)" }}
            aria-label="Close panel"
          >
            <X size={18} />
          </button>

          {/* Section divider */}
          <div className="flex items-center gap-4 mb-8" data-anim>
            <span className="flex-1 h-px bg-[rgba(184,151,106,0.15)]" />
            <span className="font-sans text-[9px] tracking-[0.4em] uppercase text-[rgba(184,151,106,0.4)]">
              Explore the Cabin
            </span>
            <span className="flex-1 h-px bg-[rgba(184,151,106,0.15)]" />
          </div>

          {/* Hero — selected zone */}
          <div
            className="relative overflow-hidden mb-6 aspect-video md:aspect-[21/9] rounded-lg"
            style={{
              opacity: detailFading ? 0 : 1,
              transform: detailFading ? "scale(0.99)" : "scale(1)",
              transition: "opacity 0.25s ease, transform 0.25s ease",
            }}
            data-anim
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dZone.image}
              alt={dZone.title}
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(to top, rgba(8,9,14,0.95) 0%, rgba(8,9,14,0.4) 40%, transparent 70%)" }}
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-end">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-[#C8A96E] text-[11px] tracking-[0.3em] uppercase"
                      style={{ fontFamily: "var(--font-b612), 'B612 Mono', monospace" }}
                    >
                      Zone {String(detailZone + 1).padStart(2, "0")} / {String(zones.length).padStart(2, "0")}
                    </span>
                    <span className="block w-4 h-px bg-[#C8A96E] opacity-30" />
                    <span className="font-sans text-[9px] tracking-[0.2em] uppercase text-[rgba(255,255,255,0.3)]">
                      {dZone.name}
                    </span>
                  </div>
                  <h3
                    className="font-editorial font-light text-white leading-[1.1] mb-3"
                    style={{ fontSize: "clamp(32px, 4vw, 52px)" }}
                  >
                    {dZone.title}
                  </h3>
                  <p className="font-sans text-[14px] text-[rgba(255,255,255,0.5)] leading-[1.8] max-w-[500px]">
                    {dZone.desc}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 min-w-[240px]">
                  {dZone.specs.map((spec) => (
                    <div key={spec.key} className="py-3 border-b border-[rgba(255,255,255,0.05)]" data-spec>
                      <div className="font-sans text-[10px] text-[rgba(255,255,255,0.35)] tracking-[0.08em] uppercase">
                        {spec.key}
                      </div>
                      <div
                        className="text-white text-[13px] mt-0.5"
                        style={{ fontFamily: "var(--font-b612), 'B612 Mono', monospace" }}
                      >
                        {spec.val}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ROW 2: UNDER THE HOOD — Technical                  */}
      {/* ═══════════════════════════════════════════════════ */}
      <div
        ref={techRowRef}
        className="relative z-10 border-t border-[rgba(184,151,106,0.08)]"
        style={{
          transition: "opacity 0.35s ease",
          opacity: isSwitching ? 0 : 1,
        }}
      >
        <div className="px-6 md:px-12 lg:px-16 pt-10 pb-6">
          {/* Row label */}
          <div className="flex items-center gap-3 mb-7">
            <span className="fleet-row-line block h-px bg-[#C8A96E] opacity-40" />
            <span data-row-label className="font-sans text-[10px] tracking-[0.3em] uppercase text-[rgba(255,255,255,0.35)]">
              Technical Details
            </span>
          </div>

          {/* Tech cards */}
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-1 px-1 snap-x snap-mandatory md:snap-none">
            {/* Blueprint card */}
            <button
              data-card
              onClick={() => toggleTech("blueprint")}
              className={`fleet-card flex-shrink-0 cursor-pointer text-left relative snap-start ${expandedTech === "blueprint" ? "fleet-card--active" : ""}`}
              style={{
                width: "clamp(280px, 35vw, 420px)",
                border: expandedTech === "blueprint" ? "1px solid #C8A96E" : "1px solid rgba(184,151,106,0.06)",
              }}
            >
              <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: "16 / 10" }}>
                <div className="absolute inset-0 bg-[#0a0b10]" />
                {/* Blueprint label overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div
                    className="text-[#C8A96E] text-[32px] font-light opacity-30 mb-2"
                    style={{ fontFamily: "var(--font-b612), 'B612 Mono', monospace" }}
                  >
                    {bp.label}
                  </div>
                  <div className="w-16 h-px bg-[rgba(184,151,106,0.15)]" />
                  <div className="font-sans text-[9px] tracking-[0.3em] uppercase text-[rgba(184,151,106,0.3)] mt-2">
                    {bp.specGroups.reduce((sum, g) => sum + g.specs.length, 0)} specifications
                  </div>
                </div>
                {/* Bottom gradient */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)" }}
                />
                {/* Info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="font-sans text-[9px] tracking-[0.25em] uppercase text-[#C8A96E] opacity-70 mb-1">
                    Technical
                  </p>
                  <h4 className="font-editorial font-light text-white text-[18px] leading-[1.2]">
                    Blueprint
                  </h4>
                  {/* Spec preview */}
                  <div className="fleet-card-preview mt-3 flex gap-4">
                    <div>
                      <div className="font-sans text-[8px] text-[rgba(255,255,255,0.3)] tracking-[0.08em] uppercase">Range</div>
                      <div className="text-white text-[11px] mt-0.5" style={{ fontFamily: "var(--font-b612), 'B612 Mono', monospace" }}>{aircraft.stats[0]?.val}</div>
                    </div>
                    <div>
                      <div className="font-sans text-[8px] text-[rgba(255,255,255,0.3)] tracking-[0.08em] uppercase">Speed</div>
                      <div className="text-white text-[11px] mt-0.5" style={{ fontFamily: "var(--font-b612), 'B612 Mono', monospace" }}>{aircraft.stats[1]?.val}</div>
                    </div>
                  </div>
                </div>
                {expandedTech === "blueprint" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, transparent, #C8A96E, transparent)" }} />
                )}
              </div>
              {expandedTech === "blueprint" && (
                <div className="flex justify-center mt-2">
                  <div style={{ width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: "10px solid #C8A96E" }} />
                </div>
              )}
            </button>

            {/* X-Ray Scanner card */}
            <button
              data-card
              onClick={() => toggleTech("scanner")}
              className={`fleet-card flex-shrink-0 cursor-pointer text-left relative snap-start ${expandedTech === "scanner" ? "fleet-card--active" : ""}`}
              style={{
                width: "clamp(280px, 35vw, 420px)",
                border: expandedTech === "scanner" ? "1px solid #C8A96E" : "1px solid rgba(184,151,106,0.06)",
              }}
            >
              <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: "16 / 10" }}>
                {/* Scanner thumbnail */}
                <div className="absolute inset-0 bg-[#0a0b10]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/plane-top.png"
                    alt="Aircraft top view"
                    className="fleet-card-img w-full h-full object-contain opacity-40"
                    draggable={false}
                    style={{ padding: "12%" }}
                  />
                </div>
                {/* Animated scan line */}
                <div
                  className="scan-line-anim absolute left-[5%] right-[5%] h-[2px] pointer-events-none"
                  style={{
                    background: "linear-gradient(90deg, transparent, #C8A96E, transparent)",
                    boxShadow: "0 0 12px rgba(200,169,110,0.4)",
                  }}
                />
                {/* Bottom gradient */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)" }}
                />
                {/* Info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="font-sans text-[9px] tracking-[0.25em] uppercase text-[#C8A96E] opacity-70 mb-1">
                    Interactive
                  </p>
                  <h4 className="font-editorial font-light text-white text-[18px] leading-[1.2]">
                    X-Ray Scanner
                  </h4>
                  {/* Spec preview */}
                  <div className="fleet-card-preview mt-3">
                    <div className="font-sans text-[9px] text-[rgba(255,255,255,0.3)] tracking-[0.05em]">
                      Drag to reveal interior cutaway
                    </div>
                  </div>
                </div>
                {expandedTech === "scanner" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, transparent, #C8A96E, transparent)" }} />
                )}
              </div>
              {expandedTech === "scanner" && (
                <div className="flex justify-center mt-2">
                  <div style={{ width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: "10px solid #C8A96E" }} />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ TECH DETAIL PANEL ═══ */}
      <div
        ref={techPanelRef}
        style={{
          height: 0,
          overflow: "hidden",
          background: "#08090e",
        }}
      >
        <div
          ref={techInnerRef}
          className="max-w-[1200px] mx-auto relative"
          style={{ padding: "clamp(40px, 6vw, 80px) clamp(24px, 5vw, 64px)" }}
        >
          {/* Close */}
          <button
            onClick={() => expandedTech && toggleTech(expandedTech)}
            className="absolute z-[2] flex items-center justify-center w-10 h-10 border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] text-[rgba(255,255,255,0.4)] hover:border-[#C8A96E] hover:text-[#C8A96E] transition-all duration-300 cursor-pointer"
            style={{ top: "clamp(16px, 3vw, 40px)", right: "clamp(16px, 3vw, 40px)" }}
            aria-label="Close panel"
          >
            <X size={18} />
          </button>

          {/* ── BLUEPRINT ── */}
          {expandedTech === "blueprint" && (
            <>
              <div className="flex items-center gap-4 mb-3" data-anim>
                <span className="flex-1 h-px bg-[rgba(184,151,106,0.15)]" />
                <span className="font-sans text-[9px] tracking-[0.4em] uppercase text-[rgba(184,151,106,0.4)]">
                  Technical Specification
                </span>
                <span className="flex-1 h-px bg-[rgba(184,151,106,0.15)]" />
              </div>

              <h3
                className="font-editorial font-light text-white text-center mb-1"
                style={{ fontSize: "clamp(28px, 3.5vw, 44px)" }}
                data-anim
              >
                {aircraft.name}
              </h3>
              <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#C8A96E] text-center mb-10" data-anim>
                {bp.category}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bp.specGroups.map((group) => (
                  <div key={group.title} className="border border-[rgba(184,151,106,0.08)] p-6 rounded-lg" data-anim>
                    <h4 className="flex items-center gap-2 mb-4">
                      <span className="block w-4 h-px bg-[#C8A96E] opacity-50" />
                      <span className="font-sans text-[9px] tracking-[0.35em] uppercase text-[#C8A96E]">
                        {group.title}
                      </span>
                    </h4>
                    <div>
                      {group.specs.map((spec) => (
                        <div key={spec.key} className="flex justify-between items-baseline py-[10px] border-b border-[rgba(255,255,255,0.05)] last:border-b-0" data-anim>
                          <span className="font-sans text-[12px] text-[rgba(255,255,255,0.45)] tracking-[0.05em]">
                            {spec.key}
                          </span>
                          <span className="text-white text-[14px] tracking-[0.03em] tabular-nums" style={{ fontFamily: "var(--font-b612), 'B612 Mono', monospace" }}>
                            {spec.val}
                            {spec.unit && (
                              <span className="text-[10px] text-[rgba(255,255,255,0.2)] ml-1.5">{spec.unit}</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-4 mt-10 pt-4 border-t border-[rgba(184,151,106,0.1)]" data-anim>
                <span className="font-sans text-[8px] tracking-[0.3em] uppercase text-[rgba(184,151,106,0.3)]">Spark Aviation</span>
                <span className="w-px h-3 bg-[rgba(184,151,106,0.12)]" />
                <span className="font-sans text-[8px] tracking-[0.3em] uppercase text-[rgba(184,151,106,0.3)]">DWG NO: SA-{bp.label}-001</span>
                <span className="w-px h-3 bg-[rgba(184,151,106,0.12)]" />
                <span className="font-sans text-[8px] tracking-[0.3em] uppercase text-[rgba(184,151,106,0.3)]">Scale: NTS</span>
              </div>
            </>
          )}

          {/* ── X-RAY SCANNER ── */}
          {expandedTech === "scanner" && (
            <>
              <div className="flex items-center gap-4 mb-6" data-anim>
                <span className="flex-1 h-px bg-[rgba(184,151,106,0.15)]" />
                <span className="font-sans text-[9px] tracking-[0.4em] uppercase text-[rgba(184,151,106,0.4)]">
                  Interior Scan
                </span>
                <span className="flex-1 h-px bg-[rgba(184,151,106,0.15)]" />
              </div>

              <p className="font-sans text-[11px] text-[rgba(255,255,255,0.3)] text-center mb-4 tracking-wide" data-anim>
                Drag to scan through the aircraft and reveal the cabin interior
              </p>

              <div
                ref={xrayViewportRef}
                style={{
                  position: "relative",
                  height: "clamp(300px, 50vh, 550px)",
                  overflow: "hidden",
                  cursor: "grab",
                  touchAction: "none",
                  userSelect: "none",
                  border: "1px solid rgba(184,151,106,0.1)",
                }}
                data-anim
              >
                <div
                  ref={xrayWrapRef}
                  style={{
                    position: "absolute",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "min(800px, 95%)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={xrayExteriorRef}
                    src="/plane-top.png"
                    alt="Exterior top view"
                    style={{ width: "100%", display: "block" }}
                    draggable={false}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={xrayInteriorRef}
                    src="/plane-interior.png"
                    alt="Interior cutaway"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center top",
                      clipPath: "inset(0% 0 100% 0)",
                      opacity: 0,
                    }}
                    draggable={false}
                  />
                </div>

                <div ref={xrayLineTopRef} style={{ position: "absolute", left: "5%", right: "5%", height: "2px", background: "linear-gradient(90deg, transparent, #C8A96E, transparent)", opacity: 0, pointerEvents: "none", boxShadow: "0 0 16px rgba(200,169,110,0.5), 0 0 40px rgba(200,169,110,0.2)", zIndex: 2 }} />
                <div ref={xrayLineBotRef} style={{ position: "absolute", left: "5%", right: "5%", height: "2px", background: "linear-gradient(90deg, transparent, #C8A96E, transparent)", opacity: 0, pointerEvents: "none", boxShadow: "0 0 16px rgba(200,169,110,0.5), 0 0 40px rgba(200,169,110,0.2)", zIndex: 2 }} />

                <div className="absolute left-1/2 -translate-x-1/2 z-10 pointer-events-none" style={{ top: 12, opacity: xrayReady ? 0.3 : 0, transition: "opacity 0.5s" }}>
                  <svg width="16" height="10" viewBox="0 0 16 10" fill="none"><path d="M1 9L8 2L15 9" stroke="#C8A96E" strokeWidth="1.5" /></svg>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 z-10 pointer-events-none" style={{ bottom: 12, opacity: xrayReady ? 0.3 : 0, transition: "opacity 0.5s" }}>
                  <svg width="16" height="10" viewBox="0 0 16 10" fill="none"><path d="M1 1L8 8L15 1" stroke="#C8A96E" strokeWidth="1.5" /></svg>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 mt-8 pt-4 border-t border-[rgba(184,151,106,0.06)]" data-anim>
                <span className="font-sans text-[8px] tracking-[0.3em] uppercase text-[rgba(184,151,106,0.25)]">
                  {aircraft.name} — X-Ray Scan
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

PLANE_INFO.forEach((plane) => useGLTF.preload(plane.model));
