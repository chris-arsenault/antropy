import { describe, expect, it } from "vitest";
import { createPacer } from "./pacing";

describe("wall-clock tick pacing", () => {
  it.each([30, 60, 144])("runs 10 ticks per second at %i display frames per second", (frames) => {
    const pacer = createPacer(10, 0);
    let ticks = 0;
    for (let frame = 1; frame <= frames; frame++)
      pacer.advance(
        (frame * 1000) / frames,
        () => ticks++,
        () => 0
      );
    expect(ticks).toBe(10);
  });
  it("runs one tick per second and starts a resumed clock without pause debt", () => {
    let ticks = 0;
    const step = () => ticks++;
    const pacer = createPacer(1, 0);
    pacer.advance(999, step, () => 0);
    expect(ticks).toBe(0);
    pacer.advance(1000, step, () => 0);
    const resumed = createPacer(1, 10000);
    resumed.advance(10001, step, () => 0);
    expect(ticks).toBe(1);
  });
  it("bounds work and catch-up debt when a tick exceeds the frame budget", () => {
    const pacer = createPacer(120, 0);
    let now = 10000;
    const step = () => {
      now += 20;
    };
    expect(pacer.advance(now, step, () => now)).toBe(1);
    // At most a quarter-second of work is retained, even after a ten-second stall.
    expect(
      pacer.advance(
        now,
        () => {},
        () => now
      )
    ).toBeLessThanOrEqual(30);
  });
  it("lets maximum mode batch cheap ticks while respecting the compute budget", () => {
    const pacer = createPacer("max", 0);
    let now = 0;
    expect(
      pacer.advance(
        0,
        () => {
          now += 2;
        },
        () => now
      )
    ).toBe(5);
  });
});
