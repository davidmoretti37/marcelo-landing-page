/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useEffect, useMemo, useState, useCallback, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { Aircraft } from "@/lib/showroom/types";
import { generateBlueprint } from "@/lib/showroom/blueprint";

// ─── 3D Model mapping ─────────────────────────────────────────────────────
const MODEL_MAP: Record<string, string> = {
  "G700": "/airplane.glb",
  "Praetor 600": "/airplane2.glb",
};

const MONO = "var(--font-inter), system-ui, sans-serif";

// ─── 3D Aircraft Model ────────────────────────────────────────────────────
function AircraftModel({ modelPath }: { modelPath: string }) {
  const { scene } = useGLTF(modelPath);
  const opacityRef = useRef(0);

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

  useFrame(() => {
    opacityRef.current += (1 - opacityRef.current) * 0.06;
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshPhysicalMaterial;
        if (mat.isMeshPhysicalMaterial) mat.opacity = opacityRef.current;
      }
    });
    clonedScene.visible = opacityRef.current > 0.01;
  });

  return (
    <group scale={2.5} position={[0, -0.3, 0]}>
      <primitive object={clonedScene} />
    </group>
  );
}

// ─── Interface ─────────────────────────────────────────────────────────────

interface AircraftDetailProps {
  aircraft: Aircraft;
  onClose: () => void;
}

function formatPrice(price: number): string {
  return "$" + price.toLocaleString("en-US");
}
function formatStat(val: number | undefined, suffix: string): string {
  if (val == null) return "N/A";
  return val.toLocaleString("en-US") + " " + suffix;
}

// ─── Main Component ───────────────────────────────────────────────────────

