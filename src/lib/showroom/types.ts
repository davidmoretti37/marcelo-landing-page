// ─── Spark Jets Showroom – Type Definitions ──────────────────────────────────

export type AircraftCategory =
  | "Very Light"
  | "Light Jet"
  | "Midsize"
  | "Super Midsize"
  | "Large Cabin"
  | "Long Range"
  | "Ultra Long Range"
  | "VIP Airliner";

export type AircraftStatus = "available" | "under_contract" | "sold";

export interface AircraftSpecs {
  range_nm?: number;
  maxPassengers?: number;
  typicalPax?: number;
  cruiseSpeed_ktas?: number;
  maxSpeed_mmo?: number;
  ceiling_ft?: number;
  cabinLength_ft?: number;
  cabinWidth_ft?: number;
  cabinHeight_ft?: number;
  baggage_cuft?: number;
  takeoffDistance_ft?: number;
  landingDistance_ft?: number;
  engines?: string;
  avionics?: string;
  totalTime_hrs?: number;
  landings?: number;
  engineProgram?: string;
  interiorRefurb?: string;
  paintDate?: string;
}

export interface AircraftPricing {
  askingPrice: number;
  showPrice: boolean;
}

export interface AircraftFeatures {
  standupCabin: boolean;
  flatBerthing: boolean;
  fullGalley: boolean;
  wifi: boolean;
  entertainment: boolean;
  lavatory: string; // "forward" | "aft" | "both"
  baggageAccessible: boolean;
  freshInterior: boolean;
  freshPaint: boolean;
  engineProgramEnrolled: boolean;
}

export interface CabinZone {
  name: string;
  title: string;
  desc: string;
  image: string;
  specs: { key: string; val: string }[];
}

export interface BlueprintData {
  label: string;
  category: string;
  specGroups: {
    title: string;
    specs: { key: string; val: string; unit?: string | null }[];
  }[];
}

export interface Aircraft {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  year: number;
  category: AircraftCategory;
  serialNumber: string;
  description: string;
  photos: { url: string; caption: string }[];
  specs: AircraftSpecs;
  pricing: AircraftPricing;
  features: AircraftFeatures;
  status: AircraftStatus;
  cabinZones?: CabinZone[];
  blueprint?: BlueprintData;
  xrayImages?: { exterior: string; interior: string };
  createdAt: string;
  updatedAt: string;
}

export interface City {
  name: string;
  coords: [number, number]; // [lng, lat]
  region: string;
}

export interface ShowroomFilters {
  selectedCities: City[];
  minPassengers: number;
  requireStandupCabin: boolean;
  requireFlatBerthing: boolean;
  budgetMin: number;
  budgetMax: number;
  sortBy:
    | "price_asc"
    | "price_desc"
    | "year_desc"
    | "range_desc"
    | "pax_desc";
}
