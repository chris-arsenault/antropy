import { type Engine, type EngineWorld } from "../../src/engine/client";

/** Fixtures author conditions; the kernel owns every subsequent physical action. */
export interface QuickScenario {
  readonly name: string;
  readonly hypothesis: string;
  readonly specification: Record<string, unknown>;
  readonly target: { x: number; y: number; radius: number };
  create(engine: Engine, seed: number, swap: boolean, probe?: "fast" | "slow"): EngineWorld;
  /** Registered external intervention, never an alternate stepping law. */
  beforeStep?(world: EngineWorld, tick: number): void;
}
export const percent = (amount: number, denominator: number): number | null =>
  denominator > 0 ? (100 * amount) / denominator : null;
