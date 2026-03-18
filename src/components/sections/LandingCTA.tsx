"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";

gsap.registerPlugin(ScrollTrigger);

interface FormState {
  email: string;
  status: "idle" | "loading" | "success" | "error";
  errorMessage: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LandingCTA() {
  const headlineRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [form, setForm] = useState<FormState>({
    email: "",
    status: "idle",
    errorMessage: "",
  });

  // SplitType headline animation
  useEffect(() => {
    if (!headlineRef.current) return;
    let split: InstanceType<typeof SplitType> | null = null;
    const ctx = gsap.context(() => {
      split = new SplitType(headlineRef.current!, { types: "chars,words" });
      if (!split.chars?.length) return;
      gsap.from(split.chars, {
        y: "100%",
        opacity: 0,
        duration: 0.9,
        stagger: 0.02,
        ease: "power3.out",
        scrollTrigger: {
          trigger: headlineRef.current,
          start: "top 80%",
          once: true,
        },
      });
    }, headlineRef);
    return () => {
      split?.revert();
      ctx.revert();
    };
  }, []);

  // Description text — scroll-scrubbed word reveal
  useEffect(() => {
    if (!descRef.current) return;
    let split: InstanceType<typeof SplitType> | null = null;
    const ctx = gsap.context(() => {
      split = new SplitType(descRef.current!, { types: "words" });
      if (!split.words?.length) return;
      gsap.from(split.words, {
        opacity: 0.15,
        y: 8,
        stagger: 0.03,
        ease: "none",
        scrollTrigger: {
          trigger: descRef.current,
          start: "top 85%",
          end: "top 50%",
          scrub: 0.5,
        },
      });
    }, descRef);
    return () => {
      split?.revert();
      ctx.revert();
    };
  }, []);

  // Magnetic button effect (pointer: fine only)
  useEffect(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const handleMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const dx = e.clientX - rect.left - rect.width / 2;
      const dy = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, { x: dx * 0.3, y: dy * 0.3, duration: 0.3, ease: "power2.out" });
    };

    const handleLeave = () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
    };

    btn.addEventListener("mousemove", handleMove);
    btn.addEventListener("mouseleave", handleLeave);
    return () => {
      btn.removeEventListener("mousemove", handleMove);
      btn.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(form.email)) {
      setForm((f) => ({ ...f, status: "error", errorMessage: "Please enter a valid email address." }));
      return;
    }
    setForm((f) => ({ ...f, status: "loading" }));
    try {
      // Simulate API call
      console.log("Contact:", form.email);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setForm((f) => ({ ...f, status: "success" }));
    } catch {
      setForm((f) => ({ ...f, status: "error", errorMessage: "Something went wrong. Please try again." }));
    }
  }

  return (
    <section id="contact" className="min-h-[100vh] bg-[#080806] flex flex-col justify-between py-20 md:py-32 px-8 md:px-16">
      {/* Top section */}
      <div className="max-w-7xl mx-auto w-full">
        <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-[#A8A49E]">
          BEGIN YOUR ACQUISITION
        </p>

        <div ref={headlineRef} className="mt-6">
          <h2
            className="font-editorial font-light text-white leading-[0.95]"
            style={{ fontSize: "clamp(52px, 8vw, 108px)" }}
          >
            The right aircraft
          </h2>
          <h2
            className="font-editorial font-light text-[#C8A96E] leading-[0.95]"
            style={{ fontSize: "clamp(52px, 8vw, 108px)" }}
          >
            exists.
          </h2>
        </div>

        <p
          ref={descRef}
          className="font-sans text-[16px] text-[#6B6860] leading-[1.7] mt-10 max-w-md"
        >
          Tell us about your mission. Our team of aviation specialists will match you with the perfect aircraft — discreetly and efficiently.
        </p>

        {/* Contact form */}
        <form onSubmit={handleSubmit} noValidate className="mt-14 max-w-lg">
          <div className="flex items-end gap-0 border-b border-[#2A2A28]">
            {form.status !== "success" ? (
              <>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm((f) => ({ ...f, email: e.target.value, status: "idle", errorMessage: "" }))
                  }
                  placeholder="your@email.com"
                  aria-label="Email address"
                  className="bg-transparent text-white font-sans text-[15px] flex-1 outline-none py-4 placeholder:text-[#3A3A38]"
                  disabled={form.status === "loading"}
                />
                <button
                  ref={buttonRef}
                  type="submit"
                  disabled={form.status === "loading"}
                  aria-label="Submit inquiry"
                  className="font-sans text-[11px] tracking-[0.2em] uppercase text-[#A8A49E] hover:text-[#C8A96E] transition-colors duration-200 py-4 pl-4 disabled:opacity-50 disabled:cursor-not-allowed will-change-transform"
                >
                  {form.status === "loading" ? "..." : "SEND \u2192"}
                </button>
              </>
            ) : (
              <p className="text-[#C8A96E] font-sans text-[14px] py-4">
                Thank you. We&apos;ll be in touch within 24 hours.
              </p>
            )}
          </div>

          {form.status === "error" && (
            <p role="alert" className="mt-2 text-[11px] text-red-400/70 font-sans">
              {form.errorMessage}
            </p>
          )}

          {form.status === "idle" && (
            <p className="mt-3 font-sans text-[11px] text-[#2A2A28]">
              We respond within 24 hours.
            </p>
          )}
        </form>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto w-full border-t border-[#1A1A18] pt-8 mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="font-sans text-[11px] tracking-[0.25em] uppercase text-[#4A4845]">
              SPARK AVIATION
            </p>
            <p className="font-sans text-[11px] text-[#2A2A28] mt-1">
              &copy; 2025 All rights reserved.
            </p>
          </div>
          <p className="font-sans text-[11px] tracking-[0.12em] text-[#3A3A38]">
            Boca Raton · São Paulo · Dallas
          </p>
          <p className="font-sans text-[11px] text-[#3A3A38]">
            Founded by Marcelo Borin
          </p>
        </div>
      </div>
    </section>
  );
}
