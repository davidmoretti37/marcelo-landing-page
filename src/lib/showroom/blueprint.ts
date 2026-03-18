import type { Aircraft, BlueprintData } from "./types";

/**
 * Auto-generates a BlueprintData object from an Aircraft's flat specs.
 * If the aircraft already has a manually-set blueprint, returns that instead.
 */
export function generateBlueprint(aircraft: Aircraft): BlueprintData {
  if (aircraft.blueprint) return aircraft.blueprint;

  const s = aircraft.specs;

  const dimensions: { key: string; val: string; unit?: string | null }[] = [];
  if (s.cabinLength_ft) dimensions.push({ key: "Cabin Length", val: `${s.cabinLength_ft} ft` });
  if (s.cabinWidth_ft) dimensions.push({ key: "Cabin Width", val: `${s.cabinWidth_ft} ft` });
  if (s.cabinHeight_ft) dimensions.push({ key: "Cabin Height", val: `${s.cabinHeight_ft} ft` });
  if (s.baggage_cuft) dimensions.push({ key: "Baggage", val: `${s.baggage_cuft} cu ft` });

  const performance: { key: string; val: string; unit?: string | null }[] = [];
  if (s.range_nm) performance.push({ key: "Max Range", val: `${s.range_nm.toLocaleString()} nm` });
  if (s.cruiseSpeed_ktas) performance.push({ key: "Cruise Speed", val: `${s.cruiseSpeed_ktas} ktas` });
  if (s.maxSpeed_mmo) performance.push({ key: "Max Speed", val: `Mach ${s.maxSpeed_mmo}` });
  if (s.ceiling_ft) performance.push({ key: "Ceiling", val: `${s.ceiling_ft.toLocaleString()} ft` });
  if (s.takeoffDistance_ft) performance.push({ key: "Takeoff Distance", val: `${s.takeoffDistance_ft.toLocaleString()} ft` });
  if (s.landingDistance_ft) performance.push({ key: "Landing Distance", val: `${s.landingDistance_ft.toLocaleString()} ft` });

  const powerplant: { key: string; val: string; unit?: string | null }[] = [];
  if (s.engines) powerplant.push({ key: "Engines", val: s.engines });
  if (s.totalTime_hrs) powerplant.push({ key: "Total Time", val: `${s.totalTime_hrs.toLocaleString()} hrs` });
  if (s.landings) powerplant.push({ key: "Landings", val: s.landings.toLocaleString() });
  if (s.engineProgram) powerplant.push({ key: "Engine Program", val: s.engineProgram });

  const cabin: { key: string; val: string; unit?: string | null }[] = [];
  if (s.maxPassengers) cabin.push({ key: "Max Passengers", val: `${s.maxPassengers}` });
  if (s.avionics) cabin.push({ key: "Avionics", val: s.avionics });
  if (s.interiorRefurb) cabin.push({ key: "Interior Refurb", val: s.interiorRefurb });
  if (s.paintDate) cabin.push({ key: "Paint", val: s.paintDate });

  const specGroups = [
    { title: "Dimensions", specs: dimensions },
    { title: "Performance", specs: performance },
    { title: "Powerplant", specs: powerplant },
    { title: "Cabin", specs: cabin },
  ].filter((g) => g.specs.length > 0);

  return {
    label: aircraft.model,
    category: aircraft.category,
    specGroups,
  };
}
