import { expect, it } from "vitest";
import { createWorld, stepWorld } from "../sim/world";
import { DEFAULT_CONFIG } from "../sim/config";
import { checkpointToJson, restoreWorld } from "./checkpoint";
import { reproduce } from "../sim/reproduction";
import { fundDivision } from "../sim/testSupport";

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
it("continues diploid selfing and budding with the parent's private memory intact", () => {
  const world = createWorld(7, {
    ...DEFAULT_CONFIG,
    founders: 1,
    ploidy: "diploid",
    transmission: "selfing",
    reproduction: "budding",
    mutationRate: 1,
    physicalMutationRate: 1,
  });
  fundDivision(world);
  world.cells[0].brain.traces.fill(0.3);
  reproduce(world);
  const restored = restoreWorld(checkpointToJson(world));
  for (let i = 0; i < 20; i++) {
    stepWorld(world);
    stepWorld(restored);
  }
  expect(checkpointToJson(restored)).toBe(checkpointToJson(world));
  const invalid = JSON.parse(checkpointToJson(world));
  invalid.config.ploidy = "haploid";
  invalid.config.transmission = "clonal";
  expect(() => restoreWorld(JSON.stringify(invalid))).toThrow("ploidy disagree");
});
it("rejects ant files, broken RNNs and missing ancestor records", () => {
  expect(() => restoreWorld('{"version":19}')).toThrow("unsupported substrate");
  const data = JSON.parse(checkpointToJson(createWorld(3, { ...DEFAULT_CONFIG, founders: 1 })));
  data.genomes[0].genome.chromosomes[0].behavior.weights.pop();
  expect(() => restoreWorld(JSON.stringify(data))).toThrow("numeric array");
  data.genomes[0].genome.chromosomes[0].behavior.weights.push(0);
  data.ancestry = [];
  expect(() => restoreWorld(JSON.stringify(data))).toThrow("missing cell record");
});
