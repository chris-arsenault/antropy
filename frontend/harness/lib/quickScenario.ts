import { type World, type Point } from "../../src/sim/types";

/** Fixtures own initial conditions; the shared simulation owns every subsequent action. */
export interface QuickScenario {
  readonly name: string;
  readonly hypothesis: string;
  readonly specification: Record<string, unknown>;
  readonly target: Point & { radius: number };
  readonly offeredFoodA: number;
  readonly offeredFoodB?: number;
  create(seed: number, swap: boolean, probe?: "fast" | "slow"): World;
}

export const percent = (amount: number, denominator: number): number | null =>
  denominator > 0 ? (100 * amount) / denominator : null;
