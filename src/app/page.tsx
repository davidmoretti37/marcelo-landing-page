"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import IntroSplash from "@/components/IntroSplash";

const LenisProvider = dynamic(() => import("@/components/providers/LenisProvider"));
const NavBar = dynamic(() => import("@/components/sections/NavBar"));
const HeroSection = dynamic(() => import("@/components/sections/HeroSection"));
const ScrollProgress = dynamic(() => import("@/components/ui/ScrollProgress"));
const DescentSection = dynamic(() => import("@/components/sections/DescentSection"));
const GlobeSection = dynamic(() => import("@/components/sections/GlobeSection"));
const HangarSection = dynamic(() => import("@/components/sections/HangarSection"));
const ShowroomInline = dynamic(() => import("@/components/sections/ShowroomInline"));

export default function Home() {
  const [phase, setPhase] = useState(0);
  // phase 0: intro playing
  // phase 1: hero shell + nav + lenis (scrollable, no 3D)
  // phase 2: 3D clouds mount
  // phase 3: below-fold sections mount + film grain

  useEffect(() => {
    if (phase === 1) {
      // Give Lenis 1 frame to init, then mount SkyCanvas (it self-chunks)
      const t = setTimeout(() => setPhase(2), 50);
      return () => clearTimeout(t);
    }
    if (phase === 2) {
      // Give 3D a moment to start, then load below-fold
      const t = setTimeout(() => {
        setPhase(3);
        // grain effect removed
      }, 200);
      return () => clearTimeout(t);
    }
  }, [phase]);

  return (
    <>
      {phase === 0 && <IntroSplash onComplete={() => setPhase(1)} />}
      {phase >= 1 && (
        <LenisProvider>
          <main className="bg-[#F8F7F4] overflow-x-clip">
            <ScrollProgress />
            <NavBar />
            <HeroSection ready={phase >= 2} />
            {phase >= 3 && (
              <div className="relative z-10">
                <DescentSection />
                <GlobeSection />
                <HangarSection />
                <ShowroomInline />
              </div>
            )}
          </main>
        </LenisProvider>
      )}
    </>
  );
}
