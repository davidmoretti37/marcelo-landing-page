"use client";

import HeroSection from "@/components/sections/HeroSection";
import MissionSection from "@/components/sections/MissionSection";
import HistorySection from "@/components/sections/HistorySection";
import FleetSection from "@/components/sections/FleetSection";
import ContactSection from "@/components/sections/ContactSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <MissionSection />
      <HistorySection />
      <FleetSection />
      <ContactSection />
    </>
  );
}
