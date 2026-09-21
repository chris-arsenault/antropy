import { type EngineExports } from "./client";
import { SOURCE_DIGEST } from "./runtimeIdentity";

interface ThreadModule {
  default(options?: { module_or_path: URL }): Promise<EngineExports>;
  initThreadPool(threads: number): Promise<void>;
}

export function computeWorkers(cores: number) {
  return Math.max(1, Math.min(32, Math.floor(cores || 1) - 1));
}

export async function loadBrowserEngine(wasmUrl: string, requestedWorkers?: number) {
  if (!globalThis.crossOriginIsolated || typeof SharedArrayBuffer === "undefined") return null;
  const base = new URL("engine-threads/", new URL(wasmUrl, globalThis.location.href));
  const entry = new URL(`engine.js?v=${SOURCE_DIGEST}`, base).href;
  const module = (await import(/* @vite-ignore */ entry)) as ThreadModule;
  const exports = await module.default({
    module_or_path: new URL(`engine_bg.wasm?v=${SOURCE_DIGEST}`, base),
  });
  const workers = requestedWorkers ?? computeWorkers(navigator.hardwareConcurrency);
  if (!Number.isInteger(workers) || workers < 1 || workers > 32)
    throw new Error("Compute worker count must be from 1 to 32");
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      module.initThreadPool(workers),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Compute worker pool did not start within 30 seconds")),
          30000
        );
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
  if (!(exports.memory.buffer instanceof SharedArrayBuffer))
    throw new Error("Threaded engine did not provide shared WASM memory");
  const response = await fetch(new URL("build.json", base), { cache: "no-store" });
  if (!response.ok) throw new Error(`Threaded engine identity unavailable: ${response.status}`);
  const identity = (await response.json()) as { sourceDigest: string };
  return { exports, sourceDigest: identity.sourceDigest, workers };
}
