import { type World } from "../../src/sim/types";

/** Snapshot descriptions, not fitness signals or lifetime energy ledgers. */
export function competitionObservation(world: World) {
  return [1, 2].map((genome) => {
    const cells = world.cells.filter((c) => c.genome === genome),
      n = Math.max(1, cells.length);
    return {
      genome,
      population: cells.length,
      meanEnergy: cells.reduce((s, c) => s + c.energy, 0) / n,
      meanFood: cells.reduce((s, c) => s + c.reserve, 0) / n,
      meanSwimEffort: cells.reduce((s, c) => s + c.action.swim, 0) / n,
      meanAbsoluteTurnEffort: cells.reduce((s, c) => s + Math.abs(c.action.turn), 0) / n,
      meanReleaseEffort: cells.reduce((s, c) => s + c.action.secrete, 0) / n,
      meanNutrientReading: cells.reduce((s, c) => s + c.inputs[0], 0) / n,
    };
  });
}
