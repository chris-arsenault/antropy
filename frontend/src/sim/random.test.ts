import { describe, expect, it } from "vitest";
import { createRandomState, deterministicJitter, nextRandom } from "./random";

describe("seeded 2D randomness", () => {
  it("repeats a world stream and separates seeds", () => {
    const left = createRandomState(41);
    const right = createRandomState(41);
    const different = createRandomState(42);

    const sequence = () => [nextRandom(left), nextRandom(left), nextRandom(left)];
    expect(sequence()).toEqual([nextRandom(right), nextRandom(right), nextRandom(right)]);
    expect(nextRandom(different)).not.toBe(sequence()[0]);
  });

  it("gives identities stable tie-breaking differences", () => {
    expect(deterministicJitter(1, 0, 1)).toBe(deterministicJitter(1, 0, 1));
    expect(deterministicJitter(1, 0, 1)).not.toBe(deterministicJitter(1, 0, 2));
  });

  it("keeps deterministic motor jitter inside the controller input range", () => {
    const values = Array.from({ length: 1_000 }, (_, tick) => deterministicJitter(7, tick, 3));
    expect(Math.min(...values)).toBeGreaterThanOrEqual(-1);
    expect(Math.max(...values)).toBeLessThanOrEqual(1);
  });
});
