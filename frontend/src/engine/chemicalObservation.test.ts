// @vitest-environment node
import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";
import { Engine } from "./client";
import { Session } from "./session";
import { observationDelta } from "./observationDelta";
import { checkObservationBudget } from "./observationBudget";
import { type ChemicalOverview } from "./types";

it("publishes bounded chemistry once per observed tick and invalidates on replacement", async () => {
  const engine = await Engine.load(
    new Uint8Array(readFileSync("public/antropy-engine.wasm")),
    true
  );
  const session = new Session(engine);
  session.restart(101, { width: 24, height: 24, founders: 2, sourceCount: 2 });
  const calls = vi.spyOn(session.world, "command");
  const a = session.status();
  const b = session.status();
  expect(a.chemicals).toBe(b.chemicals);
  expect(calls.mock.calls.filter(([op]) => op === "chemicalOverview")).toHaveLength(1);
  expect(
    observationDelta({ status: a, inspection: null }, { status: b, inspection: null }).status
      .chemicals
  ).toBeUndefined();
  session.step();
  const before = session.world.snapshot();
  const c = session.status();
  expect(c.chemicals).not.toBe(a.chemicals);
  expect(c.chemicals.total).toBeGreaterThan(0);
  expect(c.chemicals.rows.length).toBeLessThanOrEqual(12);
  expect(c.chemicals.rows.reduce((sum, r) => sum + r.amount, c.chemicals.other)).toBeCloseTo(
    c.chemicals.total
  );
  const delta = observationDelta({ status: a, inspection: null }, { status: c, inspection: null });
  expect(() => checkObservationBudget(delta)).not.toThrow();
  expect(session.world.snapshot()).toEqual(before);
  session.restart(102, { width: 24, height: 24, founders: 2, sourceCount: 2 });
  expect(session.status().chemicals).not.toBe(c.chemicals);
  const invalid: ChemicalOverview = {
    ...c.chemicals,
    rows: Array.from({ length: 13 }, () => c.chemicals.rows[0]),
  };
  expect(() => checkObservationBudget({ ...delta, status: { chemicals: invalid } })).toThrow(
    "12 rows"
  );
  session.world.dispose();
});
