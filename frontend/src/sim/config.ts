/**
 * Feature gates for the simulation, so the build phases (design spec §13)
 * can be turned on and off as data instead of code. The base case —
 * Phase 2, "ecology with frozen genetics: balance the ecology with ants
 * whose behavior is known" — runs with every later-phase feature off.
 *
 * Flags gate whole systems; numeric constants stay in tunables.ts. Default
 * is FULL (everything the project has built); presets below isolate phases.
 */
export interface SimConfig {
  /** World core: ants may remove soil through the shared DIG actuator. */
  terrainDigging: boolean;
  /** Phase 3: ants age and starve; corpses drop as food. Off = immortal. */
  mortality: boolean;
  /** Queens and workers may lay non-queen eggs. Off = no worker replacement. */
  workerReproduction: boolean;
  /** Queen-destined brood may establish another colony. */
  colonyFounding: boolean;
  /** Founders and offspring may differ genetically. Off = exact genome copies. */
  geneticVariation: boolean;
  /** Phase 3: DIG can pick up and place live brood. */
  broodTransport: boolean;
  /** Experimental live-brood capacity override; null derives from body scale. */
  broodCapacity: number | null;
  /** World-core deterministic turn noise; breaks exact behavioral lockstep. */
  motorJitter: boolean;
  /** Solid material absorbs and re-emits colony odor. */
  materialColonyOdor: boolean;
  /** Food handled by an ant retains and re-emits that colony's contact odor. */
  contactFoodOdor: boolean;
  /** Phase 4: untrafficked tunnels collapse to loose fill. */
  nestDecay: boolean;
  /** Phase 4: seasonal food oscillation. Off = steady carrying capacity. */
  seasons: boolean;
  /** Phase 5: rain storms wash surface food and pheromone. */
  weather: boolean;
  /** Phase 5: depth/season/diurnal metabolic stress multiplier. Off = 1x. */
  microclimate: boolean;
  /** Phase 4: surface brood mortality hazard. */
  eggExposure: boolean;
  /** Phase 5: eggs incubate into larvae reared on the stockpile.
   * Off = egg hatches straight to an adult at incubation end. */
  larvalRearing: boolean;
  /** Release 3: force-refound from survivors when the population collapses. */
  autoContinue: boolean;
  /**
   * Founding carves a 2x2 entrance shaft. Off = 1x1, which is navigable
   * since the locomotion fix (shaftnav.test): a strong vertical bias now
   * tries the straight up/down move first, so an ant descends a 1-wide
   * shaft instead of stepping across its mouth. The 2x2 default only
   * remains on in FULL to avoid disturbing Release 3's calibration.
   */
  wideEntranceShaft: boolean;
  /**
   * Excavated soil must be carried and deposited (matter is conserved,
   * spoil piles are real). Off: digging clears the voxel outright and the
   * soil vanishes — no load, no haul trip. Food transport is unaffected
   * either way; this gates spoil only.
   */
  spoilHauling: boolean;
  /**
   * Loads an ant can carry. `null` uses the genome-derived capacity
   * (body scale, spec §3.2 — evolution's territory, Appendix C Rule 9);
   * a number overrides it globally for experiments.
   */
  spoilCapacity: number | null;
}

/** Everything on — the behavior the project shipped through Release 3. */
export const FULL_CONFIG: SimConfig = {
  terrainDigging: true,
  mortality: true,
  workerReproduction: true,
  colonyFounding: true,
  geneticVariation: true,
  broodTransport: true,
  broodCapacity: null,
  motorJitter: true,
  materialColonyOdor: true,
  contactFoodOdor: true,
  nestDecay: true,
  seasons: true,
  weather: true,
  microclimate: true,
  eggExposure: true,
  larvalRearing: true,
  autoContinue: true,
  wideEntranceShaft: true,
  spoilHauling: true,
  spoilCapacity: null,
};

/**
 * Spec §13 Phase 2 base case: world core + ecology + digging, ants whose
 * behavior is known (a scripted/reference controller), no evolution and
 * no later-phase liabilities. The configuration in which "does an ant dig
 * a chamber and store food, and does the nest persist?" is answerable.
 */
export const PHASE2_CONFIG: SimConfig = {
  terrainDigging: true,
  mortality: false,
  workerReproduction: false,
  colonyFounding: false,
  geneticVariation: true,
  broodTransport: false,
  broodCapacity: null,
  motorJitter: false,
  materialColonyOdor: false,
  contactFoodOdor: false,
  nestDecay: false,
  seasons: false,
  weather: false,
  microclimate: false,
  eggExposure: false,
  larvalRearing: false,
  autoContinue: false,
  // 1-wide entrance: navigable since the locomotion fix (shaftnav.test).
  wideEntranceShaft: false,
  // Base case: excavation clears soil outright. Hauling is Phase-4-style
  // realism (conserved matter, spoil piles); it is not needed to answer
  // "does an ant dig a tunnel and store food?"
  spoilHauling: false,
  spoilCapacity: null,
};

