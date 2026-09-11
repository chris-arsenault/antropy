import { expect, it } from "vitest";
import { createWorld, stepWorld } from "../sim/world";
import { noteExecution, provenance } from "./provenance";
import { checkpointToJson, restoreWorld } from "./checkpoint";

it("preserves unknown history and subsequent execution sources across exports", () => {
  const world = createWorld();
  stepWorld(world);
  noteExecution(world, "build-a");
  stepWorld(world);
  const text = checkpointToJson(world, "exporter-b");
  expect(JSON.parse(text).exportSource).toBe("exporter-b");
  const restored = restoreWorld(text);
  expect(provenance(restored)).toEqual({
    version: 1,
    segments: [
      { tick: 0, source: "unknown" },
      { tick: 1, source: "build-a" },
    ],
  });
  noteExecution(restored, "build-b");
  stepWorld(restored);
  expect(provenance(restoreWorld(checkpointToJson(restored)))!.segments.at(-1)).toEqual({
    tick: 2,
    source: "build-b",
  });
  const invalid = JSON.parse(checkpointToJson(restored));
  invalid.provenance.segments[1].tick = 999;
  expect(() => restoreWorld(JSON.stringify(invalid))).toThrow("provenance");
  const badExporter = { ...JSON.parse(text), exportSource: 42 };
  expect(() => restoreWorld(JSON.stringify(badExporter))).toThrow("export source");
});
