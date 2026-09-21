import { afterEach, expect, it, vi } from "vitest";
import { computeWorkers, loadBrowserEngine } from "./threadedLoader";

afterEach(() => vi.unstubAllGlobals());
it("bounds the persistent pool and leaves capacity for the UI", () => {
  expect([0, 1, 2, 6, 16, 32, 128].map(computeWorkers)).toEqual([1, 1, 1, 5, 15, 31, 32]);
});
it("selects the ordinary serial module when isolation is unavailable", async () => {
  vi.stubGlobal("crossOriginIsolated", false);
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  expect(await loadBrowserEngine("/antropy-engine.wasm")).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
});
