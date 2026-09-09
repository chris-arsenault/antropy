import { expect, it } from "vitest";
import { geometryCases, GEOMETRY_SPLITS } from "../nestGeneralization";
import { validateWorldCases } from "./colonyWorlds";
import { buildEnvironment } from "../../src/sim/nest";
import { createRandomState } from "../../src/sim/random";
import { cellIndex, pointAt, type Grid } from "../../src/sim/grid";
import { isWalkable } from "../../src/sim/terrain";
import { DIRECTIONS } from "../../src/sim/geometry";
import { layoutSpecs } from "../../src/sim/nestLayouts";

function reachable(grid: Grid, entrance: { x: number; y: number }): Set<number> {
  const reached = new Set([cellIndex(grid, entrance.x, entrance.y)]);
  for (const index of reached) {
    const point = pointAt(grid, index);
    for (const direction of DIRECTIONS) {
      const x = point.x + direction.x,
        y = point.y + direction.y;
      if (isWalkable(grid, x, y)) reached.add(cellIndex(grid, x, y));
    }
  }
  return reached;
}

it("keeps generated queen and all rooms reachable with independent food randomness", () => {
  for (const split of Object.keys(GEOMETRY_SPLITS)) {
    for (const entry of geometryCases(split)) {
      const { grid, nest, cache, foodSources } = buildEnvironment(
        entry.config,
        createRandomState(entry.seed)
      );
      const reached = reachable(grid, nest.entrance);
      const rooms = nest.chambers.filter(
        (room) => room.center.x !== cache.x || room.center.y !== cache.y
      );
      for (const room of rooms) {
        expect(reached.has(cellIndex(grid, room.center.x, room.center.y)), entry.label).toBe(true);
      }
      expect(reached.has(cellIndex(grid, nest.start.x, nest.start.y))).toBe(true);
      const original = buildEnvironment(
        { ...entry.config, nestSeed: 0 },
        createRandomState(entry.seed)
      );
      expect(foodSources).toEqual(original.foodSources);
    }
  }
});

it("reserves entire distinct layouts and rejects ambiguous rollout identities", () => {
  const seen = new Set<string>();
  for (const split of Object.keys(GEOMETRY_SPLITS)) {
    for (const entry of geometryCases(split)) {
      const key = JSON.stringify(
        layoutSpecs(entry.config.environment.nestShape, entry.config.nestSeed)
      );
      expect(seen.has(key)).toBe(false);
      seen.add(key);
      expect(entry.config.environment.lightModel).toBe("depth-attenuated");
      expect(entry.config.environment.support).toBe("column");
    }
  }
  const [first] = geometryCases("train");
  expect(() => validateWorldCases([first, first])).toThrow("duplicate");
  expect(() => validateWorldCases([{ ...first, id: 2 ** 24 + 1 }])).toThrow("Float32");
  expect(() =>
    validateWorldCases([{ ...first, config: { ...first.config, nestSeed: 1.5 } }])
  ).toThrow("nest seed");
});
