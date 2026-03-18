"use client";

import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true as const, margin: "-100px" },
  transition: { duration: 0.7, ease: "easeOut" as const },
};

export default function ClosingCTA() {
  return (
    <section id="contact" className="bg-[#0F0F0D] py-24 md:py-40">
      <div className="max-w-3xl mx-auto px-8 text-center">
        <motion.p
          {...fadeUp}
          className="text-[11px] tracking-[0.3em] uppercase text-[#A8A49E] font-sans"
        >
          BEGIN YOUR ACQUISITION
        </motion.p>

        <motion.h2
          {...fadeUp}
          transition={{ delay: 0.12, duration: 0.7, ease: "easeOut" }}
          className="mt-4"
        >
          <span className="block font-editorial text-[48px] md:text-[72px] font-light text-[#F8F7F4] leading-[1.0]">
            The right aircraft exists.
          </span>
          <span className="block font-editorial text-[48px] md:text-[72px] font-light text-[#C8A96E] leading-[1.0]">
            Let&apos;s find it.
          </span>
        </motion.h2>

        <motion.p
          {...fadeUp}
          transition={{ delay: 0.24, duration: 0.7, ease: "easeOut" }}
          className="text-[16px] text-[#6B6860] mt-6 font-sans"
        >
          Every acquisition begins with a conversation.
        </motion.p>

        {/* Email input row */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.36, duration: 0.7, ease: "easeOut" }}
          className="mt-12 inline-flex items-center border-b border-[#6B6860] focus-within:border-[#F8F7F4] transition duration-300"
        >
          <input
            type="email"
            placeholder="your@email.com"
            className="bg-transparent text-[16px] text-[#F8F7F4] placeholder-[#4A4845] px-0 py-3 w-72 outline-none font-sans"
          />
          <button className="text-[12px] tracking-[0.2em] uppercase text-[#F8F7F4] ml-6 hover:text-[#C8A96E] transition font-sans whitespace-nowrap">
            INQUIRE →
          </button>
        </motion.div>

        {/* Divider */}
        <div className="mt-20 border-t border-[#2A2A28]" />

        {/* Footer */}
        <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[#4A4845] text-[12px] font-sans">
          <span>© 2026 Spark Aviation. All rights reserved.</span>
          <span>Boca Raton · São Paulo · Dallas</span>
          <span>Founded by Marcelo Borin</span>
        </div>
      </div>
    </section>
  );
}
