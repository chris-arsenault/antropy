import { describe, expect, it } from "vitest";
import { type ColonyOutcomeVerdict } from "../lib/colonyOutcome";
import { generationWorldSeeds, rankUtilities } from "../lib/stochasticTraining";

function verdict(completionCount: number): ColonyOutcomeVerdict {
  return {
    fitness: completionCount,
    mean: completionCount,
    worst: completionCount,
    completionCount,
    cacheCount: completionCount,
    returnCount: completionCount,
    pickupCount: completionCount,
    exitCount: completionCount,
    scores: [completionCount],
    runs: [],
  };
}

describe("distributional colony-loop training", () => {
  it("assigns equal centered utility to tied outcomes", () => {
    expect(rankUtilities([verdict(0), verdict(1), verdict(1), verdict(2)])).toEqual([
      -0.5, 0, 0, 0.5,
    ]);
  });

  it("uses a fresh deterministic world batch each generation", () => {
    expect(generationWorldSeeds(20_000, 3, 1)).toEqual([20_000, 20_001, 20_002]);
    expect(generationWorldSeeds(20_000, 3, 2)).toEqual([20_003, 20_004, 20_005]);
  });
});
