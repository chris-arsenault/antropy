// @vitest-environment node
import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";
import { Engine } from "./client";
import { SelectedObservation } from "./selectedObservation";
import { type Inspection, type Summary } from "./types";
import { expectNumericallyEqual } from "../../harness/lib/physicalAssertions";

const bytes = new Uint8Array(readFileSync("public/antropy-engine.wasm"));
const compact = { width: 24, height: 24, founders: 2, sourceCount: 2 };

it("steps through the scalar ABI without serialization and matches command stepping", async () => {
  const engine = await Engine.load(bytes),
    initial = engine.create(101, compact);
  const snapshot = initial.snapshot();
  initial.dispose();
  const a = engine.restore(snapshot),
    b = engine.restore(snapshot);
  const command = vi.spyOn(engine, "command");
  const encode = vi.spyOn(TextEncoder.prototype, "encode");
  a.step(17);
  expect(command).not.toHaveBeenCalled();
  expect(encode).not.toHaveBeenCalled();
  encode.mockRestore();
  b.command("step", { count: 17 });
  expect(a.snapshot()).toEqual(b.snapshot());
  expect(() => a.step(0.5)).toThrow("integer");
  a.dispose();
  b.dispose();
});

it("blocks bulk and harness exports in the browser engine while permitting reduced observations", async () => {
  const engine = await Engine.load(bytes, true),
    world = engine.create(101, compact);
  for (const op of ["frame", "field", "inspect", "environment", "assayFrame", "step", "intervene"])
    expect(() => world.command(op)).toThrow("Data ownership contract");
  world.step();
  expect(world.command<Summary>("summary").population).toBe(2);
  expect(world.render().cells.buffer).toBe(world.render().field.buffer);
  const restored = engine.restore(world.snapshot());
  expect(restored.snapshot()).toEqual(world.snapshot());
  world.dispose();
  restored.dispose();
});

it("reuses genealogy and chromosomes until a relevant change, with full display equivalence", async () => {
  const engine = await Engine.load(bytes),
    world = engine.diagnostic("nutrition");
  const observer = new SelectedObservation();
  const summary = () => world.command<Summary>("summary");
  const first = observer.read(world, summary(), 1)!;
  expect(first).toEqual(world.command<Inspection>("inspect", { cell: 1 }));
  expect(observer.read(world, summary(), 1)).toBe(first);
  world.step();
  const next = observer.read(world, summary(), 1)!;
  expect(next.genotype).toBe(first.genotype);
  expect(next.genealogy).toBe(first.genealogy);
  expect(next).toEqual(world.command<Inspection>("inspect", { cell: 1 }));
  world.command("task", { cell: 1, value: 73 });
  observer.invalidate();
  expect(observer.read(world, summary(), 1)!.cell!.brain.task).toBe(73);
  world.command("intervene", { cell: 1, body: first.cell!.body.map((q) => q * 2), energy: 1 });
  world.step(16);
  const before = world.snapshot(),
    ended = observer.read(world, summary(), 1)!;
  expect(ended.cell).toBeNull();
  expect(ended.genealogy).not.toBe(first.genealogy);
  expect(ended.genealogy.descendantCount).toBe(2);
  expect(ended).toEqual(world.command<Inspection>("inspect", { cell: 1 }));
  const child = observer.read(world, summary(), 2)!;
  expect(child).toEqual(world.command<Inspection>("inspect", { cell: 2 }));
  expect(world.snapshot()).toEqual(before);
  const restored = engine.restore(before);
  expectNumericallyEqual(observer.read(restored, summary(), 2), child);
  restored.dispose();
  world.dispose();
});
