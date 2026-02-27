"use client";

import PlaneCanvas, { PlaneProvider } from "@/components/three/PlaneCanvas";
import StoryOverlay from "@/components/story/StoryOverlay";
import StoryScroll from "@/components/story/StoryScroll";

/*
  One continuous 3D world.
  PlaneCanvas: position:fixed, z-index:0 — the entire 3D scene (sky, clouds, stars, globe, plane)
  StoryOverlay: position:fixed, z-index:10 — HTML text that slides in/out
  StoryScroll: tall div that drives the GSAP timeline via ScrollTrigger
*/
export default function Home() {
  return (
    <PlaneProvider>
      <PlaneCanvas />
      <StoryOverlay />
      <StoryScroll />
    </PlaneProvider>
  );
}
