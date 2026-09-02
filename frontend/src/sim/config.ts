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
  /** Phase 3: ants age and starve; corpses drop as food. Off = immortal. */
  mortality: boolean;
  /** Phase 3: queens lay eggs and brood hatches. Off = fixed population. */
  reproduction: boolean;
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
  /** Founding carves a 2x2 descendable entrance shaft (1x1 is currently
   * undescendable under the movement primitives — the real fix is
   * locomotion). Off = 1x1 shaft, for testing that fix. */
  wideEntranceShaft: boolean;
}

/** Everything on — the behavior the project shipped through Release 3. */
export const FULL_CONFIG: SimConfig = {
  mortality: true,
  reproduction: true,
  nestDecay: true,
  seasons: true,
  weather: true,
  microclimate: true,
  eggExposure: true,
  larvalRearing: true,
  autoContinue: true,
  wideEntranceShaft: true,
};

/**
 * Spec §13 Phase 2 base case: world core + ecology + digging, ants whose
 * behavior is known (a scripted/reference controller), no evolution and
 * no later-phase liabilities. The configuration in which "does an ant dig
 * a chamber and store food, and does the nest persist?" is answerable.
 */
export const PHASE2_CONFIG: SimConfig = {
  mortality: false,
  reproduction: false,
  nestDecay: false,
  seasons: false,
  weather: false,
  microclimate: false,
  eggExposure: false,
  larvalRearing: false,
  autoContinue: false,
  wideEntranceShaft: true,
};

const PRESETS: Record<string, SimConfig> = {
  full: FULL_CONFIG,
  phase2: PHASE2_CONFIG,
};

/** Resolve a preset name to a fresh config copy; throws on unknown name. */
export function configPreset(name: string): SimConfig {
  const preset = PRESETS[name];
  if (!preset) {
    throw new Error(`unknown config preset "${name}" (have: ${Object.keys(PRESETS).join(", ")})`);
  }
  return { ...preset };
}

/** Apply "flag=true|false" overrides to a config in place. */
export function applyConfigOverrides(config: SimConfig, specs: string[]): SimConfig {
  for (const spec of specs) {
    const [key, value] = spec.split("=");
    if (!(key in config)) {
      throw new Error(`unknown config flag "${key}"`);
    }
    (config as unknown as Record<string, boolean>)[key] = value === "true";
  }
  return config;
}
