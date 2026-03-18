"use client";

import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.7, ease: "easeOut" as const },
};

export default function FounderSection() {
  return (
    <section id="about" className="bg-[#F8F7F4] py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          {/* Portrait */}
          <motion.div {...fadeUp} className="relative">
            <div className="aspect-[4/3] md:aspect-[3/4] bg-[#E8E5DF] flex items-center justify-center">
              <span className="text-[12px] tracking-wide text-[#A8A49E] font-sans">
                Marcelo Borin — Portrait
              </span>
            </div>
            {/* Offset frame */}
            <div className="absolute -bottom-3 -right-3 w-full h-full border border-[#C8A96E] -z-10" />
          </motion.div>

          {/* Copy */}
          <div>
            <motion.p
              {...fadeUp}
              className="text-[11px] tracking-[0.3em] uppercase text-[#A8A49E] font-sans"
            >
              THE SPARK STORY
            </motion.p>

            <motion.h2
              {...fadeUp}
              transition={{ delay: 0.12, duration: 0.7, ease: "easeOut" }}
              className="font-editorial text-[36px] md:text-[48px] font-normal leading-[1.15] text-[#0F0F0D] mt-4"
            >
              Three decades in the cockpit. Including the cockpit of Air Force
              One.
            </motion.h2>

            <motion.p
              {...fadeUp}
              transition={{ delay: 0.24, duration: 0.7, ease: "easeOut" }}
              className="text-[16px] text-[#6B6860] leading-[1.8] mt-6 font-sans"
            >
              Spark Aviation was born from a pilot&apos;s conviction that the
              aircraft transaction experience could be better — more personal,
              more informed, and built on genuine relationships.
            </motion.p>

            <motion.p
              {...fadeUp}
              transition={{ delay: 0.36, duration: 0.7, ease: "easeOut" }}
              className="text-[16px] text-[#6B6860] leading-[1.8] mt-4 font-sans"
            >
              Founded by Marcelo Borin, a Brazilian-American aviation veteran who
              spent three decades in the cockpit — including flying U.S.
              Presidents.
            </motion.p>

            {/* Pull quote */}
            <motion.blockquote
              {...fadeUp}
              transition={{ delay: 0.48, duration: 0.7, ease: "easeOut" }}
              className="mt-10 pl-6 border-l-[2px] border-[#C8A96E]"
            >
              <p className="font-editorial italic text-[22px] text-[#0F0F0D] leading-[1.6]">
                &ldquo;I came to this country not knowing the language, but I
                knew how to serve, how to fly, and how to connect with people.
                That&apos;s what this company is built on.&rdquo;
              </p>
              <cite className="block text-[12px] tracking-wide text-[#A8A49E] mt-3 font-sans not-italic">
                — Marcelo Borin, Founder
              </cite>
            </motion.blockquote>
          </div>
        </div>
      </div>
    </section>
  );
}
