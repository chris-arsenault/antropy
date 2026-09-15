// @vitest-environment node
import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";
import { Engine } from "./client";
import { Session } from "./session";
import { applyObservation, observationDelta, type ObservationView } from "./observationDelta";
import { ObservationPublisher } from "./observationPublisher";
import { checkObservationBudget } from "./observationBudget";

const empty: ObservationView = { status: null, inspection: null };
async function fixture() {
  const engine = await Engine.load(new Uint8Array(readFileSync("public/antropy-engine.wasm")));
  const session = new Session(engine);
  session.restart(101, { width: 24, height: 24, founders: 2, sourceCount: 2 });
  const status = session.status();
  session.world.dispose();
  return status;
}

it("transmits history only once and retains chart identity across append, thinning and reset", async () => {
  const status = await fixture();
  const full = {
    ...status,
    history: Array.from({ length: 240 }, (_, i) => ({ ...status.history[0], tick: i * 25 })),
  };
  const first = { status: full, inspection: null };
  let received = applyObservation(empty, structuredClone(observationDelta(empty, first)));
  const next = {
    status: {
      ...full,
      history: [...full.history.filter((_, i) => i % 2 === 0), { ...full.history[0], tick: 6000 }],
    },
    inspection: null,
  };
  const delta = observationDelta(first, next);
  expect(delta.history!.append).toHaveLength(1);
  expect(delta.history!.keep).toHaveLength(120);
  expect(delta.status.population).toBeUndefined();
  expect(delta.status.regions).toBeUndefined();
  const retained = received.status!.history[2];
  received = applyObservation(received, structuredClone(delta));
  expect(received).toEqual(next);
  expect(received.status!.history[1]).toBe(retained);
  const unchanged = observationDelta(next, next);
  expect(unchanged.history).toBeNull();
  expect(unchanged.inspection).toBeNull();
  expect(applyObservation(empty, observationDelta(empty, first))).toEqual(first);
});

it("coalesces publications before reading diagnostics and waits for the matching acknowledgement", async () => {
  const status = await fixture(),
    send = vi.fn(),
    publisher = new ObservationPublisher(send);
  const read = vi.fn(() => ({ status, inspection: null }));
  publisher.publish(read);
  for (let i = 0; i < 50; i++) publisher.publish(read);
  publisher.acknowledge(999);
  expect(read).toHaveBeenCalledTimes(1);
  expect(send).toHaveBeenCalledTimes(1);
  publisher.acknowledge(1);
  expect(read).toHaveBeenCalledTimes(2);
  expect(send.mock.calls[1][1].history).toBeNull();
  publisher.reset();
  publisher.publish(read);
  publisher.acknowledge(2);
  expect(send.mock.calls[2][1].history.append).toEqual(status.history);
});

it("expires recent samples without retransmitting the retained window", async () => {
  const status = await fixture();
  const sample = { tick: 0, population: 2, bins: status.population.efforts.map((e) => e.bins) };
  const before = {
    status: {
      ...status,
      recent: Array.from({ length: 81 }, (_, i) => ({ ...sample, tick: i * 25 })),
    },
    inspection: null,
  };
  const after = {
    status: { ...status, recent: [...before.status.recent.slice(1), { ...sample, tick: 2025 }] },
    inspection: null,
  };
  const delta = observationDelta(before, after);
  expect(delta.recent!.keep).toHaveLength(80);
  expect(delta.recent!.append).toHaveLength(1);
  expect(applyObservation(before, structuredClone(delta))).toEqual(after);
});

it("rejects memory buffers, added bulk state and oversized observation trees before cloning", async () => {
  const delta = observationDelta(empty, { status: await fixture(), inspection: null });
  expect(() => checkObservationBudget(delta)).not.toThrow();
  Object.assign(delta.status, { cells: new Float32Array(100) });
  expect(() => checkObservationBudget(delta)).toThrow("unsupported status field");
  Reflect.deleteProperty(delta.status, "cells");
  Object.assign(delta.status, { regions: new Float32Array(100) });
  expect(() => checkObservationBudget(delta)).toThrow("memory buffers");
  Object.assign(delta.status, { regions: Array(400001).fill(0) });
  expect(() => checkObservationBudget(delta)).toThrow("budget exceeded");
});
