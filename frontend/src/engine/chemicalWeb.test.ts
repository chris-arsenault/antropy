// @vitest-environment node
import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";
import { Engine } from "./client";
import { Session } from "./session";
import { observationDelta } from "./observationDelta";
import { checkObservationBudget } from "./observationBudget";
import { ChemicalWebObservation } from "./chemicalWeb";

it("requests bounded routes only while open, caches unchanged ticks and resets on replacement", async () => {
  const engine = await Engine.load(
    new Uint8Array(readFileSync("public/antropy-engine.wasm")),
    true
  );
  const session = new Session(engine);
  session.restart(101, { width: 24, height: 24, founders: 2, sourceCount: 2 });
  const calls = vi.spyOn(session.world, "command");
  const before = session.world.snapshot();
  expect(session.status().chemicalWeb).toBeNull();
  expect(calls.mock.calls.filter(([op]) => op === "chemicalWeb")).toHaveLength(0);
  const query = { mode: "primary", focus: null, offset: 0 };
  session.chemicalWeb.select(query);
  const a = session.status(),
    b = session.status();
  expect(a.chemicalWeb).toBe(b.chemicalWeb);
  expect(a.chemicalWeb!.rows.reduce((sum, r) => sum + r.primary, a.chemicalWeb!.unassigned)).toBe(
    2
  );
  const unchanged = observationDelta(
    { status: a, inspection: null },
    { status: b, inspection: null }
  );
  expect(unchanged.status.chemicalWeb).toBeUndefined();
  expect(session.world.snapshot()).toEqual(before);
  session.step();
  const c = session.status();
  expect(c.chemicalWeb).not.toBe(a.chemicalWeb);
  expect(() =>
    checkObservationBudget(
      observationDelta({ status: a, inspection: null }, { status: c, inspection: null })
    )
  ).not.toThrow();
  session.chemicalWeb.select({ ...query, mode: "supported" });
  expect(session.status().chemicalWeb!.mode).toBe("supported");
  const invalid = {
    ...c.chemicalWeb!,
    rows: Array.from({ length: 65 }, () => c.chemicalWeb!.rows[0]),
  };
  expect(() => checkObservationBudget({ ...unchanged, status: { chemicalWeb: invalid } })).toThrow(
    "64-route"
  );
  session.restart(27, { width: 24, height: 24, founders: 2, sourceCount: 2 });
  expect(session.status().chemicalWeb!.tick).toBe(0);
  expect(session.status().chemicalWeb).not.toBe(a.chemicalWeb);
  session.chemicalWeb.select({ enabled: false });
  expect(session.status().chemicalWeb).toBeNull();
  session.world.dispose();
});

it("rejects invalid chemical IDs, pages and modes before asking the engine", () => {
  const observation = new ChemicalWebObservation();
  for (const patch of [
    { focus: 256 },
    { focus: -1 },
    { focus: 1.5 },
    { offset: -1 },
    { offset: 65537 },
    { mode: "flux" },
  ]) {
    expect(() =>
      observation.select({ mode: "primary", focus: null, offset: 0, ...patch })
    ).toThrow();
  }
});
