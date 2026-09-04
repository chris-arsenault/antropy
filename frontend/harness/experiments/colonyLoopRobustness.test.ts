import { describe, expect, it } from "vitest";
import { GENOME_LENGTH } from "../../src/sim/controller/rnn";
import { createRng } from "../../src/sim/rng";
import { type ColonyOutcomeVerdict } from "../lib/colonyOutcome";
import { fixedRnnController } from "./colonyLoop";
import { mutateController, summarizeRobustnessScale } from "./colonyLoopRobustness";

function verdict(completions: number, mean: number, worst: number): ColonyOutcomeVerdict {
  return {
    fitness: mean + worst * 0.25,
    mean,
    worst,
    completionCount: completions,
    cacheCount: completions,
    returnCount: completions,
    pickupCount: completions,
    exitCount: completions,
    scores: [],
    runs: [],
  };
}

describe("colony-loop mutational robustness", () => {
  it("measures the exact diploid base at zero mutation", () => {
    const base = Float32Array.from({ length: GENOME_LENGTH }, (_, index) => index / 100);
    const result = mutateController(base, 0, createRng(7));

    expect(result).toHaveLength(GENOME_LENGTH * 2);
    expect(result.slice(0, GENOME_LENGTH)).toEqual(base);
    expect(result.slice(GENOME_LENGTH)).toEqual(base);
  });

  it("uses the deterministic production mutation operator", () => {
    const base = new Float32Array(GENOME_LENGTH);
    const first = mutateController(base, 0.5, createRng(11));
    const second = mutateController(base, 0.5, createRng(11));

    expect(first).toEqual(second);
    expect(first.some((value) => value !== 0)).toBe(true);
  });

  it("builds an exact controller without founder noise", () => {
    const base = Float32Array.from({ length: GENOME_LENGTH }, (_, index) => index / 100);
    const controller = fixedRnnController(base);
    const seeded = controller.serializeGenome(controller.seed(createRng(17)));

    expect(seeded).toEqual(base);
  });

  it("reports controller retention separately from episode completion", () => {
    const summary = summarizeRobustnessScale(
      0.25,
      [verdict(4, 4, 2), verdict(3, 3, 1), verdict(2, 2, 0)],
      4,
      0.75
    );

    expect(summary.retained).toBe(2);
    expect(summary.retention).toBeCloseTo(2 / 3);
    expect(summary.episodeCompletionRate).toBe(0.75);
    expect(summary.meanMilestoneScore).toBe(3);
    expect(summary.minimumMilestoneScore).toBe(0);
  });
});
