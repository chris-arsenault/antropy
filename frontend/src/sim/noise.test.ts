import { describe, expect, it } from "vitest";
import { fbm2, valueNoise2 } from "./noise";

describe("valueNoise2", () => {
  it("is a pure function of seed and position", () => {
    for (let i = 0; i < 100; i++) {
      const x = i * 0.37;
      const y = i * 1.91;
      expect(valueNoise2(5, x, y)).toBe(valueNoise2(5, x, y));
    }
  });

  it("differs across seeds", () => {
    let differing = 0;
    for (let i = 0; i < 50; i++) {
      if (valueNoise2(1, i * 0.7, i * 0.3) !== valueNoise2(2, i * 0.7, i * 0.3)) {
        differing += 1;
      }
    }
    expect(differing).toBeGreaterThan(40);
  });

  it("stays within [0, 1]", () => {
    for (let i = 0; i < 1000; i++) {
      const v = valueNoise2(9, i * 0.13, i * 0.71);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("is spatially continuous", () => {
    const step = 0.01;
    for (let i = 0; i < 500; i++) {
      const x = i * 0.11;
      const y = i * 0.07;
      const delta = Math.abs(valueNoise2(3, x + step, y) - valueNoise2(3, x, y));
      expect(delta).toBeLessThan(0.1);
    }
  });
});

describe("fbm2", () => {
  it("stays within [0, 1] and is deterministic", () => {
    for (let i = 0; i < 500; i++) {
      const v = fbm2(11, i * 0.19, i * 0.23, 4);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
      expect(fbm2(11, i * 0.19, i * 0.23, 4)).toBe(v);
    }
  });
});
