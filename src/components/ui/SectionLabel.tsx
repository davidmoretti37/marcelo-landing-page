"use client";

const GOLD = "#B8976A";
const HUD = "var(--font-inter), system-ui, sans-serif";

export default function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
      <div style={{ width: 28, height: 1, background: GOLD }} />
      <span
        style={{
          fontFamily: HUD,
          fontSize: 10,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: GOLD,
        }}
      >
        {text}
      </span>
    </div>
  );
}
