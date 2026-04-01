/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ShinyText from "@/components/ui/ShinyText";

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection({ ready = false }: { ready?: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const scrollLineRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);

  // Intro fade-in + turbulence
  useEffect(() => {
    if (!ready) return;
    const frame = frameRef.current;
    if (!frame) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(frame, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out", delay: 0.2 });

      gsap.fromTo(scrollLineRef.current,
        { scaleY: 0 },
        { scaleY: 1, duration: 1.4, ease: "power1.inOut", yoyo: true, repeat: -1, transformOrigin: "top center", delay: 3.5 },
      );


    }, sectionRef);

    return () => ctx.revert();
  }, [ready]);

  // Scroll: zoom the frame, then fade it out — sky is always behind
  useEffect(() => {
    if (!ready) return;
    const frame = frameRef.current;
    const glass = glassRef.current;
    const spacer = spacerRef.current;
    if (!frame || !glass || !spacer) return;

    const trigger = ScrollTrigger.create({
      trigger: spacer,
      start: "top top",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;

        // Zoom the cabin frame: scale 1 → 3x
        const zoomP = Math.min(p / 0.5, 1);
        const scale = 1 + zoomP * 2;
        frame.style.transform = `scale(${scale})`;
        frame.style.transformOrigin = "50% 42%";

        // Fade out the frame + glass effects (p 0.25→0.45)
        const frameFade = p < 0.25 ? 1 : p > 0.45 ? 0 : 1 - (p - 0.25) / 0.2;
        frame.style.opacity = String(frameFade);

        // Fade out glass effects earlier (fog, droplets, drips)
        const glassFade = p < 0.15 ? 1 : p > 0.35 ? 0 : 1 - (p - 0.15) / 0.2;
        glass.style.opacity = String(glassFade);

        // Fade out scroll indicator quickly
        if (scrollLineRef.current) {
          const parent = scrollLineRef.current.parentElement;
          if (parent) {
            parent.style.opacity = String(Math.max(0, 1 - p * 5));
          }
        }
      },
    });

    return () => trigger.kill();
  }, [ready]);

  return (
    <>
      {/* Scroll spacer */}
      <div ref={spacerRef} className="h-[200dvh]" />
      <section
        ref={sectionRef}
        className="fixed inset-0 w-full h-[100dvh] overflow-hidden"
        role="banner"
      >
        {/* ===== SKY — always full-screen, always visible ===== */}
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          {/* Sky gradient */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom,
                #5a8abf 0%,
                #6a96c8 8%,
                #7aa4d2 16%,
                #8ab2da 26%,
                #98bfe0 36%,
                #a8cce6 46%,
                #b8d6ec 56%,
                #c8ddef 66%,
                #d4e4f2 76%,
                #dfe9f4 86%,
                #e8eff6 100%
              )`,
            }}
          />

          {/* Cloud floor */}
          <div
            className="absolute sky-cloud-floor"
            style={{
              left: 0,
              right: 0,
              top: "40%",
              bottom: 0,
              backgroundImage: "url(/cloud_upscaled.png)",
              backgroundSize: "100vw 100vw",
              backgroundRepeat: "repeat",
              opacity: 0.7,
              maskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.25) 18%, black 45%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.25) 18%, black 45%)",
            }}
          />

          {/* Cloud layer 2 */}
          <div
            className="absolute sky-cloud-floor-2"
            style={{
              left: 0,
              right: 0,
              top: "45%",
              bottom: 0,
              backgroundImage: "url(/cloud_upscaled.png)",
              backgroundSize: "75vw 75vw",
              backgroundRepeat: "repeat",
              opacity: 0.5,
              maskImage: "linear-gradient(to bottom, transparent 0%, black 30%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 30%)",
            }}
          />

          {/* Mid-sky clouds */}
          <div
            className="absolute sky-cloud-mid"
            style={{
              left: 0,
              right: 0,
              top: "15%",
              bottom: "30%",
              backgroundImage: "url(/cloud_upscaled.png)",
              backgroundSize: "55vw 55vw",
              backgroundRepeat: "repeat",
              opacity: 0.25,
            }}
          />

          {/* Wispy haze */}
          <div
            className="absolute inset-0 sky-cloud-wispy"
            style={{
              backgroundImage: "url(/cloud_upscaled.png)",
              backgroundSize: "40vw 40vw",
              backgroundRepeat: "repeat",
              opacity: 0.15,
            }}
          />

          {/* Warm horizon glow */}
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse 80% 50% at 50% 85%, rgba(240,210,170,0.12) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* ===== CABIN FRAME + GLASS (zooms + fades out, revealing sky) ===== */}
        <div
          ref={frameRef}
          className="absolute inset-0 will-change-transform"
          style={{ opacity: 0, zIndex: 1 }}
        >
          {/* Cabin window image */}
          <img
            src="/cabin-window.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
            style={{ zIndex: 2 }}
            draggable={false}
          />

          {/* Glass effects — fog, droplets, drips (fade out earlier) */}
          <div
            ref={glassRef}
            className="absolute"
            style={{
              zIndex: 3,
              top: "12%",
              left: "28%",
              width: "44%",
              height: "58%",
              borderRadius: "12% / 14%",
              overflow: "hidden",
              pointerEvents: "none",
            }}
          >
            {/* Water droplets */}
            <div className="absolute inset-0" style={{
              pointerEvents: "none",
              backgroundImage: `
                radial-gradient(1.5px 2.5px at 20% 25%, rgba(255,255,255,0.25) 0%, transparent 100%),
                radial-gradient(1px 3px at 45% 50%, rgba(255,255,255,0.18) 0%, transparent 100%),
                radial-gradient(2px 2px at 65% 20%, rgba(255,255,255,0.22) 0%, transparent 100%),
                radial-gradient(1.5px 2px at 80% 60%, rgba(255,255,255,0.18) 0%, transparent 100%),
                radial-gradient(1px 4px at 35% 70%, rgba(255,255,255,0.12) 0%, transparent 100%),
                radial-gradient(2px 3px at 10% 55%, rgba(255,255,255,0.18) 0%, transparent 100%),
                radial-gradient(1px 2px at 55% 85%, rgba(255,255,255,0.22) 0%, transparent 100%),
                radial-gradient(1.5px 1.5px at 75% 40%, rgba(255,255,255,0.15) 0%, transparent 100%),
                radial-gradient(2px 2.5px at 90% 30%, rgba(255,255,255,0.12) 0%, transparent 100%),
                radial-gradient(1px 3px at 30% 15%, rgba(255,255,255,0.18) 0%, transparent 100%)
              `,
            }} />

            {/* Condensation drips */}
            <div className="absolute inset-0 overflow-hidden" style={{ pointerEvents: "none" }}>
              <div className="hero-drip" style={{ position: "absolute", left: "18%", top: "-2%", width: 1, height: "4%", borderRadius: "50%/80%", background: "rgba(255,255,255,0.13)", animationDelay: "0s", animationDuration: "14s" }} />
              <div className="hero-drip" style={{ position: "absolute", left: "35%", top: "-3%", width: 1, height: "5%", borderRadius: "50%/80%", background: "rgba(255,255,255,0.1)", animationDelay: "4s", animationDuration: "18s" }} />
              <div className="hero-drip" style={{ position: "absolute", left: "58%", top: "-1%", width: 1, height: "3.5%", borderRadius: "50%/80%", background: "rgba(255,255,255,0.12)", animationDelay: "8s", animationDuration: "16s" }} />
              <div className="hero-drip" style={{ position: "absolute", left: "76%", top: "-2%", width: 1, height: "4.5%", borderRadius: "50%/80%", background: "rgba(255,255,255,0.09)", animationDelay: "2s", animationDuration: "20s" }} />
              <div className="hero-drip" style={{ position: "absolute", left: "45%", top: "-4%", width: 1, height: "6%", borderRadius: "50%/80%", background: "rgba(255,255,255,0.11)", animationDelay: "11s", animationDuration: "22s" }} />
              <div className="hero-drip" style={{ position: "absolute", left: "88%", top: "-1.5%", width: 1, height: "3%", borderRadius: "50%/80%", background: "rgba(255,255,255,0.1)", animationDelay: "6s", animationDuration: "15s" }} />
              <div className="hero-drip" style={{ position: "absolute", left: "10%", top: "-3%", width: 1, height: "5%", borderRadius: "50%/80%", background: "rgba(255,255,255,0.08)", animationDelay: "9s", animationDuration: "19s" }} />
            </div>
          </div>


          {/* Crystal logo — left side of cabin (desktop) / top-left (mobile) */}
          <div
            className="absolute flex items-center justify-center pointer-events-none"
            style={{
              left: "7%",
              top: "36%",
              transform: "translateY(-50%)",
              zIndex: 4,
              width: "clamp(60px, 10vw, 140px)",
            }}
          >
            <img
              src="/spark-crystal-logo.png"
              alt="Spark Aviation"
              className="w-full h-auto"
              style={{
                filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))",
              }}
              draggable={false}
            />
          </div>

          {/* Tagline — right side (desktop) / bottom-right (mobile) */}
          <div
            className="absolute flex flex-col pointer-events-none"
            style={{
              right: "3%",
              bottom: "22%",
              zIndex: 4,
            }}
          >
            <span
              className="font-sans font-extralight leading-[1.3]"
              style={{ fontSize: "clamp(20px, 3vw, 42px)", color: "#4a3a2a", letterSpacing: "0.35em" }}
            >
              SPARK
            </span>
            <span
              className="font-sans font-extralight leading-[1.3]"
              style={{ fontSize: "clamp(20px, 3vw, 42px)", color: "#4a3a2a", letterSpacing: "0.35em", paddingLeft: "2em" }}
            >
              JETS
            </span>
            <ShinyText
              text="Your Private Jet Broker"
              className="font-sans text-[9px] md:text-[11px] tracking-[0.25em] uppercase mt-3 md:mt-5"
              speed={3}
              delay={1}
              color="#8a7a6a"
              shineColor="#C8A96E"
              spread={120}
              direction="left"
            />
          </div>

          {/* Scroll indicator */}
          <div
            className="absolute z-20 pointer-events-none"
            style={{ bottom: 24, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
          >
            <div style={{ fontSize: 7, letterSpacing: "0.3em", color: "rgba(120,110,90,0.5)", textTransform: "uppercase", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
              SCROLL
            </div>
            <div
              ref={scrollLineRef}
              style={{ width: 1, height: 32, background: "rgba(184,151,106,0.4)", transformOrigin: "top center", transform: "scaleY(0)" }}
            />
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes sky-cloud-floor-drift { from { background-position: 0 0; } to { background-position: -100vw 0; } }
          @keyframes sky-cloud-floor-2-drift { from { background-position: 0 0; } to { background-position: -75vw 0; } }
          @keyframes sky-cloud-mid-drift { from { background-position: 0 0; } to { background-position: -55vw 0; } }
          @keyframes sky-cloud-wispy-drift { from { background-position: 0 0; } to { background-position: -40vw 0; } }
          .sky-cloud-floor { animation: sky-cloud-floor-drift 35s linear infinite; }
          .sky-cloud-floor-2 { animation: sky-cloud-floor-2-drift 45s linear infinite; }
          .sky-cloud-mid { animation: sky-cloud-mid-drift 55s linear infinite; }
          .sky-cloud-wispy { animation: sky-cloud-wispy-drift 70s linear infinite; }
          @keyframes hero-drip-fall {
            0% { transform: translateY(0); opacity: 0; }
            8% { opacity: 1; }
            90% { opacity: 0.4; }
            100% { transform: translateY(2000%); opacity: 0; }
          }
          .hero-drip { animation: hero-drip-fall 14s ease-in infinite; }
        `}} />
      </section>
    </>
  );
}
