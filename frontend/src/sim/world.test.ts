import { describe, expect, it } from "vitest";
import { createWorld, snapshotWorld, stepWorld } from "./world";

describe("world", () => {
  it("starts at tick zero with the given seed", () => {
    const world = createWorld(99);
    expect(world.tick).toBe(0);
    expect(world.seed).toBe(99);
  });

  it("reaches an identical state for the same seed after many steps", () => {
    const a = createWorld(2026);
    const b = createWorld(2026);
    for (let i = 0; i < 500; i++) {
      stepWorld(a);
      stepWorld(b);
    }
    expect(snapshotWorld(a)).toEqual(snapshotWorld(b));
    expect(Buffer.from(a.grid.data).equals(Buffer.from(b.grid.data))).toBe(true);
  });

  it("counts ticks per step", () => {
    const world = createWorld(1);
    for (let i = 0; i < 10; i++) {
      stepWorld(world);
    }
    expect(world.tick).toBe(10);
  });

  it("diverges in rng draws for different seeds", () => {
    const a = createWorld(1);
    const b = createWorld(2);
    expect(a.rng.next()).not.toBe(b.rng.next());
  });
});
