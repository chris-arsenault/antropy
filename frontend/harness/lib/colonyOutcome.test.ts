import { describe, expect, it } from "vitest";
import { compareColonyOutcomes, summarizeColonyOutcomes } from "./colonyOutcome";

function outcome(milestone: "complete" | "cached" | "returned" | "picked" | "exited") {
  return {
    cacheDrained: milestone === "complete",
    cacheGrew: milestone === "complete" || milestone === "cached",
    returned: milestone !== "picked" && milestone !== "exited",
    pickedUp: milestone !== "exited",
    exited: true,
    cacheBeforeScarcity: 1,
    cacheAfterScarcity: milestone === "complete" ? 0 : 1,
  };
}

describe("colony outcome ordering", () => {
  it("does not trade completed loops for partial progress in more worlds", () => {
    const specialist = summarizeColonyOutcomes([
      outcome("complete"),
      outcome("complete"),
      outcome("exited"),
    ]);
    const broad = summarizeColonyOutcomes([
      outcome("cached"),
      outcome("cached"),
      outcome("cached"),
    ]);

    expect(specialist.completionCount).toBeGreaterThan(broad.completionCount);
    expect(compareColonyOutcomes(specialist, broad)).toBeGreaterThan(0);
  });

  it("uses the worst milestone before mean progress when outcome counts tie", () => {
    const strongerTail = summarizeColonyOutcomes([
      { ...outcome("complete"), retrievalEnergyAfter: -2.5 },
      { ...outcome("returned"), deposited: false },
      { ...outcome("picked"), minLoadedEntranceDistance: 0 },
    ]);
    const weakerTail = summarizeColonyOutcomes([
      { ...outcome("complete"), retrievalEnergyAfter: 2.5 },
      { ...outcome("returned"), deposited: true },
      { ...outcome("picked"), minLoadedEntranceDistance: 6 },
    ]);

    expect(strongerTail.mean).toBeLessThan(weakerTail.mean);
    expect(compareColonyOutcomes(strongerTail, weakerTail)).toBeGreaterThan(0);
  });
});
