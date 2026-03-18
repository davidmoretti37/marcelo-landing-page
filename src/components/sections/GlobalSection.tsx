"use client";

import { motion } from "framer-motion";

const offices = [
  {
    city: "Boca Raton",
    role: "Headquarters",
    description:
      "Our primary base of operations, serving clients across North America and coordinating global acquisitions.",
  },
  {
    city: "São Paulo",
    role: "LATAM Operations",
    description:
      "Connecting Latin American clients with the global market, with deep regional expertise and relationships.",
  },
  {
    city: "Dallas",
    role: "Southwest Hub",
    description:
      "Supporting the Southwest corridor with dedicated hangar partnerships and MRO coordination.",
  },
];

// Approximate SVG positions for each city on our minimal world map
const cityDots = [
  { cx: 175, cy: 148 }, // Boca Raton
  { cx: 215, cy: 225 }, // São Paulo
  { cx: 155, cy: 148 }, // Dallas
];

function WorldMap() {
  return (
    <svg viewBox="0 0 600 340" fill="none" className="w-full h-auto">
      {/* Simplified world map outlines */}
      {/* North America */}
      <path
        d="M80 60 Q90 55 120 58 Q140 52 155 60 Q170 55 185 62 Q195 58 200 65 L200 80 Q195 90 190 100 Q185 115 175 125 Q170 135 165 140 Q160 148 155 150 Q148 152 140 150 L130 145 Q120 140 115 135 Q105 125 100 115 Q95 105 90 95 Q85 85 82 75 Z"
        stroke="#D4D0C9" strokeWidth="0.5" fill="none"
      />
      {/* South America */}
      <path
        d="M155 160 Q165 158 175 165 Q185 170 195 180 Q205 195 215 210 Q220 225 218 240 Q215 255 210 265 Q200 275 195 270 Q188 260 185 250 Q180 235 178 220 Q175 205 168 195 Q162 185 158 175 Z"
        stroke="#D4D0C9" strokeWidth="0.5" fill="none"
      />
      {/* Europe */}
      <path
        d="M280 55 Q290 50 305 52 Q315 48 325 55 Q335 52 340 58 L342 70 Q338 80 330 85 Q320 90 310 88 Q300 90 290 85 Q285 78 282 68 Z"
        stroke="#D4D0C9" strokeWidth="0.5" fill="none"
      />
      {/* Africa */}
      <path
        d="M290 100 Q300 95 315 100 Q325 105 335 115 Q340 130 342 150 Q340 170 335 185 Q325 200 315 205 Q305 200 298 190 Q292 175 290 155 Q288 135 288 120 Z"
        stroke="#D4D0C9" strokeWidth="0.5" fill="none"
      />
      {/* Asia */}
      <path
        d="M350 45 Q370 40 400 42 Q430 38 460 45 Q490 42 510 50 L520 60 Q515 75 505 85 Q490 95 470 100 Q450 105 430 102 Q410 105 390 100 Q370 95 360 85 Q352 72 350 60 Z"
        stroke="#D4D0C9" strokeWidth="0.5" fill="none"
      />
      {/* Australia */}
      <path
        d="M470 200 Q485 195 505 198 Q520 202 530 212 Q535 225 530 235 Q520 242 505 240 Q490 242 478 235 Q472 225 470 212 Z"
        stroke="#D4D0C9" strokeWidth="0.5" fill="none"
      />

      {/* Pulse dots for office locations */}
      {cityDots.map((dot, i) => (
        <g key={i}>
          {/* Pulsing ring */}
          <circle cx={dot.cx} cy={dot.cy} r="3" fill="none" stroke="#C8A96E" strokeWidth="1">
            <animate
              attributeName="r"
              values="3;10"
              dur="2s"
              repeatCount="indefinite"
              begin={`${i * 0.5}s`}
            />
            <animate
              attributeName="opacity"
              values="1;0"
              dur="2s"
              repeatCount="indefinite"
              begin={`${i * 0.5}s`}
            />
          </circle>
          {/* Static dot */}
          <circle cx={dot.cx} cy={dot.cy} r="3" fill="#C8A96E" />
        </g>
      ))}
    </svg>
  );
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true as const, margin: "-100px" },
  transition: { duration: 0.7, ease: "easeOut" as const },
};

export default function GlobalSection() {
  return (
    <section className="bg-[#EFEDE8] py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          {/* Left: Offices */}
          <div>
            <motion.p
              {...fadeUp}
              className="text-[11px] tracking-[0.3em] uppercase text-[#A8A49E] font-sans"
            >
              GLOBAL PRESENCE
            </motion.p>
            <motion.h2
              {...fadeUp}
              transition={{ delay: 0.12, duration: 0.7, ease: "easeOut" }}
              className="font-editorial text-[40px] md:text-[48px] font-normal text-[#0F0F0D] mt-4 leading-[1.1]"
            >
              Three offices. Every continent.
            </motion.h2>

            <div className="mt-10 divide-y divide-[#D4D0C9]">
              {offices.map((office, i) => (
                <motion.div
                  key={office.city}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: 0.24 + i * 0.12, duration: 0.7, ease: "easeOut" }}
                  className="py-6"
                >
                  <div className="flex items-baseline gap-3">
                    <h3 className="font-editorial text-[28px] text-[#0F0F0D]">
                      {office.city}
                    </h3>
                    <span className="text-[10px] tracking-[0.25em] uppercase text-[#A8A49E] font-sans">
                      {office.role}
                    </span>
                  </div>
                  <p className="text-[14px] text-[#6B6860] leading-[1.7] mt-2 font-sans">
                    {office.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: World map */}
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
            className="aspect-video md:aspect-auto"
          >
            <WorldMap />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
