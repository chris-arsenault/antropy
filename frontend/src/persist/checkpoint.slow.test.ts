import { describe, expect, it } from "vitest";
import { foundColony } from "../sim/colony";
import { createWorld, stepWorld } from "../sim/world";
import { deserializeWorld, serializeWorld } from "./checkpoint";

// Slow tier (long simulation runs): excluded from `make test`; run with
// `make test-slow`. Cloud CI runs the full suite.
describe("checkpoint determinism (M8 gate)", () => {
  it("save, reload, advance both: bit-identical state", { timeout: 120_000 }, () => {
    const original = createWorld(8001);
    foundColony(original);
    for (let t = 0; t < 700; t++) {
      stepWorld(original);
    }

    const restored = deserializeWorld(serializeWorld(original));
    for (let t = 0; t < 500; t++) {
      stepWorld(original);
      stepWorld(restored);
    }

    const a = serializeWorld(original);
    const b = serializeWorld(restored);
    expect(b.tick).toBe(a.tick);
    expect(b.rngState).toEqual(a.rngState);
    expect(Buffer.from(b.grid).equals(Buffer.from(a.grid))).toBe(true);
    expect(b.foodSources).toEqual(a.foodSources);
    expect(b.ants.length).toBe(a.ants.length);
    for (let i = 0; i < a.ants.length; i++) {
      expect(b.ants[i].scalars).toEqual(a.ants[i].scalars);
      expect(Array.from(b.ants[i].genome)).toEqual(Array.from(a.ants[i].genome));
      expect(Array.from(b.ants[i].state)).toEqual(Array.from(a.ants[i].state));
    }
    expect(b.colonies).toEqual(a.colonies);
    expect(b.eggs).toEqual(a.eggs);
    expect(Array.from(b.scents.a.values)).toEqual(Array.from(a.scents.a.values));
    expect(Array.from(b.scents.food.values)).toEqual(Array.from(a.scents.food.values));
    expect(b.scents.food.active).toEqual(a.scents.food.active);
  });
});
