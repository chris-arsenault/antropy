import "fake-indexeddb/auto";
import { expect, it } from "vitest";
import { HealthRecorder, readRuntimeHealth } from "./runtimeHealth";
import { type LiveStatus } from "./types";

it("keeps bounded scalar breadcrumbs and retains a fault arriving during a write", async () => {
  const status = {
    running: true,
    error: null,
    kernelDigest: "test",
    memoryBytes: 1234,
    history: [],
    recovery: "saved",
    summary: { tick: 250000, population: 70, ancestryRecords: 10000, genomes: 90 },
  } as unknown as LiveStatus;
  const health = new HealthRecorder();
  health.observe("faulted", status, [1200, 800]);
  health.fault("graphics failed");
  await expect.poll(async () => (await readRuntimeHealth())[0]?.state).toBe("fault");
  expect((await readRuntimeHealth())[0]).toMatchObject({ tick: 250000, error: "graphics failed" });
  for (let i = 0; i < 10; i++) new HealthRecorder().observe(`bounded-${i}`, status, null);
  await expect.poll(async () => (await readRuntimeHealth()).length).toBe(8);
  expect(JSON.stringify(await readRuntimeHealth())).not.toContain("chromosomes");
});
