"use client";

import { useEffect, useState } from "react";
import type { Aircraft } from "@/lib/showroom/types";
import {
  useInventory,
  create,
  update,
  remove,
  getStorageUsage,
  seedDemoData,
} from "@/lib/showroom/store";
import InventoryTable from "@/components/showroom/admin/InventoryTable";
import AircraftForm from "@/components/showroom/admin/AircraftForm";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function AdminDashboard() {
  const { aircraft, loading } = useInventory();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [storageBytes, setStorageBytes] = useState(0);

  // Seed demo data on first mount
  useEffect(() => {
    seedDemoData();
  }, []);

  // Track storage usage
  useEffect(() => {
    setStorageBytes(getStorageUsage());
  }, [aircraft]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSave = (
    data: Omit<Aircraft, "id" | "createdAt" | "updatedAt">
  ) => {
    if (editingId === "new") {
      create(data);
    } else if (editingId) {
      update(editingId, data);
    }
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    remove(id);
  };

  // ── Determine mode ─────────────────────────────────────────────────────────

  const editingAircraft =
    editingId && editingId !== "new"
      ? aircraft.find((ac) => ac.id === editingId)
      : undefined;

  const isFormView = editingId !== null;

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.25em",
            color: "var(--sr-text-dim)",
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          }}
        >
          Loading inventory...
        </span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "32px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 500,
              fontFamily: "var(--font-playfair), Georgia, serif",
              color: "var(--sr-text)",
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            Fleet Management
          </h1>
          <p
            style={{
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.25em",
              color: "var(--sr-text-dim)",
              marginTop: "6px",
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            }}
          >
            {aircraft.length} aircraft &middot; {formatBytes(storageBytes)} used
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {isFormView ? (
            <button
              onClick={() => setEditingId(null)}
              style={{
                padding: "10px 24px",
                fontSize: "11px",
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
            >
              Back to List
            </button>
          ) : (
            <button
              onClick={() => setEditingId("new")}
              style={{
                padding: "10px 24px",
                fontSize: "11px",
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
            >
              Add Aircraft
            </button>
          )}

          <button
            onClick={() => {
              sessionStorage.removeItem("sparkjets_admin_authed");
              window.location.reload();
            }}
            style={{
              padding: "10px 20px",
              fontSize: "11px",
              fontWeight: 500,
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              background: "transparent",
              border: "1px solid var(--sr-border)",
              color: "var(--sr-text-dim)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Content */}
      {isFormView ? (
        <AircraftForm
          aircraft={editingAircraft}
          onSave={handleSave}
          onCancel={() => setEditingId(null)}
        />
      ) : (
        <InventoryTable
          aircraft={aircraft}
          onEdit={(id) => setEditingId(id)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
