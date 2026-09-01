import {
  degraded,
  omniscientOracle,
  sensorOracle,
  type OraclePolicy,
} from "../../src/sim/oracles/policies";
import { makeStrategy } from "../../src/sim/oracles/strategies";

/**
 * Driver registry: who steers the ants for a run. "seeded" is the real
 * controller (no override); everything else is an O-layer scripted policy
 * (ADR-0009). Structural options (vault build plan, surface queen) ride
 * along so a driver name fully describes a colony configuration.
 */
export interface DriverSpec {
  name: string;
  /** null = the seeded controller drives. */
  policy: OraclePolicy | null;
  /** 2x2 brood-vault layers the harness dig plan excavates (0 = none). */
  vaultDepth: number;
  /** Queen holds court in the open depression; brood incubates exposed. */
  queenOnSurface: boolean;
}

const REGISTRY: Record<string, () => DriverSpec> = {
  seeded: () => ({ name: "seeded", policy: null, vaultDepth: 0, queenOnSurface: false }),
  rung1: () => ({ name: "rung1", policy: omniscientOracle, vaultDepth: 0, queenOnSurface: false }),
  rung2: () => ({ name: "rung2", policy: sensorOracle, vaultDepth: 0, queenOnSurface: false }),
  "rung2-degraded": () => ({
    name: "rung2-degraded",
    policy: degraded(sensorOracle, 0.05, 2),
    vaultDepth: 0,
    queenOnSurface: false,
  }),
  surface: () => ({
    name: "surface",
    policy: makeStrategy({ cacheSite: "surface", retreat: false }),
    vaultDepth: 0,
    queenOnSurface: true,
  }),
  shelter: () => ({
    name: "shelter",
    policy: makeStrategy({ cacheSite: "chamber", retreat: true }),
    vaultDepth: 0,
    queenOnSurface: false,
  }),
  architect: () => ({
    name: "architect",
    policy: makeStrategy({ cacheSite: "chamber", retreat: true }),
    vaultDepth: 10,
    queenOnSurface: false,
  }),
};

export function makeDriver(name: string, overrides: Partial<DriverSpec> = {}): DriverSpec {
  const factory = REGISTRY[name];
  if (!factory) {
    throw new Error(`unknown driver "${name}" (have: ${Object.keys(REGISTRY).join(", ")})`);
  }
  return { ...factory(), ...overrides };
}

export const DRIVER_NAMES = Object.keys(REGISTRY);
