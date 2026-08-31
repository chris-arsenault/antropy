import { describe, expect, it } from "vitest";
import { BASE_TICKS_PER_SECOND, isChartsOnly, ticksForFrame } from "./pacing";

describe("ticksForFrame", () => {
  it("scales ticks with speed", () => {
    const oneX = ticksForFrame(1, 1000, 0);
    const tenX = ticksForFrame(10, 1000, 0);
    expect(oneX.ticks).toBe(BASE_TICKS_PER_SECOND);
    expect(tenX.ticks).toBe(BASE_TICKS_PER_SECOND * 10);
  });

  it("caps ticks at the frame budget", () => {
    const result = ticksForFrame(1000, 1000, 0, { maxTicksPerFrame: 500 });
    expect(result.ticks).toBe(500);
  });

  it("accumulates fractional ticks across frames via carry", () => {
    // 16ms at 1x and 10 ticks/s is 0.16 ticks per frame.
    let carry = 0;
    let total = 0;
    for (let frame = 0; frame < 100; frame++) {
      const result = ticksForFrame(1, 16, carry);
      carry = result.carry;
      total += result.ticks;
    }
    // 100 frames * 16ms = 1.6s -> 16 ticks.
    expect(total).toBe(16);
  });
});

describe("isChartsOnly", () => {
  it("disables rendering only at the top preset", () => {
    expect(isChartsOnly(1)).toBe(false);
    expect(isChartsOnly(100)).toBe(false);
    expect(isChartsOnly(1000)).toBe(true);
  });
});
