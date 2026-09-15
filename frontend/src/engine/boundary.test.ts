// @vitest-environment node
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { IDBFactory, IDBObjectStore } from "fake-indexeddb";
import { Engine } from "./client";
import { Session } from "./session";
import { encodePackage, decodePackage } from "./package";
import { listRecoveries, loadRecovery, storeRecovery } from "./recovery";
import { type Definition } from "./types";

const bytes = new Uint8Array(
  readFileSync(new URL("../../public/antropy-engine.wasm", import.meta.url))
);
beforeEach(() => vi.stubGlobal("indexedDB", new IDBFactory()));
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const compact = { width: 24, height: 24, founders: 2, sourceCount: 2 };

it("keeps v4 chemical metadata bounded and rejects old physical bytes inside the unchanged package", async () => {
  const session = new Session(await Engine.load(bytes, true));
  session.restart(101, compact);
  const definition = session.world.command<Definition>("definition");
  expect(definition.version).toBe(12);
  expect(definition.chemistry.version).toBe(4);
  expect(definition.chemistry.properties).toHaveLength(256);
  expect(definition.chemistry.properties.every((p) => p.interaction.length === 2)).toBe(true);
  expect(definition.chemistry.profiles.coefficients).toHaveLength(2);
  expect(new TextEncoder().encode(JSON.stringify(definition)).length).toBeLessThan(2 * 1024 * 1024);
  const before = session.world.snapshot();
  const exported = await session.export();
  expect((await decodePackage(exported)).metadata.version).toBe(11);
  const old = before.slice();
  old.set(new TextEncoder().encode("ANTROPY11\0"));
  const incompatible = await encodePackage(old, {
    seed: 101,
    tick: 0,
    observation: session.observation,
  });
  await expect(session.restore(incompatible)).rejects.toThrow("v12 required");
  expect(session.world.snapshot()).toEqual(before);
  session.world.dispose();
});

it("borrows render storage and refreshes world and chemical selection without changing physics", async () => {
  const engine = await Engine.load(bytes);
  const a = engine.create(101, compact),
    b = engine.create(102, { ...compact, sourceCount: 0 });
  a.command("intervene", { deposit: { x: 12, y: 12, species: 128, amount: 2 } });
  const before = a.snapshot();
  const first = a.render(4, 128),
    buffer = first.cells.buffer;
  expect(first.field.buffer).toBe(buffer);
  expect(first.field.reduce((s, n) => s + n, 0)).toBeGreaterThan(0);
  const same = a.render(4, 128);
  expect(same.cells.buffer).toBe(buffer);
  expect(same.cells.byteOffset).toBe(first.cells.byteOffset);
  expect(b.render(4, 128, 0, false).field.every((n) => n === 0)).toBe(true);
  expect(a.render(4, 128, 0, false).field.some((n) => n > 0)).toBe(true);
  expect(a.render(4, 255, 0, false).field.every((n) => n === 0)).toBe(true);
  expect(a.snapshot()).toEqual(before);
  a.dispose();
  b.dispose();
  expect(() => a.render()).toThrow("disposed");
});

it("restores the exact physical continuation and retained observations, paused", async () => {
  const session = new Session(await Engine.load(bytes));
  session.restart(101, compact);
  session.world.step(3);
  session.status();
  const observation = structuredClone(session.observation);
  const checkpoint = await session.export(),
    original = session.world.snapshot();
  session.world.step(5);
  const expected = session.world.snapshot();
  await session.restore(checkpoint);
  expect(session.running).toBe(false);
  expect(session.observation).toEqual(observation);
  expect(session.observation.history.at(-1)?.tick).toBe(3);
  expect(session.world.snapshot()).toEqual(original);
  session.world.step(5);
  expect(session.world.snapshot()).toEqual(expected);
  session.world.dispose();
});

it("rejects corrupt or mismatched packages without discarding the current world", async () => {
  const session = new Session(await Engine.load(bytes));
  session.restart(101, compact);
  const before = session.world.snapshot();
  await expect(session.restore(new Blob(["invalid"]))).rejects.toThrow();
  const mismatch = await encodePackage(before, {
    seed: 999,
    tick: 0,
    observation: session.observation,
  });
  await expect(session.restore(mismatch)).rejects.toThrow("disagrees");
  expect(session.world.snapshot()).toEqual(before);
  session.world.dispose();
});

it("does not let a pending import overwrite a newer restart", async () => {
  const session = new Session(await Engine.load(bytes));
  session.restart(101, compact);
  const blob = await session.export(),
    restore = session.restore(blob);
  session.restart(102, compact);
  await expect(restore).rejects.toThrow("superseded");
  expect(session.world.command<Definition>("definition").seed).toBe(102);
  session.world.dispose();
});

it("retains six automatic and two manual saves and works without randomUUID", async () => {
  vi.stubGlobal("crypto", { getRandomValues: crypto.getRandomValues.bind(crypto) });
  const metadata = { seed: 101, runId: "run", rawBytes: 4 };
  for (let tick = 0; tick < 12; tick++) {
    await storeRecovery(new Blob([String(tick)]), {
      ...metadata,
      tick,
      reason: tick < 3 ? "manual" : "automatic",
    });
  }
  const records = await listRecoveries();
  expect(records.map((r) => r.tick)).toEqual([11, 10, 9, 8, 7, 6, 2, 1]);
  expect(await (await loadRecovery()).text()).toBe("11");
  vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(() => {
    throw new Error("quota unavailable");
  });
  await expect(
    storeRecovery(new Blob(["next"]), { ...metadata, tick: 12, reason: "automatic" })
  ).rejects.toThrow("quota unavailable");
  expect(await (await loadRecovery()).text()).toBe("11");
});

it("pauses on failed recovery and preserves the last successful physical checkpoint", async () => {
  const session = new Session(await Engine.load(bytes));
  session.restart(101, compact);
  session.world.step(1);
  await session.save("manual");
  const first = (await decodePackage(await loadRecovery())).snapshot;
  session.world.step(1);
  session.setRunning(true);
  vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(() => {
    throw new Error("quota unavailable");
  });
  await expect(session.save("automatic")).rejects.toThrow("quota unavailable");
  expect(session.running).toBe(false);
  expect(session.recovery).toContain("Paused: recovery failed");
  expect((await decodePackage(await loadRecovery())).snapshot).toEqual(first);
  session.world.dispose();
});
