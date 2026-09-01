import { describe, expect, it } from "vitest";
import { foundColony } from "../sim/colony";
import { createWorld, stepWorld } from "../sim/world";
import { deserializeWorld, serializeWorld } from "./checkpoint";
import { checkpointFromJson, checkpointToJson } from "./file";

describe("checkpoint codec", () => {
  it("round-trips through the JSON file codec", { timeout: 30_000 }, () => {
    const world = createWorld(8002);
    foundColony(world);
    for (let t = 0; t < 100; t++) {
      stepWorld(world);
    }
    const checkpoint = serializeWorld(world);
    const decoded = checkpointFromJson(checkpointToJson(checkpoint));

    expect(decoded.version).toBe(checkpoint.version);
    expect(decoded.tick).toBe(checkpoint.tick);
    expect(Buffer.from(decoded.grid).equals(Buffer.from(checkpoint.grid))).toBe(true);
    expect(Array.from(decoded.ants[0].genome)).toEqual(Array.from(checkpoint.ants[0].genome));

    const restored = deserializeWorld(decoded);
    expect(restored.tick).toBe(world.tick);
    expect(restored.ants.length).toBe(world.ants.length);
  });

  it("refuses unknown versions and controllers", () => {
    const world = createWorld(8003);
    const checkpoint = serializeWorld(world);
    expect(() => deserializeWorld({ ...checkpoint, version: 99 })).toThrow(/version/);
    expect(() => deserializeWorld({ ...checkpoint, controllerId: "nope" })).toThrow(/controller/);
  });
});
