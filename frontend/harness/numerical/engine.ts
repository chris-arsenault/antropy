import { readFileSync, copyFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { Engine } from "../../src/engine/client";
const loaded = new WeakMap<Engine, Uint8Array<ArrayBuffer>>();

/** Harness worlds never inherit fields implicitly: a request names the physical preset its
 * overrides start from, or supplies every field, as a configuration read from a checkpoint does. */
export function presetGuard(complete: string[]) {
  return (op: string, payload: Record<string, unknown>) => {
    if ((op !== "create" && op !== "configuration") || payload.diagnostic) return;
    const config = (payload.config ?? {}) as Record<string, unknown>;
    if (config.preset === "ecology" || config.preset === "diagnostic") return;
    if (complete.every((key) => key in config)) return;
    throw new Error(`Harness ${op} must select preset "ecology" or "diagnostic"`);
  };
}

function presetFields(engine: Engine) {
  try {
    const request = { config: { preset: "diagnostic" } };
    return Object.keys(
      engine.command<{ config: Record<string, unknown> }>("configuration", request).config
    );
  } catch {
    return null;
  }
}

export async function loadEngine(
  path = new URL("../../public/antropy-engine.wasm", import.meta.url)
) {
  const bytes = readFileSync(path);
  const source = new Uint8Array(bytes);
  const engine = await Engine.load(source);
  const complete = presetFields(engine);
  // Archived kernels predate presets; their own defaults are their recorded physics.
  if (complete) engine.guardCommands(presetGuard(complete));
  loaded.set(engine, source);
  return engine;
}

export function captureEngine(output: string, engine?: Engine) {
  const path = new URL("../../public/antropy-engine.wasm", import.meta.url);
  if (engine) {
    const bytes = loaded.get(engine);
    if (!bytes) throw new Error("Loaded kernel bytes are unavailable");
    writeFileSync(`${output}/engine.wasm`, bytes);
    return createHash("sha256").update(bytes).digest("hex");
  }
  copyFileSync(path, `${output}/engine.wasm`);
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}
