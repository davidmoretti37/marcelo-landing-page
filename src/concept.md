# Spark Jets — Immersive Scroll Experience

## Vision
An igloo.inc-inspired website where the viewport stays static and content moves, shifts, zooms, and transforms as you scroll. Not a traditional website — a cinematic film you move through.

## Brand
- **Company**: Spark Jets
- **Founded by**: Marcelo Borin — Brazilian-American aviation veteran, 3 decades in cockpit, flew U.S. Presidents
- **Mission**: Aircraft Sales, Acquisition & Management
- **Tagline**: "Elevating Excellence in Aviation"
- **Stats**: 500+ Transactions | 44+ Countries | $2B+ In Deals
- **Offices**: Boca Raton (HQ), São Paulo, Dallas
- **Quote**: "I came to this country not knowing the language, but I knew how to serve, how to fly, and how to connect with people. That's what this company is built on: relationships, integrity, and a love for aviation."

## Design
- **Font**: Inter only (200–500 weights). Ultra-light for big headlines, light for body, medium for small labels.
- **Colors**: Cream base (#F8F7F4), dark text (#0C1220), gold accents (#B8976A). One dark section for aircraft showcase (#08090e).
- **Feel**: Clean, luxurious, generous whitespace, cinematic transitions.

## Scene Flow
1. **Opening** — 3D crystal logo + brand name reveal ("SPARK / JETS")
2. **Mission** — The Spark Story, founder background, stats
3. **Only Jets** — Bold typography statement + 3D plane enters
4. **Globe** — World clock + D3 globe with city markers
5. **Aircraft** — Dark section, 3D plane showcase, specs, model swap
6. **X-Ray Scanner** — Interior/exterior reveal (scroll-pinned)
7. **Contact** — Quote word-reveal + contact info + footer

## Tech Stack
- Next.js 14, TypeScript, Tailwind CSS
- GSAP + ScrollTrigger (scroll-driven pinned scenes)
- Lenis smooth scrolling
- React Three Fiber (shared 3D canvas)
- D3.js + TopoJSON (globe)

## Assets
- `public/airplane.glb` — Gulfstream G700 (Draco compressed, ~740KB)
- `public/airplane2.glb` — Embraer Praetor 600 (Draco compressed, ~6MB)
- `public/plane-top.png`, `public/plane-interior.png` — X-ray scanner images
- `public/crystal-logo.glb` — 3D crystal logo (Draco compressed, ~780KB)
- `public/hero.jpg`, `public/hero-video.mp4` — Hero assets (currently unused)
