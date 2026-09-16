// @vitest-environment node
import { PerformanceObserver } from "node:perf_hooks";
import { afterEach, expect, it, vi } from "vitest";
import { releaseDevelopmentTimings } from "./developmentTimings";

afterEach(() => {
  vi.unstubAllGlobals();
  performance.clearMeasures();
});

it("releases repeated React timing payloads while preserving other timing records", async () => {
  vi.stubGlobal("PerformanceObserver", PerformanceObserver);
  const dispose = releaseDevelopmentTimings();
  try {
    performance.measure("application", { start: 0, end: 1, detail: { retained: true } });
    for (let batch = 0; batch < 3; batch++) {
      for (let i = 0; i < 20; i++) {
        const devtools =
          i % 2
            ? { track: "Components ⚛", properties: [["props", "x".repeat(10000)]] }
            : { track: "Blocking", trackGroup: "Scheduler ⚛" };
        performance.measure("react", { start: 0, end: 1, detail: { devtools } });
      }
      await expect.poll(() => performance.getEntriesByName("react").length).toBe(0);
      expect(performance.getEntriesByName("application")).toHaveLength(1);
    }
  } finally {
    dispose();
  }
  performance.measure("after-disposal", {
    start: 0,
    end: 1,
    detail: { devtools: { track: "Components ⚛" } },
  });
  await new Promise((resolve) => setImmediate(resolve));
  expect(performance.getEntriesByName("after-disposal")).toHaveLength(1);
});

it("does not require performance observation on unsupported hosts", () => {
  vi.stubGlobal("PerformanceObserver", undefined);
  expect(() => releaseDevelopmentTimings()()).not.toThrow();
  vi.stubGlobal("PerformanceObserver", { supportedEntryTypes: [] });
  expect(() => releaseDevelopmentTimings()()).not.toThrow();
});