export default function AircraftDetail({ aircraft, onClose }: AircraftDetailProps) {
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [scannerOpen, setScannerOpen] = useState(true);
  const [xrayReady, setXrayReady] = useState(false);

  const xrayViewportRef = useRef<HTMLDivElement>(null);
  const xrayWrapRef = useRef<HTMLDivElement>(null);
  const xrayExteriorRef = useRef<HTMLImageElement>(null);
  const xrayInteriorRef = useRef<HTMLImageElement>(null);
  const xrayLineTopRef = useRef<HTMLDivElement>(null);
  const xrayLineBotRef = useRef<HTMLDivElement>(null);
  const xrayPosRef = useRef(0.5);
  const scannerSectionRef = useRef<HTMLDivElement>(null);

  const glbPath = MODEL_MAP[aircraft.model] ?? null;
  const bp = useMemo(() => generateBlueprint(aircraft), [aircraft]);
  const zones = aircraft.cabinZones ?? [];
  const specs = aircraft.specs;
  const pax = specs.maxPassengers ?? specs.typicalPax;
  const hasPhotos = aircraft.photos.length > 0;
  const xrayExteriorSrc = aircraft.xrayImages?.exterior ?? "/plane-top.png";
  const xrayInteriorSrc = aircraft.xrayImages?.interior ?? "/plane-interior.png";

  const statsBar = [
    { key: "Range", val: formatStat(specs.range_nm, "NM") },
    { key: "Speed", val: specs.cruiseSpeed_ktas ? `${specs.cruiseSpeed_ktas} ktas` : "N/A" },
    { key: "Passengers", val: pax != null ? String(pax) : "N/A" },
    { key: "Ceiling", val: formatStat(specs.ceiling_ft, "ft") },
  ];

  const features = [
    { label: "Stand-up Cabin", on: aircraft.features.standupCabin },
    { label: "Flat-bed", on: aircraft.features.flatBerthing },
    { label: "Full Galley", on: aircraft.features.fullGalley },
    { label: "WiFi", on: aircraft.features.wifi },
    { label: "Entertainment", on: aircraft.features.entertainment },
    { label: "In-flight Baggage", on: aircraft.features.baggageAccessible },
    { label: "Engine Program", on: aircraft.features.engineProgramEnrolled },
  ];

  // ─── X-Ray scanner ──────────────────────────────────────────────────

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
    if (!scannerOpen) { setXrayReady(false); return; }
    const ext = xrayExteriorRef.current;
    const int = xrayInteriorRef.current;
    if (!ext || !int) return;
    let loaded = 0;
    function onLoad() { loaded++; if (loaded >= 2) setXrayReady(true); }
    [ext, int].forEach((img) => {
      if (img.complete) onLoad();
      else { img.addEventListener("load", onLoad); img.addEventListener("error", onLoad); }
    });
  }, [scannerOpen]);

  useEffect(() => {
    if (!xrayReady) return;
    setTimeout(() => updateXray(0.5), 50);
  }, [xrayReady, updateXray]);

  useEffect(() => {
    if (!xrayReady) return;
    const viewport = xrayViewportRef.current;
    if (!viewport) return;
    const handler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const we = e as WheelEvent;
      const step = we.deltaY * 0.002;
      xrayPosRef.current = Math.max(0, Math.min(1, xrayPosRef.current + step));
      updateXray(xrayPosRef.current);
    };
    viewport.addEventListener("wheel", handler, { passive: false, capture: true });
    const blockTouch = (e: Event) => { e.preventDefault(); };
    viewport.addEventListener("touchmove", blockTouch, { passive: false });
    return () => {
      viewport.removeEventListener("wheel", handler, { capture: true } as EventListenerOptions);
      viewport.removeEventListener("touchmove", blockTouch);
    };
  }, [xrayReady, updateXray]);

  const toggleScanner = useCallback(() => {
    const next = !scannerOpen;
    setScannerOpen(next);
    if (next) {
      setTimeout(() => {
        const el = scannerSectionRef.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          window.scrollTo({ top: window.scrollY + rect.top - 80, behavior: "smooth" });
        }
      }, 100);
    }
  }, [scannerOpen]);

  const activeZone = selectedZone !== null ? zones[selectedZone] : null;

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div style={{ background: "#F8F7F4" }}>

      {/* ═══ 1. HERO ═══ */}
      {glbPath ? (
        <div className="relative w-full h-[85vh] grid grid-cols-1 md:grid-cols-2">
          {/* Back */}
          <div className="absolute top-6 left-6 md:left-12 z-20">
            <button onClick={onClose} className="flex items-center gap-2 group cursor-pointer">
              <div className="w-8 h-8 rounded-full flex items-center justify-center border border-[rgba(0,0,0,0.1)] bg-white/60 backdrop-blur-sm text-[#6B6860] group-hover:border-[#B8976A] group-hover:text-[#B8976A] transition-all">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              </div>
              <span className="text-[11px] tracking-[0.12em] uppercase text-[#6B6860] group-hover:text-[#B8976A] transition-colors" style={{ fontFamily: MONO }}>Back</span>
            </button>
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center order-2 md:order-1 px-6 md:px-16 lg:px-24 py-10 md:py-0">
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#B8976A] mb-4" style={{ fontFamily: MONO }}>{aircraft.category}</span>
            <h1 className="font-editorial font-light text-[#0F0F0D] leading-[1.02] mb-4" style={{ fontSize: "clamp(36px, 5vw, 68px)" }}>
              {aircraft.name}
            </h1>
            <p className="text-[14px] text-[#6B6860] leading-[1.75] mb-8 max-w-[380px]" style={{ fontFamily: MONO }}>
              {aircraft.description.length > 180 ? aircraft.description.slice(0, 180) + "..." : aircraft.description}
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 max-w-[360px]">
              {statsBar.map((s) => (
                <div key={s.key} className="border-t border-[rgba(184,151,106,0.15)] pt-3">
                  <div className="text-[#0F0F0D] text-[22px] font-light tabular-nums" style={{ fontFamily: MONO }}>{s.val}</div>
                  <div className="text-[9px] tracking-[0.2em] uppercase text-[#B8976A] opacity-70 mt-1" style={{ fontFamily: MONO }}>{s.key}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 3D */}
          <div className="relative order-1 md:order-2 h-[40vh] md:h-full bg-[#EFEDE8]">
            <Canvas camera={{ position: [0, 0.8, 8], fov: 45 }} gl={{ antialias: true, alpha: true }} style={{ width: "100%", height: "100%" }}>
              <ambientLight intensity={0.15} />
              <spotLight position={[0, 8, 4]} angle={0.35} penumbra={0.8} color="#FFF5E6" intensity={100} />
              <spotLight position={[-4, 3, 2]} color="#E8F0FF" intensity={45} />
              <spotLight position={[4, -2, 6]} color="#FFF5E6" intensity={25} />
              <Suspense fallback={null}>
                <AircraftModel modelPath={glbPath} />
                <Environment files="/hangar.hdr" />
              </Suspense>
              <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} maxPolarAngle={Math.PI / 1.8} minPolarAngle={Math.PI / 3} />
            </Canvas>
          </div>
        </div>
      ) : (
        <div className="relative w-full">
          {/* Back */}
          <div className="absolute top-6 left-6 md:left-12 z-20">
            <button onClick={onClose} className="flex items-center gap-2 group cursor-pointer">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-sm text-white/70 group-hover:bg-[#B8976A]/30 group-hover:text-[#C8A96E] transition-all">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              </div>
              <span className="text-[11px] tracking-[0.12em] uppercase text-white/70 group-hover:text-[#C8A96E] transition-colors" style={{ fontFamily: MONO }}>Back</span>
            </button>
          </div>

          {/* Photo Hero */}
          <div className="relative w-full h-[55vh] md:h-[65vh]">
            {hasPhotos ? (
              <img src={aircraft.photos[0].url} alt={aircraft.name} className="w-full h-full object-cover" draggable={false} />
            ) : (
              <div className="w-full h-full bg-[#EFEDE8] flex items-center justify-center">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" style={{ color: "rgba(0,0,0,0.1)" }}>
                  <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                </svg>
              </div>
            )}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(248,247,244,1) 0%, rgba(248,247,244,0.3) 40%, transparent 70%)" }} />
            <div className="absolute bottom-0 left-0 right-0 px-6 md:px-16 pb-8">
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#B8976A] mb-2 block" style={{ fontFamily: MONO }}>{aircraft.category}</span>
              <h1 className="font-editorial font-light text-[#0F0F0D] leading-[1.02]" style={{ fontSize: "clamp(36px, 5vw, 68px)" }}>
                {aircraft.name}
              </h1>
            </div>
          </div>

          {/* Info below photo */}
          <div className="px-6 md:px-16 pt-2 pb-8">
            <p className="text-[14px] text-[#6B6860] leading-[1.75] mb-8 max-w-[640px]" style={{ fontFamily: MONO }}>
              {aircraft.description}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 max-w-[700px]">
              {statsBar.map((s) => (
                <div key={s.key} className="border-t border-[rgba(184,151,106,0.15)] pt-3">
                  <div className="text-[#0F0F0D] text-[22px] font-light tabular-nums" style={{ fontFamily: MONO }}>{s.val}</div>
                  <div className="text-[9px] tracking-[0.2em] uppercase text-[#B8976A] opacity-70 mt-1" style={{ fontFamily: MONO }}>{s.key}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ 2. PRICE + FEATURES BAR ═══ */}
      <div className="px-6 md:px-16 py-8 border-t border-[rgba(0,0,0,0.06)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="text-[9px] tracking-[0.25em] uppercase text-[#A8A49E] mb-1" style={{ fontFamily: MONO }}>Asking Price</div>
            <div className="text-[32px] font-light tabular-nums" style={{ color: "#B8976A", fontFamily: MONO }}>
              {aircraft.pricing.showPrice ? formatPrice(aircraft.pricing.askingPrice) : "Price on Request"}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {features.filter(f => f.on).map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px]"
                style={{
                  background: "rgba(184,151,106,0.08)",
                  border: "1px solid rgba(184,151,106,0.2)",
                  color: "#B8976A",
                  fontFamily: MONO,
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                {f.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ 3. BLUEPRINT SPECS (always visible) ═══ */}
      <div className="px-6 md:px-16 py-12 border-t border-[rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="block w-6 h-px bg-[#B8976A] opacity-50" />
          <span className="text-[10px] tracking-[0.3em] uppercase text-[#A8A49E]" style={{ fontFamily: MONO }}>Technical Specifications</span>
          <span className="block w-6 h-px bg-[#B8976A] opacity-50" />
          <span className="text-[10px] tracking-[0.15em] text-[#A8A49E] ml-1" style={{ fontFamily: MONO }}>
            {bp.specGroups.reduce((s, g) => s + g.specs.length, 0)} specs
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[1000px] mx-auto">
          {bp.specGroups.map((group) => (
            <div key={group.title} className="rounded-xl p-6" style={{ background: "#EFEDE8" }}>
              <h4 className="flex items-center gap-2 mb-5">
                <span className="block w-4 h-px bg-[#B8976A] opacity-50" />
                <span className="text-[9px] tracking-[0.35em] uppercase text-[#B8976A]" style={{ fontFamily: MONO }}>{group.title}</span>
              </h4>
              {group.specs.map((spec) => (
                <div key={spec.key} className="flex justify-between items-baseline py-[10px] border-b border-[rgba(0,0,0,0.05)] last:border-b-0">
                  <span className="text-[12px] text-[#6B6860] tracking-[0.03em]" style={{ fontFamily: MONO }}>{spec.key}</span>
                  <span className="text-[14px] text-[#0F0F0D] tabular-nums" style={{ fontFamily: MONO }}>
                    {spec.val}
                    {spec.unit && <span className="text-[10px] text-[#A8A49E] ml-1.5">{spec.unit}</span>}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 mt-8 pt-4 border-t border-[rgba(184,151,106,0.1)] max-w-[1000px] mx-auto">
          <span className="text-[8px] tracking-[0.3em] uppercase text-[rgba(184,151,106,0.35)]" style={{ fontFamily: MONO }}>Spark Aviation</span>
          <span className="w-px h-3 bg-[rgba(184,151,106,0.15)]" />
          <span className="text-[8px] tracking-[0.3em] uppercase text-[rgba(184,151,106,0.35)]" style={{ fontFamily: MONO }}>DWG NO: SA-{bp.label}-001</span>
          <span className="w-px h-3 bg-[rgba(184,151,106,0.15)]" />
          <span className="text-[8px] tracking-[0.3em] uppercase text-[rgba(184,151,106,0.35)]" style={{ fontFamily: MONO }}>Scale: NTS</span>
        </div>
      </div>

      {/* ═══ 4. CABIN ZONES ═══ */}
      {zones.length > 0 && (
        <div className="px-6 md:px-16 py-12 border-t border-[rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3 mb-8">
            <span className="block w-6 h-px bg-[#B8976A] opacity-50" />
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#A8A49E]" style={{ fontFamily: MONO }}>Explore the Cabin</span>
          </div>

          {/* Zone cards — horizontal, 16:9, clean */}
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-1 px-1 snap-x">
            {zones.map((zone, i) => {
              const active = selectedZone === i;
              return (
                <button
                  key={zone.name}
                  onClick={() => setSelectedZone(active ? null : i)}
                  className="flex-shrink-0 cursor-pointer text-left relative rounded-xl overflow-hidden snap-start transition-all duration-300"
                  style={{
                    width: "clamp(280px, 32vw, 400px)",
                    border: active ? "2px solid #B8976A" : "2px solid transparent",
                  }}
                >
                  <div className="relative" style={{ aspectRatio: "16 / 10" }}>
                    <img src={zone.image} alt={zone.title} className="w-full h-full object-cover" draggable={false} />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)" }} />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="text-[9px] tracking-[0.2em] uppercase text-[#C8A96E] opacity-80 mb-1" style={{ fontFamily: MONO }}>{zone.name}</div>
                      <div className="font-editorial font-light text-white text-[17px] leading-tight">{zone.title}</div>
                    </div>
                    {active && <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, transparent, #C8A96E, transparent)" }} />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected zone detail */}
          {activeZone && (
            <div className="mt-6 rounded-xl overflow-hidden relative" style={{ aspectRatio: "21/9", minHeight: 300 }}>
              <img src={activeZone.image} alt={activeZone.title} className="w-full h-full object-cover" draggable={false} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.35) 50%, transparent 80%)" }} />
              {/* Close */}
              <button
                onClick={() => setSelectedZone(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-sm text-white/60 hover:text-[#C8A96E] transition-colors cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>

              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-end">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[#C8A96E] text-[11px] tracking-[0.25em] uppercase" style={{ fontFamily: MONO }}>
                        {String((selectedZone ?? 0) + 1).padStart(2, "0")} / {String(zones.length).padStart(2, "0")}
                      </span>
                      <span className="w-4 h-px bg-[#C8A96E] opacity-30 inline-block" />
                      <span className="text-[9px] tracking-[0.2em] uppercase text-white/30" style={{ fontFamily: MONO }}>{activeZone.name}</span>
                    </div>
                    <h3 className="font-editorial font-light text-white text-[28px] md:text-[36px] leading-[1.1] mb-2">{activeZone.title}</h3>
                    <p className="text-[13px] text-white/50 leading-[1.7] max-w-[500px]" style={{ fontFamily: MONO }}>{activeZone.desc}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 min-w-[200px]">
                    {activeZone.specs.map((s) => (
                      <div key={s.key} className="py-2 border-b border-white/5">
                        <div className="text-[9px] text-white/30 tracking-[0.08em] uppercase" style={{ fontFamily: MONO }}>{s.key}</div>
                        <div className="text-white text-[12px] mt-0.5" style={{ fontFamily: MONO }}>{s.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ 5. X-RAY SCANNER ═══ */}
      <div ref={scannerSectionRef} className="px-6 md:px-16 py-12 border-t border-[rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="block w-6 h-px bg-[#B8976A] opacity-50" />
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#A8A49E]" style={{ fontFamily: MONO }}>Interior X-Ray</span>
          </div>
          <button
            onClick={toggleScanner}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] cursor-pointer transition-all"
            style={{
              border: "1px solid rgba(184,151,106,0.3)",
              color: "#B8976A",
              fontFamily: MONO,
              background: scannerOpen ? "rgba(184,151,106,0.08)" : "transparent",
            }}
          >
            {scannerOpen ? "Close Scanner" : "Open Scanner"}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: scannerOpen ? "rotate(180deg)" : "none", transition: "transform 0.3s" }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        {!scannerOpen && (
          <div
            className="relative rounded-xl overflow-hidden cursor-pointer group"
            style={{ height: 120, background: "#EFEDE8" }}
            onClick={toggleScanner}
          >
            <img src={xrayExteriorSrc} alt="Aircraft top view" className="absolute inset-0 w-full h-full object-contain opacity-25 group-hover:opacity-40 transition-opacity" draggable={false} style={{ padding: "8%" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[12px] tracking-[0.15em] text-[#B8976A] opacity-60 group-hover:opacity-100 transition-opacity" style={{ fontFamily: MONO }}>
                Scroll to scan the cabin interior
              </span>
            </div>
          </div>
        )}

        {scannerOpen && (
          <div
            ref={xrayViewportRef}
            className="relative rounded-xl overflow-hidden"
            style={{ height: "clamp(350px, 55vh, 600px)", background: "#0a0b10", cursor: "default", userSelect: "none" }}
          >
            <div ref={xrayWrapRef} style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", width: "min(800px, 95%)" }}>
              <img ref={xrayExteriorRef} src={xrayExteriorSrc} alt="Exterior" style={{ width: "100%", display: "block" }} draggable={false} />
              <img ref={xrayInteriorRef} src={xrayInteriorSrc} alt="Interior" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", clipPath: "inset(0% 0 100% 0)", opacity: 0 }} draggable={false} />
            </div>
            <div ref={xrayLineTopRef} style={{ position: "absolute", left: "5%", right: "5%", height: "2px", background: "linear-gradient(90deg, transparent, #C8A96E, transparent)", opacity: 0, pointerEvents: "none", boxShadow: "0 0 16px rgba(200,169,110,0.5)", zIndex: 2 }} />
            <div ref={xrayLineBotRef} style={{ position: "absolute", left: "5%", right: "5%", height: "2px", background: "linear-gradient(90deg, transparent, #C8A96E, transparent)", opacity: 0, pointerEvents: "none", boxShadow: "0 0 16px rgba(200,169,110,0.5)", zIndex: 2 }} />
            <div className="absolute left-1/2 -translate-x-1/2 z-10 pointer-events-none" style={{ top: 12, opacity: xrayReady ? 0.3 : 0, transition: "opacity 0.5s" }}>
              <svg width="16" height="10" viewBox="0 0 16 10" fill="none"><path d="M1 9L8 2L15 9" stroke="#C8A96E" strokeWidth="1.5" /></svg>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 z-10 pointer-events-none" style={{ bottom: 12, opacity: xrayReady ? 0.3 : 0, transition: "opacity 0.5s" }}>
              <svg width="16" height="10" viewBox="0 0 16 10" fill="none"><path d="M1 1L8 8L15 1" stroke="#C8A96E" strokeWidth="1.5" /></svg>
            </div>
            {/* Scroll hint overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <span className="text-[10px] tracking-[0.15em] uppercase text-[#C8A96E] opacity-40" style={{ fontFamily: MONO }}>Scroll to scan</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
