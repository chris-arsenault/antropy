import { describe, expect, it } from "vitest";
import { compareColonyOutcomes, summarizeColonyOutcomes } from "./colonyOutcome";

function outcome(milestone: "complete" | "cached" | "returned" | "picked" | "exited") {
  const cached = milestone === "complete" || milestone === "cached";
  return {
    cacheDrained: milestone === "complete",
    cacheGrew: cached,
    deposited: cached,
    returned: milestone !== "picked" && milestone !== "exited",
    pickedUp: milestone !== "exited",
    exited: true,
    cacheBeforeScarcity: 1,
    cacheAfterScarcity: milestone === "complete" ? 0 : 1,
  };
}

describe("colony outcome ordering", () => {
  it("rejects a deposit or cache result without the ordered surface trip", () => {
    const malformed = {
      exited: false,
      pickedUp: true,
      returned: true,
      deposited: true,
      cacheGrew: true,
      cacheDrained: true,
    };

    const result = summarizeColonyOutcomes([malformed]);

    expect(result.scores).toEqual([0]);
    expect(result.completionCount).toBe(0);
    expect(result.cacheCount).toBe(0);
    expect(result.returnCount).toBe(0);
    expect(result.pickupCount).toBe(0);
  });

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
