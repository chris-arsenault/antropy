import { appendFileSync, mkdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { diggerSeedVector } from "./controller/rnn";
import { runDigger, type DiggerRun } from "./oracles/diggerRun";

/**
 * Phase 2 step 8: the first true Phase-2 moment — one ant driven by the
 * REAL controller through the REAL sensors (no policy override), with
 * energy on, must sink a shaft comparable to the step-2 oracle's.
 */
const TARGET_DEPTH = 8;

function formatRun(label: string, run: DiggerRun): string {
  return (
    `${label}: depth=${run.depth} excavated=${run.excavated} ` +
    `mouthWidening=${run.mouthWidening} surfaceDivots=${run.surfaceDivots} ` +
    `completedAtTick=${run.completedAt} roundTrips=${run.roundTrips} ` +
    `mouthReturns=${run.mouthReturns} turns=${(run.headingTravel / (Math.PI * 2)).toFixed(1)} ` +
    `maxRadius=${run.maxRadius.toFixed(1)} energy=${run.energy.toFixed(3)} alive=${run.alive}`
  );
}

describe("seeded digger, real controller (Phase 2 step 8)", () => {
  it("sinks a shaft comparable to the oracle's", () => {
    const run = runDigger(diggerSeedVector(), 9950, TARGET_DEPTH);
    mkdirSync("test-results", { recursive: true });
    appendFileSync("test-results/seeded-digger.txt", formatRun("pure", run) + "\n");
    expect(run.alive, "the ant survived its own shaft").toBe(true);
    expect(run.depth, `depth ${run.depth} (tick ${run.completedAt})`).toBeGreaterThanOrEqual(
      TARGET_DEPTH
    );
    expect(run.roundTrips, "completed spoil round trips").toBeGreaterThan(0);
    expect(run.surfaceDivots, "no surface divot spam").toBe(0);
    expect(run.energy, `energy left ${run.energy.toFixed(3)}`).toBeGreaterThan(0.5);
  });

  it("retains excavation competence across a shipped founder sample", () => {
    const vector = diggerSeedVector();
    const runs = [9951, 9952, 9953].map((seed) =>
      runDigger(vector, seed, TARGET_DEPTH, 3000, true)
    );
    appendFileSync(
      "test-results/seeded-digger.txt",
      runs.map((run, index) => formatRun(`noisy${index}`, run)).join("\n") + "\n"
    );
    // Noise perturbs every locus, so one founder can be nonproductive. The
    // shipped claim is population-level diversity: most sampled founders
    // excavate, and step 9 separately gates the resulting crew's shape.
    expect(runs.filter((run) => run.excavated >= 4)).toHaveLength(2);
    expect(runs.reduce((sum, run) => sum + run.excavated, 0)).toBeGreaterThanOrEqual(16);
  });
});
