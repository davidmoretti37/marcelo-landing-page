// ─── Spark Jets Showroom – localStorage-backed Repository & React Hook ───────

"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { Aircraft } from "./types";
import { SEED_AIRCRAFT } from "./seed";

// ── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "sparkjets_inventory";
const CHANGE_EVENT = "sparkjets-inventory-changed";
const SEED_VERSION_KEY = "sparkjets_seed_version";
const SEED_VERSION = 11;

// ── Internal helpers ─────────────────────────────────────────────────────────

function readStorage(): Aircraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Aircraft[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(aircraft: Aircraft[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(aircraft));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function now(): string {
  return new Date().toISOString();
}

// ── Public CRUD functions ────────────────────────────────────────────────────

/** Returns every aircraft in localStorage (all statuses). */
export function getAll(): Aircraft[] {
  return readStorage();
}

/** Returns only aircraft with status "available". */
export function getAvailable(): Aircraft[] {
  return readStorage().filter((ac) => ac.status === "available");
}

/** Finds a single aircraft by its id, or undefined if not found. */
export function getById(id: string): Aircraft | undefined {
  return readStorage().find((ac) => ac.id === id);
}

/** Creates a new aircraft record. Generates id & timestamps automatically. */
export function create(
  data: Omit<Aircraft, "id" | "createdAt" | "updatedAt">,
): Aircraft {
  const aircraft: Aircraft = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: now(),
    updatedAt: now(),
  };
  const all = readStorage();
  all.push(aircraft);
  writeStorage(all);
  return aircraft;
}

/** Partially updates an existing aircraft. Throws if not found. */
export function update(
  id: string,
  data: Partial<Omit<Aircraft, "id" | "createdAt" | "updatedAt">>,
): Aircraft {
  const all = readStorage();
  const idx = all.findIndex((ac) => ac.id === id);
  if (idx === -1) throw new Error(`Aircraft not found: ${id}`);

  all[idx] = { ...all[idx], ...data, updatedAt: now() };
  writeStorage(all);
  return all[idx];
}

/** Removes an aircraft by id. Returns true if found & removed. */
export function remove(id: string): boolean {
  const all = readStorage();
  const filtered = all.filter((ac) => ac.id !== id);
  if (filtered.length === all.length) return false;
  writeStorage(filtered);
  return true;
}

/** Returns the number of bytes used by the inventory key in localStorage. */
export function getStorageUsage(): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return 0;
  // Each char in localStorage is stored as UTF-16 (2 bytes)
  return raw.length * 2;
}

// ── Seed ─────────────────────────────────────────────────────────────────────

/**
 * Seeds the demo inventory if localStorage is empty (or the key does not
 * exist). Safe to call on every app boot — it's a no-op when data exists.
 */
export function seedDemoData(): void {
  if (typeof window === "undefined") return;

  const storedVersion = Number(localStorage.getItem(SEED_VERSION_KEY) || "0");
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing && storedVersion >= SEED_VERSION) return; // up to date

  const seeded: Aircraft[] = SEED_AIRCRAFT.map((data) => ({
    ...data,
    id: crypto.randomUUID(),
    createdAt: now(),
    updatedAt: now(),
  }));
  writeStorage(seeded);
  localStorage.setItem(SEED_VERSION_KEY, String(SEED_VERSION));
}

// ── React Hook ───────────────────────────────────────────────────────────────

/**
 * Subscribes to inventory changes and re-renders when the data changes.
 * Uses `useSyncExternalStore` for tear-free reads that work with concurrent
 * features and SSR.
 */
export function useInventory(): { aircraft: Aircraft[]; loading: boolean } {
  const subscribe = useCallback((onStoreChange: () => void) => {
    window.addEventListener(CHANGE_EVENT, onStoreChange);
    window.addEventListener("storage", onStoreChange);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onStoreChange);
      window.removeEventListener("storage", onStoreChange);
    };
  }, []);

  const getSnapshot = useCallback(() => {
    return localStorage.getItem(STORAGE_KEY) ?? "[]";
  }, []);

  const getServerSnapshot = useCallback(() => "[]", []);

  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      setAircraft(JSON.parse(raw) as Aircraft[]);
    } catch {
      setAircraft([]);
    }
    setLoading(false);
  }, [raw]);

  return { aircraft, loading };
}
