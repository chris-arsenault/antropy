import { describe, expect, it } from "vitest";
import { FORAGER_CONFIG } from "./config";
import { stepWorld, summarizeWorld, createWorld } from "./world";

describe("canonical 2D world", () => {
  it("contains no third spatial coordinate", () => {
    const world = createWorld(3, "programmed", FORAGER_CONFIG, false);
    expect(world.dimension).toBe("2d");
    expect("z" in world.ant).toBe(false);
    expect(world.grid.cells).toHaveLength(world.config.width * world.config.height);
  });

  it("uses seeded random food layouts", () => {
    const first = [...createWorld(1, "oracle", FORAGER_CONFIG, false).foodSources];
    const repeated = [...createWorld(1, "oracle", FORAGER_CONFIG, false).foodSources];
    const different = [...createWorld(2, "oracle", FORAGER_CONFIG, false).foodSources];
    expect(first).toEqual(repeated);
    expect(first).not.toEqual(different);
  });

  it("advances deterministically", () => {
    const left = createWorld(7, "oracle", FORAGER_CONFIG, false);
    const right = createWorld(7, "oracle", FORAGER_CONFIG, false);
    for (let tick = 0; tick < 40; tick++) {
      stepWorld(left);
      stepWorld(right);
    }
    expect(summarizeWorld(left)).toEqual(summarizeWorld(right));
    expect([left.ant.x, left.ant.y, left.ant.heading]).toEqual([
      right.ant.x,
      right.ant.y,
      right.ant.heading,
    ]);
  });
});