/** Appendix E baseline: authored nest, fixed genetics, and steady ecology. */
export const NEST_CONFIG: SimConfig = {
  ...PHASE2_CONFIG,
  terrainDigging: false,
  geneticVariation: false,
  motorJitter: true,
  materialColonyOdor: true,
  contactFoodOdor: true,
};

/** Authored-nest turnover control: mortality and queen upkeep, no replacement. */
export const MORTAL_NEST_CONFIG: SimConfig = {
  ...NEST_CONFIG,
  mortality: true,
};

/** Authored-nest worker replacement: mortal adults plus the full brood pipeline. */
export const REPLACEMENT_NEST_CONFIG: SimConfig = {
  ...MORTAL_NEST_CONFIG,
  workerReproduction: true,
  larvalRearing: true,
};

/** Authored-nest replacement with standing inherited variation admitted. */
export const VARIATION_NEST_CONFIG: SimConfig = {
  ...REPLACEMENT_NEST_CONFIG,
  geneticVariation: true,
};

/** Compatibility name retained for the existing programmed scenario. */
export const PROGRAMMED_COLONY_CONFIG = NEST_CONFIG;

/** Appendix D step 1: Phase 2 with conserved spoil and real haul trips. */
export const LADDER_STEP1_CONFIG: SimConfig = {
  ...PHASE2_CONFIG,
  spoilHauling: true,
};

/** Appendix D steps 2-9: step 1 plus mortality and its live energy budget. */
export const LADDER_STEP2_CONFIG: SimConfig = {
  ...LADDER_STEP1_CONFIG,
  mortality: true,
};

/** Appendix D step 10b: admit reproduction after the step-9 gate state. */
export const LADDER_STEP10B_CONFIG: SimConfig = {
  ...LADDER_STEP2_CONFIG,
  workerReproduction: true,
};

/** Appendix D step 10c: admit live brood transport after reproduction. */
export const LADDER_STEP10C_CONFIG: SimConfig = {
  ...LADDER_STEP10B_CONFIG,
  broodTransport: true,
};

/** Step 10d-prime: admit the climate field that egg exposure depends on. */
export const LADDER_STEP10D_PRIME_CONFIG: SimConfig = {
  ...LADDER_STEP10C_CONFIG,
  microclimate: true,
};

/** Appendix D step 10d: expose brood after climate cost is measured. */
export const LADDER_STEP10D_CONFIG: SimConfig = {
  ...LADDER_STEP10D_PRIME_CONFIG,
  eggExposure: true,
};

/** Appendix D steps 11b-11c: admit weather after food transport is proven. */
export const LADDER_STEP11B_CONFIG: SimConfig = {
  ...LADDER_STEP10D_CONFIG,
  weather: true,
};

/** Appendix D step 12: the summit gate set plus deterministic motor diversity. */
export const LADDER_STEP12_CONFIG: SimConfig = {
  ...LADDER_STEP11B_CONFIG,
  motorJitter: true,
};

const PRESETS: Record<string, SimConfig> = {
  full: FULL_CONFIG,
  phase2: PHASE2_CONFIG,
  nest: NEST_CONFIG,
  "nest-mortality": MORTAL_NEST_CONFIG,
  "nest-replacement": REPLACEMENT_NEST_CONFIG,
  "nest-variation": VARIATION_NEST_CONFIG,
  programmedColony: PROGRAMMED_COLONY_CONFIG,
};

/** Resolve a preset name to a fresh config copy; throws on unknown name. */
export function configPreset(name: string): SimConfig {
  const preset = PRESETS[name];
  if (!preset) {
    throw new Error(`unknown config preset "${name}" (have: ${Object.keys(PRESETS).join(", ")})`);
  }
  return { ...preset };
}

function parseValue(raw: string): boolean | number | null {
  if (raw === "true" || raw === "false") {
    return raw === "true";
  }
  if (raw === "null") {
    return null;
  }
  const numeric = Number(raw);
  if (Number.isNaN(numeric)) {
    throw new Error(`config value must be true|false|null|<number>, got "${raw}"`);
  }
  return numeric;
}

/** Apply "flag=true|false|null|<number>" overrides to a config in place. */
export function applyConfigOverrides(config: SimConfig, specs: string[]): SimConfig {
  for (const spec of specs) {
    const [key, value] = spec.split("=");
    if (!(key in config)) {
      throw new Error(`unknown config flag "${key}"`);
    }
    (config as unknown as Record<string, boolean | number | null>)[key] = parseValue(value);
  }
  return config;
}
