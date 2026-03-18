"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface Stat {
  target: number;
  prefix?: string;
  suffix: string;
  label: string;
}

const stats: Stat[] = [
  { prefix: "$", target: 2, suffix: "B+", label: "In Global Transactions" },
  { target: 44, suffix: "+", label: "Countries Served" },
  { target: 30, suffix: "+", label: "Years in the Cockpit" },
];

function CountUp({ target, prefix, suffix, inView }: { target: number; prefix?: string; suffix: string; inView: boolean }) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!inView || hasAnimated.current) return;
    hasAnimated.current = true;

    const duration = 1500;
    const steps = 40;
    const increment = target / steps;
    const stepTime = duration / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), target);
      setCount(current);
      if (step >= steps) clearInterval(timer);
    }, stepTime);

    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span>
      {prefix}
      {count}
      {suffix}
    </span>
  );
}

export default function CredentialBar() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="bg-[#EFEDE8] py-16 md:py-20">
      <div className="max-w-5xl mx-auto px-8">
        {/* Desktop: row with dividers */}
        <div className="hidden md:flex justify-between divide-x divide-[#D4D0C9]">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.12, duration: 0.7, ease: "easeOut" }}
              className="text-center px-12 flex-1"
            >
              <p className="font-editorial text-[72px] font-light text-[#0F0F0D] leading-none">
                <CountUp target={stat.target} prefix={stat.prefix} suffix={stat.suffix} inView={inView} />
              </p>
              <p className="text-[11px] font-medium tracking-[0.25em] uppercase text-[#A8A49E] mt-3 font-sans">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Mobile: column with horizontal rules */}
        <div className="md:hidden flex flex-col divide-y divide-[#D4D0C9]">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.12, duration: 0.7, ease: "easeOut" }}
              className="text-center py-6"
            >
              <p className="font-editorial text-[72px] font-light text-[#0F0F0D] leading-none">
                <CountUp target={stat.target} prefix={stat.prefix} suffix={stat.suffix} inView={inView} />
              </p>
              <p className="text-[11px] font-medium tracking-[0.25em] uppercase text-[#A8A49E] mt-3 font-sans">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
