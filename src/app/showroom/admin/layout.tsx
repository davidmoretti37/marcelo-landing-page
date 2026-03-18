"use client";

import { useState, useEffect, type ReactNode } from "react";

const ADMIN_AUTH_KEY = "sparkjets_admin_authed";

function AdminLogin({ onAuth }: { onAuth: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder auth — replace with real check later
    if (password === "sparkjets2024") {
      sessionStorage.setItem(ADMIN_AUTH_KEY, "true");
      onAuth();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8">
      <div className="flex flex-col items-center gap-2">
        <h1
          className="text-2xl font-medium tracking-tight"
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            color: "var(--sr-text)",
          }}
        >
          Admin Access
        </h1>
        <p
          className="text-xs uppercase tracking-[0.25em]"
          style={{ color: "var(--sr-text-dim)" }}
        >
          Authorized Personnel Only
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 w-72">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          className="w-full px-4 py-3 text-sm outline-none transition-all duration-200"
          style={{
            background: "var(--sr-surface)",
            border: error
              ? "1px solid rgba(220, 80, 80, 0.6)"
              : "1px solid var(--sr-border)",
            color: "var(--sr-text)",
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          }}
          onFocus={(e) => {
            if (!error) e.currentTarget.style.borderColor = "var(--sr-gold-dim)";
          }}
          onBlur={(e) => {
            if (!error) e.currentTarget.style.borderColor = "var(--sr-border)";
          }}
          autoFocus
        />
        <button
          type="submit"
          className="w-full px-4 py-3 text-xs uppercase tracking-[0.2em] font-semibold transition-all duration-200"
          style={{
            background: "var(--sr-gold)",
            color: "#0a0a0f",
            border: "none",
            cursor: "pointer",
          }}
        >
          Authenticate
        </button>
        {error && (
          <p className="text-xs" style={{ color: "rgba(220, 80, 80, 0.8)" }}>
            Invalid password
          </p>
        )}
      </form>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_AUTH_KEY);
    setAuthed(stored === "true");
    setChecking(false);
  }, []);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="text-xs uppercase tracking-[0.25em]"
          style={{ color: "var(--sr-text-dim)" }}
        >
          Verifying...
        </div>
      </div>
    );
  }

  if (!authed) {
    return <AdminLogin onAuth={() => setAuthed(true)} />;
  }

  return <>{children}</>;
}
