import { expect, it } from "vitest";
import { createWorld, stepWorld } from "../sim/world";
import { DEFAULT_CONFIG } from "../sim/config";
import { reproduce } from "../sim/reproduction";
import { overrideTask, recordEvent } from "../sim/events";
import { checkpointToJson, restoreWorld } from "./checkpoint";
import { controller } from "../sim/controller";
import { INPUTS } from "../sim/interface";
import { fundDivision } from "../sim/testSupport";

function dividingWorld(mutationRate: number, mutationScale = 0) {
  const world = createWorld(41, {
    ...DEFAULT_CONFIG,
    founders: 1,
    mutationRate,
    mutationScale,
    physicalMutationRate: 0,
  });
  fundDivision(world);
  return world;
}
it("genetic random draws cannot change body placement or headings with unchanged weights", () => {
  const control = dividingWorld(0),
    mutated = dividingWorld(0.005);
  reproduce(control);
  reproduce(mutated);
  for (let i = 0; i < 20; i++) {
    stepWorld(control);
    stepWorld(mutated);
  }
  expect(mutated.cells).toEqual(control.cells);
  expect(mutated.rng).toEqual(control.rng);
  expect(mutated.environmentRng).toEqual(control.environmentRng);
  expect(mutated.geneticRng).not.toEqual(control.geneticRng);
});
it("continues exactly after mutated division and an intervention", () => {
  const world = dividingWorld(1, 0.12);
  reproduce(world);
  overrideTask(world, world.cells[0].id, 201);
  const restored = restoreWorld(checkpointToJson(world));
  for (let i = 0; i < 20; i++) {
    stepWorld(world);
    stepWorld(restored);
  }
  expect(world.genomes.size).toBe(3);
  expect(checkpointToJson(restored)).toBe(checkpointToJson(world));
});
it("retains diagnostic provenance after recent events roll over and a checkpoint is restored", () => {
  const world = createWorld(1, { ...DEFAULT_CONFIG, founders: 1 });
  overrideTask(world, 1, 99);
  for (let i = 0; i < 512; i++) recordEvent(world, "task", 1, [0, 1]);
  expect(world.events.some((event) => event.kind === "override")).toBe(false);
  expect(restoreWorld(checkpointToJson(world)).interventions).toEqual([
    { cell: 1, tick: 0, previous: 0, value: 99 },
  ]);
});
it.each(["parent", "lineage", "genome", "born", "generation"])(
  "rejects inconsistent cell %s",
  (key) => {
    const data = JSON.parse(checkpointToJson(createWorld(1, { ...DEFAULT_CONFIG, founders: 1 })));
    data.cells[0][key] = 999;
    expect(() => restoreWorld(JSON.stringify(data))).toThrow("inconsistent cell");
  }
);
it("rejects ancestry marked alive without its body", () => {
  const data = JSON.parse(checkpointToJson(createWorld(1, { ...DEFAULT_CONFIG, founders: 1 })));
  data.cells = [];
  expect(() => restoreWorld(JSON.stringify(data))).toThrow("ancestry/body mismatch");
});
it("rejects impossible reserve configurations at creation", () => {
  expect(() => createWorld(1, { ...DEFAULT_CONFIG, founderReserve: 4 })).toThrow("Founder reserve");
  expect(() => createWorld(1, { ...DEFAULT_CONFIG, daughterReserve: 4 })).toThrow(
    "Division reserves"
  );
});
it("rejects v1 state rather than inventing genetic randomness and intervention history", () => {
  const data = JSON.parse(checkpointToJson(createWorld()));
  data.version = 1;
  expect(() => restoreWorld(JSON.stringify(data))).toThrow("checkpoint v4");
});
it("controller codecs preserve exact genome and private state without sharing arrays", () => {
  const genome = controller.seed(),
    state = controller.createState();
  controller.act(genome, new Float32Array(INPUTS).fill(0.1), state);
  const copy = controller.decodeGenome(JSON.parse(JSON.stringify(controller.encodeGenome(genome))));
  const memory = controller.decodeState(JSON.parse(JSON.stringify(controller.encodeState(state))));
  expect(controller.genomeDistance(copy, genome)).toBe(0);
  expect(controller.inspectState(memory)).toEqual(controller.inspectState(state));
  controller.act(copy, new Float32Array(INPUTS), memory);
  expect(controller.inspectState(memory)).not.toEqual(controller.inspectState(state));
});
