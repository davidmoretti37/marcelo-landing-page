"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Showroom", href: "#showroom" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY >= 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center justify-between px-8 md:px-12"
        style={{
          backgroundColor: scrolled ? "rgba(248,247,244,0.9)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? "1px solid #EFEDE8" : "1px solid transparent",
          transition: "all 400ms ease",
        }}
      >
        {/* Logo */}
        <a
          href="#"
          className="font-sans font-semibold text-[13px] tracking-[0.25em] uppercase transition-colors duration-400"
          style={{ color: scrolled ? "#0F0F0D" : "#F5F2EC" }}
        >
          SPARK AVIATION
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="relative font-sans text-[12px] tracking-[0.12em] transition-colors duration-200 pb-1 group"
              style={{ color: scrolled ? "#6B6860" : "#8A8680" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = scrolled ? "#0F0F0D" : "#F5F2EC";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = scrolled ? "#6B6860" : "#8A8680";
              }}
            >
              {link.label}
              <span
                className="absolute bottom-0 left-0 w-full h-px origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                style={{ backgroundColor: scrolled ? "#0F0F0D" : "#F5F2EC" }}
              />
            </a>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={20} style={{ color: scrolled ? "#0F0F0D" : "#F5F2EC" }} />
        </button>
      </nav>

      {/* Mobile overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-[#F8F7F4] flex flex-col items-center justify-center"
          >
            <button
              className="absolute top-6 right-8"
              onClick={() => setMenuOpen(false)}
              aria-label="Close navigation menu"
            >
              <X size={24} className="text-[#0F0F0D]" />
            </button>

            <nav className="flex flex-col items-center gap-6">
              {NAV_LINKS.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="font-editorial text-[52px] font-light text-[#0F0F0D]"
                >
                  {link.label}
                </motion.a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
