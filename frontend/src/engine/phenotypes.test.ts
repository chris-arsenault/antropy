// @vitest-environment node
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { Engine } from "./client";
import { Session } from "./session";
import { decodePackage } from "./package";
import { validateObservation } from "./observationValidation";
import { applyObservation, observationDelta } from "./observationDelta";
import { checkObservationBudget } from "./observationBudget";
import { expectSavedPhysicalState } from "../../harness/lib/physicalAssertions";

const bytes = new Uint8Array(readFileSync("public/antropy-engine.wasm"));
async function fixture(founders = 4) {
  const session = new Session(await Engine.load(bytes, true));
  session.restart(27, { width: 24, height: 24, founders, sourceCount: 4 });
  return session;
}

it("collects measured flow only on request and preserves physics and borrowed map colors", async () => {
  const session = await fixture();
  const reader = await Engine.load(bytes);
  const control = session.engine.restore(session.world.snapshot());
  session.setChemicalWeb({ mode: "measured", focus: null, offset: 0 });
  session.setPhenotype({ action: "panel", enabled: true });
  for (let i = 0; i < 25; i++) {
    session.step();
    control.step();
  }
  const status = session.status();
  expect(status.chemicalWeb!.rows.length).toBeGreaterThan(0);
  expect(status.chemicalWeb!.window!.end).toBe(25);
  expect(status.phenotype!.groups[0]).toEqual(status.phenotype!.groups[1]);
  expectSavedPhysicalState(reader, session.world.snapshot(), control.snapshot());
  const colors = session.world.render(5, 0, 3).cells.slice();
  session.setPhenotype({ action: "select", selection: { kind: "role", input: 255, output: 255 } });
  session.setPhenotype({ action: "highlight", enabled: true });
  const selected = session.world.render(5, 0, 3).cells;
  for (let i = 0; i < selected.length; i += 12) {
    expect([...selected.slice(i + 4, i + 7)]).toEqual([...colors.slice(i + 4, i + 7)]);
    expect(selected[i + 11]).toBe(0);
  }
  expect(session.status().phenotype!.groups[1].count).toBe(0);
  session.setPhenotype({ action: "panel", enabled: false });
  session.setChemicalWeb({ enabled: false });
  session.setPhenotype({ action: "highlight", enabled: false });
  expect(session.status().phenotype).toBeNull();
  session.world.step();
  control.step();
  expectSavedPhysicalState(reader, session.world.snapshot(), control.snapshot());
  session.world.dispose();
  control.dispose();
});

it("pins complete groups through paged roots and saves bounded observer history", async () => {
  const session = await fixture(300);
  session.setPhenotype({ action: "panel", enabled: true });
  session.setPhenotype({ action: "pin" });
  expect(session.observation.pin!.roots).toHaveLength(300);
  expect(() => session.setPhenotype({ action: "pin" })).toThrow(/Remove the current pin/);
  for (let i = 0; i < 25; i++) session.step();
  session.setPhenotype({ action: "panel", enabled: false });
  const status = session.status();
  expect(status.phenotype!.groups[2].count).toBe(status.summary.population);
  expect(status.history.at(-1)!.phenotype!.count).toBe(status.summary.population);
  const empty = { status: null, inspection: null };
  const view = { status, inspection: null };
  const delta = observationDelta(empty, view);
  checkObservationBudget(delta);
  expect(applyObservation(empty, structuredClone(delta))).toEqual(view);
  expect(JSON.stringify(delta)).not.toContain('"roots":[');
  const checkpoint = await session.export();
  const saved = (await decodePackage(checkpoint)).metadata.observation;
  validateObservation(saved, status.summary.tick);
  await session.restore(checkpoint);
  expect(session.status().phenotype!.pin!.id).toBe(status.phenotype!.pin!.id);
  expect(session.status().phenotype!.groups[2].count).toBe(status.phenotype!.groups[2].count);
  expect(session.status().phenotype!.window.seconds).toBe(0);
  session.setPhenotype({ action: "unpin" });
  expect(session.observation.pin).toBeNull();
  expect(session.status().phenotype).toBeNull();
  session.world.dispose();
});

it("validates retained distributions and pin roots without widening the hot reply boundary", async () => {
  const session = await fixture();
  session.setPhenotype({ action: "panel", enabled: true });
  session.setPhenotype({ action: "pin" });
  const good = structuredClone(session.observation);
  validateObservation(good, 0);
  const bad = structuredClone(good);
  bad.pin!.roots.push(bad.pin!.roots[0]);
  expect(() => validateObservation(bad, 0)).toThrow(/phenotype/);
  const wrong = structuredClone(good);
  wrong.history[0].phenotype!.actual[0] = [3, 2, 1];
  expect(() => validateObservation(wrong, 0)).toThrow(/phenotype/);
  const observed = session.status().phenotype!;
  expect(new TextEncoder().encode(JSON.stringify(observed)).length).toBeLessThan(16384);
  session.restart(28, { width: 24, height: 24, founders: 2, sourceCount: 2 });
  expect(session.status().phenotype!.pin).toBeNull();
  session.world.dispose();
});

it("thins pinned history with the existing chart history and publishes only the new point", async () => {
  const session = await fixture();
  session.setPhenotype({ action: "panel", enabled: true });
  session.setPhenotype({ action: "pin" });
  const initial = session.observation.history[0];
  session.observation.history = Array.from({ length: 240 }, (_, tick) => ({ ...initial, tick }));
  session.world.step(249);
  const before = { status: session.status(), inspection: null };
  session.step();
  const after = { status: session.status(), inspection: null };
  expect(after.status.history).toHaveLength(121);
  const delta = observationDelta(before, after);
  expect(delta.history!.append).toHaveLength(1);
  expect(delta.history!.keep).toHaveLength(120);
  expect(delta.history!.append[0].phenotype!.id).toBe(session.observation.pin!.id);
  expect(applyObservation(before, structuredClone(delta))).toEqual(after);
  validateObservation(session.observation, 250);
  session.world.dispose();
});
