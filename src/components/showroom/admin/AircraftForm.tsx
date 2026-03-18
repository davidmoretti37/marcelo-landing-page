"use client";

import { useState, type CSSProperties } from "react";
import type {
  Aircraft,
  AircraftCategory,
  AircraftStatus,
  AircraftSpecs,
  AircraftPricing,
  AircraftFeatures,
} from "@/lib/showroom/types";
import PhotoUpload from "./PhotoUpload";

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: AircraftCategory[] = [
  "Very Light",
  "Light Jet",
  "Midsize",
  "Super Midsize",
  "Large Cabin",
  "Long Range",
  "Ultra Long Range",
  "VIP Airliner",
];

const STATUSES: AircraftStatus[] = ["available", "under_contract", "sold"];

const MANUFACTURERS = [
  "Gulfstream",
  "Bombardier",
  "Dassault",
  "Embraer",
  "Cessna",
  "Textron Aviation",
  "Honda",
  "Pilatus",
  "Boeing",
  "Airbus",
  "Other",
];

const LAVATORY_OPTIONS = [
  { value: "none", label: "None" },
  { value: "forward", label: "Forward" },
  { value: "aft", label: "Aft" },
  { value: "both", label: "Both" },
];

type FormData = Omit<Aircraft, "id" | "createdAt" | "updatedAt">;

interface AircraftFormProps {
  aircraft?: Aircraft;
  onSave: (data: FormData) => void;
  onCancel: () => void;
}

// ── Default empty form ───────────────────────────────────────────────────────

function emptyForm(): FormData {
  return {
    name: "",
    manufacturer: "",
    model: "",
    year: new Date().getFullYear(),
    category: "Midsize",
    serialNumber: "",
    description: "",
    photos: [],
    specs: {},
    pricing: { askingPrice: 0, showPrice: true },
    features: {
      standupCabin: false,
      flatBerthing: false,
      fullGalley: false,
      wifi: false,
      entertainment: false,
      lavatory: "none",
      baggageAccessible: false,
      freshInterior: false,
      freshPaint: false,
      engineProgramEnrolled: false,
    },
    status: "available",
  };
}

function aircraftToForm(ac: Aircraft): FormData {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, updatedAt, ...rest } = ac;
  return rest;
}

// ── Shared styles ────────────────────────────────────────────────────────────

const panelStyle: CSSProperties = {
  background: "var(--sr-surface)",
  border: "1px solid var(--sr-border)",
  padding: "24px",
  marginBottom: "24px",
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "10px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.2em",
  color: "var(--sr-text-dim)",
  marginBottom: "6px",
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: "13px",
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
  background: "var(--sr-bg)",
  border: "1px solid var(--sr-border)",
  color: "var(--sr-text)",
  outline: "none",
  transition: "border-color 0.2s ease",
};

const sectionTitleStyle: CSSProperties = {
  fontSize: "14px",
  fontWeight: 500,
  fontFamily: "var(--font-playfair), Georgia, serif",
  color: "var(--sr-text)",
  marginBottom: "20px",
  paddingBottom: "10px",
  borderBottom: "1px solid var(--sr-border)",
};

const gridStyle = (cols: number): CSSProperties => ({
  display: "grid",
  gridTemplateColumns: `repeat(${cols}, 1fr)`,
  gap: "16px",
});

function focusBorder(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = "var(--sr-gold-dim)";
}

