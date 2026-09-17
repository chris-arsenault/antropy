// @vitest-environment node
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, expect, it, vi } from "vitest";
import { type Engine } from "../../src/engine/client";
import { loadEngine } from "../numerical/engine";
import { evolveSettings } from "./evolveRun";
import { parseFlags } from "./flags";
import { runRecorded } from "./longRun";
import { recordMeasurement } from "./bacteriaRun";
import { resourceStop, studyLimits, validateAccounts } from "./studyBudget";
import { type Summary } from "../../src/engine/types";

vi.mock("./ledger", () => ({ openLedger: () => ({ close() {} }), recordRun: () => 1 }));
let engine: Engine;
beforeAll(async () => {
  engine = await loadEngine();
});

it("honors evolution wall budgets and rejects conflicting, invalid and unknown flags", () => {
  const settings = (...args: string[]) =>
    evolveSettings(parseFlags(["--ticks", "2", ...args]), engine);
  expect(settings("--wall-seconds", "30").wallSeconds).toBe(30);
  expect(settings("--wall", "30").wallSeconds).toBe(30);
  expect(settings("--wall", "30", "--wall-seconds", "30").wallSeconds).toBe(30);
  expect(() => settings("--wall", "30", "--wall-seconds", "40")).toThrow("Conflicting");
  expect(() => settings("--wall-seconds", "0")).toThrow("positive");
  expect(() => settings("--wall-seconds", "1.5")).toThrow("integer");
  expect(() => settings("--wall-second", "30")).toThrow("Unknown option");
});

it("feeds current producer artifacts to the Python reader without an ecological run", () => {
  const root = mkdtempSync(join(tmpdir(), "antropy-report-"));
  const world = engine.create(101, { width: 24, height: 24, sourceCount: 0 });
  try {
    runRecorded(engine, world, {
      directory: join(root, "evolution"),
      experiment: "contract-test",
      label: "current producer",
      ticks: 0,
      cadence: 1,
      checkpointEvery: 1,
      wallSeconds: 1,
      provenance: {},
    });
    execFileSync("/usr/bin/python3", ["harness/evolve_chemistry_test.py", root, "--contract"], {
      encoding: "utf8",
      timeout: 10000,
    });
    recordMeasurement(engine, world, 0, join(root, "bacteria"), "contract-test");
    const result = JSON.parse(readFileSync(join(root, "bacteria/run-1/result.json"), "utf8"));
    expect(result.checkpointVersion).toBe(world.command<{ version: number }>("definition").version);
  } finally {
    world.dispose();
    rmSync(root, { recursive: true, force: true });
  }
});

it("stops at a resource boundary and preserves a restorable partial run", () => {
  const root = mkdtempSync(join(tmpdir(), "antropy-budget-"));
  const world = engine.create(101, { width: 24, height: 24, sourceCount: 0 });
  let checks = 0;
  try {
    const result = runRecorded(engine, world, {
      directory: join(root, "partial"),
      experiment: "contract-test",
      label: "bounded stop",
      ticks: 10,
      cadence: 5,
      checkpointEvery: 100,
      wallSeconds: 5,
      provenance: {},
      stop: () => (++checks === 3 ? "resource limit: rss" : null),
    });
    expect(result.final.tick).toBe(2);
    expect(result.stop).toBe("resource limit: rss");
    const manifest = JSON.parse(readFileSync(join(root, "partial/manifest.json"), "utf8"));
    expect(manifest.status).toBe("incomplete");
    const restored = engine.restore(readFileSync(join(root, "partial/checkpoint.bin")));
    try {
      expect(restored.command<Summary>("summary")).toEqual(result.final);
    } finally {
      restored.dispose();
    }
    validateAccounts(result.final);
    expect(() => validateAccounts({ ...result.final, energyResidual: 100 })).toThrow("residual");
    expect(
      resourceStop({
        rss: studyLimits.rss,
        wasm: 0,
        caseBytes: 0,
        studyBytes: 0,
        freeBytes: studyLimits.freeBytes,
      })
    ).toBe("resource limit: rss");
  } finally {
    world.dispose();
    rmSync(root, { recursive: true, force: true });
  }
});
