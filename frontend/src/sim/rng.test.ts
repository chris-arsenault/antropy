import { describe, expect, it } from "vitest";
import { createRng } from "./rng";

describe("createRng", () => {
  it("produces an identical sequence for the same seed", () => {
    const a = createRng(1234);
    const b = createRng(1234);
    for (let i = 0; i < 1000; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it("produces diverging sequences for different seeds", () => {
    const a = createRng(1);
    const b = createRng(2);
    const draws = 100;
    let identical = 0;
    for (let i = 0; i < draws; i++) {
      if (a.next() === b.next()) {
        identical += 1;
      }
    }
    expect(identical).toBeLessThan(draws);
  });

  it("resumes identically from serialized state", () => {
    const a = createRng(42);
    for (let i = 0; i < 50; i++) {
      a.next();
    }
    const state = a.getState();

    const b = createRng(0);
    b.setState(state);
    for (let i = 0; i < 100; i++) {
      expect(b.next()).toBe(a.next());
    }
  });

  it("stays within [0, 1)", () => {
    const rng = createRng(7);
    for (let i = 0; i < 10_000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