function blurBorder(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = "var(--sr-border)";
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AircraftForm({
  aircraft,
  onSave,
  onCancel,
}: AircraftFormProps) {
  const [form, setForm] = useState<FormData>(
    aircraft ? aircraftToForm(aircraft) : emptyForm()
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!aircraft;

  // ── Field updaters ─────────────────────────────────────────────────────────

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const setSpec = <K extends keyof AircraftSpecs>(key: K, value: AircraftSpecs[K]) => {
    setForm((prev) => ({ ...prev, specs: { ...prev.specs, [key]: value } }));
  };

  const setPricing = <K extends keyof AircraftPricing>(key: K, value: AircraftPricing[K]) => {
    setForm((prev) => ({ ...prev, pricing: { ...prev.pricing, [key]: value } }));
  };

  const setFeature = <K extends keyof AircraftFeatures>(key: K, value: AircraftFeatures[K]) => {
    setForm((prev) => ({ ...prev, features: { ...prev.features, [key]: value } }));
  };

  // ── Validation & Submit ────────────────────────────────────────────────────

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.manufacturer) errs.manufacturer = "Manufacturer is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(form);
  };

  // ── Helpers for number spec inputs ─────────────────────────────────────────

  const numInput = (
    label: string,
    specKey: keyof AircraftSpecs,
    opts?: { step?: string; suffix?: string }
  ) => (
    <div>
      <label style={labelStyle}>
        {label}
        {opts?.suffix && (
          <span style={{ color: "var(--sr-text-dim)", fontWeight: 400 }}>
            {" "}({opts.suffix})
          </span>
        )}
      </label>
      <input
        type="number"
        value={form.specs[specKey] ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          setSpec(specKey, v === "" ? undefined : Number(v));
        }}
        step={opts?.step ?? "1"}
        style={{
          ...inputStyle,
          fontFamily: "var(--font-jetbrains), monospace",
          fontSize: "12px",
        }}
        onFocus={focusBorder}
        onBlur={blurBorder}
      />
    </div>
  );

  const textSpecInput = (label: string, specKey: keyof AircraftSpecs) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type="text"
        value={(form.specs[specKey] as string) ?? ""}
        onChange={(e) =>
          setSpec(specKey, e.target.value || undefined)
        }
        style={inputStyle}
        onFocus={focusBorder}
        onBlur={blurBorder}
      />
    </div>
  );

  const toggle = (
    label: string,
    featureKey: keyof Omit<AircraftFeatures, "lavatory">,
  ) => (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        cursor: "pointer",
        padding: "8px 0",
        fontSize: "13px",
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
        color: "var(--sr-text-muted)",
      }}
    >
      <div
        onClick={() => setFeature(featureKey, !form.features[featureKey])}
        style={{
          width: "36px",
          height: "20px",
          borderRadius: "10px",
          background: form.features[featureKey]
            ? "var(--sr-gold)"
            : "var(--sr-surface-hover)",
          border: `1px solid ${
            form.features[featureKey]
              ? "var(--sr-gold)"
              : "var(--sr-border)"
          }`,
          position: "relative",
          transition: "all 0.2s ease",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            background: form.features[featureKey]
              ? "#0a0a0f"
              : "var(--sr-text-dim)",
            position: "absolute",
            top: "2px",
            left: form.features[featureKey] ? "18px" : "2px",
            transition: "all 0.2s ease",
          }}
        />
      </div>
      {label}
    </label>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit}>
      {/* ── Basic Info ─────────────────────────────────────────────────────── */}
      <div style={panelStyle}>
        <h3 style={sectionTitleStyle}>Basic Information</h3>
        <div style={gridStyle(3)}>
          {/* Name */}
          <div style={{ gridColumn: "span 2" }}>
            <label style={labelStyle}>Aircraft Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. 2019 Gulfstream G650ER"
              style={{
                ...inputStyle,
                borderColor: errors.name ? "rgba(220, 80, 80, 0.6)" : undefined,
              }}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
            {errors.name && (
              <span style={{ fontSize: "11px", color: "rgba(220, 80, 80, 0.8)", marginTop: "4px", display: "block" }}>
                {errors.name}
              </span>
            )}
          </div>

          {/* Year */}
          <div>
            <label style={labelStyle}>Year</label>
            <input
              type="number"
              value={form.year}
              onChange={(e) => set("year", Number(e.target.value))}
              style={{
                ...inputStyle,
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: "12px",
              }}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </div>

          {/* Manufacturer */}
          <div>
            <label style={labelStyle}>Manufacturer *</label>
            <select
              value={form.manufacturer}
              onChange={(e) => set("manufacturer", e.target.value)}
              style={{
                ...inputStyle,
                borderColor: errors.manufacturer ? "rgba(220, 80, 80, 0.6)" : undefined,
                cursor: "pointer",
              }}
              onFocus={focusBorder as unknown as React.FocusEventHandler<HTMLSelectElement>}
              onBlur={blurBorder as unknown as React.FocusEventHandler<HTMLSelectElement>}
            >
              <option value="">Select manufacturer...</option>
              {MANUFACTURERS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            {errors.manufacturer && (
              <span style={{ fontSize: "11px", color: "rgba(220, 80, 80, 0.8)", marginTop: "4px", display: "block" }}>
                {errors.manufacturer}
              </span>
            )}
          </div>

          {/* Model */}
          <div>
            <label style={labelStyle}>Model</label>
            <input
              type="text"
              value={form.model}
              onChange={(e) => set("model", e.target.value)}
              placeholder="e.g. G650ER"
              style={inputStyle}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle}>Category</label>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value as AircraftCategory)}
              style={{ ...inputStyle, cursor: "pointer" }}
              onFocus={focusBorder as unknown as React.FocusEventHandler<HTMLSelectElement>}
              onBlur={blurBorder as unknown as React.FocusEventHandler<HTMLSelectElement>}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Serial Number */}
          <div>
            <label style={labelStyle}>Serial Number</label>
            <input
              type="text"
              value={form.serialNumber}
              onChange={(e) => set("serialNumber", e.target.value)}
              style={{
                ...inputStyle,
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: "12px",
              }}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </div>

          {/* Status */}
          <div>
            <label style={labelStyle}>Status</label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value as AircraftStatus)}
              style={{ ...inputStyle, cursor: "pointer" }}
              onFocus={focusBorder as unknown as React.FocusEventHandler<HTMLSelectElement>}
              onBlur={blurBorder as unknown as React.FocusEventHandler<HTMLSelectElement>}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === "under_contract" ? "Under Contract" : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Description ────────────────────────────────────────────────────── */}
      <div style={panelStyle}>
        <h3 style={sectionTitleStyle}>Description</h3>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Detailed aircraft description..."
          rows={5}
          style={{
            ...inputStyle,
            resize: "vertical",
            lineHeight: "1.6",
          }}
          onFocus={focusBorder as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
          onBlur={blurBorder as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
        />
      </div>

      {/* ── Photos ─────────────────────────────────────────────────────────── */}
      <div style={panelStyle}>
        <h3 style={sectionTitleStyle}>Photos</h3>
        <PhotoUpload
          photos={form.photos}
          onChange={(photos) => set("photos", photos)}
        />
      </div>

      {/* ── Specs ──────────────────────────────────────────────────────────── */}
      <div style={panelStyle}>
        <h3 style={sectionTitleStyle}>Specifications</h3>

        {/* Performance */}
        <p style={{ ...labelStyle, marginBottom: "12px", color: "var(--sr-gold-dim)", fontSize: "9px" }}>
          Performance
        </p>
        <div style={{ ...gridStyle(4), marginBottom: "24px" }}>
          {numInput("Range", "range_nm", { suffix: "NM" })}
          {numInput("Max Passengers", "maxPassengers")}
          {numInput("Cruise Speed", "cruiseSpeed_ktas", { suffix: "KTAS" })}
          {numInput("Max Speed", "maxSpeed_mmo", { step: "0.001", suffix: "Mmo" })}
          {numInput("Ceiling", "ceiling_ft", { suffix: "ft" })}
          {numInput("Takeoff Distance", "takeoffDistance_ft", { suffix: "ft" })}
          {numInput("Landing Distance", "landingDistance_ft", { suffix: "ft" })}
          {numInput("Baggage", "baggage_cuft", { suffix: "cu ft" })}
        </div>

        {/* Cabin */}
        <p style={{ ...labelStyle, marginBottom: "12px", color: "var(--sr-gold-dim)", fontSize: "9px" }}>
          Cabin Dimensions
        </p>
        <div style={{ ...gridStyle(3), marginBottom: "24px" }}>
          {numInput("Length", "cabinLength_ft", { step: "0.01", suffix: "ft" })}
          {numInput("Width", "cabinWidth_ft", { step: "0.01", suffix: "ft" })}
          {numInput("Height", "cabinHeight_ft", { step: "0.01", suffix: "ft" })}
        </div>

        {/* Maintenance */}
        <p style={{ ...labelStyle, marginBottom: "12px", color: "var(--sr-gold-dim)", fontSize: "9px" }}>
          Maintenance & History
        </p>
        <div style={gridStyle(4)}>
          {numInput("Total Time", "totalTime_hrs", { suffix: "hrs" })}
          {numInput("Landings", "landings")}
          {textSpecInput("Engine Program", "engineProgram")}
          {textSpecInput("Engines", "engines")}
          {textSpecInput("Avionics", "avionics")}
          {textSpecInput("Interior Refurb", "interiorRefurb")}
          {textSpecInput("Paint Date", "paintDate")}
        </div>
      </div>

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <div style={panelStyle}>
        <h3 style={sectionTitleStyle}>Pricing</h3>
        <div style={{ ...gridStyle(2), alignItems: "end" }}>
          <div>
            <label style={labelStyle}>Asking Price (USD)</label>
            <input
              type="text"
              value={
                form.pricing.askingPrice
                  ? new Intl.NumberFormat("en-US").format(form.pricing.askingPrice)
                  : ""
              }
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                setPricing("askingPrice", raw ? Number(raw) : 0);
              }}
              placeholder="0"
              style={{
                ...inputStyle,
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: "14px",
              }}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </div>
          <div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                padding: "10px 0",
                fontSize: "13px",
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                color: "var(--sr-text-muted)",
              }}
            >
              <div
                onClick={() => setPricing("showPrice", !form.pricing.showPrice)}
                style={{
                  width: "36px",
                  height: "20px",
                  borderRadius: "10px",
                  background: form.pricing.showPrice
                    ? "var(--sr-gold)"
                    : "var(--sr-surface-hover)",
                  border: `1px solid ${
                    form.pricing.showPrice ? "var(--sr-gold)" : "var(--sr-border)"
                  }`,
                  position: "relative",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    background: form.pricing.showPrice
                      ? "#0a0a0f"
                      : "var(--sr-text-dim)",
                    position: "absolute",
                    top: "2px",
                    left: form.pricing.showPrice ? "18px" : "2px",
                    transition: "all 0.2s ease",
                  }}
                />
              </div>
              Show Price Publicly
            </label>
          </div>
        </div>
      </div>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <div style={panelStyle}>
        <h3 style={sectionTitleStyle}>Features</h3>
        <div style={gridStyle(3)}>
          {toggle("Stand-up Cabin", "standupCabin")}
          {toggle("Flat Floor Berthing", "flatBerthing")}
          {toggle("Full Galley", "fullGalley")}
          {toggle("Wi-Fi", "wifi")}
          {toggle("Entertainment System", "entertainment")}
          {toggle("In-Flight Baggage Access", "baggageAccessible")}
          {toggle("Fresh Interior", "freshInterior")}
          {toggle("Fresh Paint", "freshPaint")}
          {toggle("Engine Program Enrolled", "engineProgramEnrolled")}

          {/* Lavatory dropdown */}
          <div>
            <label style={labelStyle}>Lavatory</label>
            <select
              value={form.features.lavatory}
              onChange={(e) => setFeature("lavatory", e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
              onFocus={focusBorder as unknown as React.FocusEventHandler<HTMLSelectElement>}
              onBlur={blurBorder as unknown as React.FocusEventHandler<HTMLSelectElement>}
            >
              {LAVATORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Actions ────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
          paddingTop: "8px",
          paddingBottom: "40px",
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "12px 32px",
            fontSize: "12px",
            fontWeight: 600,
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            background: "transparent",
            border: "1px solid var(--sr-border)",
            color: "var(--sr-text-muted)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--sr-text-dim)";
            e.currentTarget.style.color = "var(--sr-text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--sr-border)";
            e.currentTarget.style.color = "var(--sr-text-muted)";
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{
            padding: "12px 40px",
            fontSize: "12px",
            fontWeight: 600,
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            background: "var(--sr-gold)",
            border: "1px solid var(--sr-gold)",
            color: "#0a0a0f",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--sr-gold-light)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--sr-gold)";
          }}
        >
          {isEdit ? "Update Aircraft" : "Add Aircraft"}
        </button>
      </div>
    </form>
  );
}
