import { expect, it } from "vitest";
import { createWorld, stepWorld } from "../sim/world";
import { DEFAULT_CONFIG } from "../sim/config";
import { checkpointToJson, restoreWorld } from "./checkpoint";

it("restores receptor, recurrent, lineage and random state for exact continuation", () => {
  const world = createWorld(19, {
    ...DEFAULT_CONFIG,
    width: 16,
    height: 16,
    founders: 4,
    sourceCount: 2,
  });
  for (let i = 0; i < 120; i++) stepWorld(world);
  const restored = restoreWorld(checkpointToJson(world));
  for (let i = 0; i < 30; i++) {
    stepWorld(world);
    stepWorld(restored);
  }
  expect(checkpointToJson(restored)).toBe(checkpointToJson(world));
});
it("rejects ant files, broken RNNs and missing ancestor records", () => {
  expect(() => restoreWorld('{"version":19}')).toThrow("unsupported substrate");
  const data = JSON.parse(checkpointToJson(createWorld(3, { ...DEFAULT_CONFIG, founders: 1 })));
  data.genomes[0].genome.weights.pop();
  expect(() => restoreWorld(JSON.stringify(data))).toThrow("numeric array");
  data.genomes[0].genome.weights.push(0);
  data.ancestry = [];
  expect(() => restoreWorld(JSON.stringify(data))).toThrow("missing cell record");
});
