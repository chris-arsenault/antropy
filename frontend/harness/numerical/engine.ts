import { readFileSync, copyFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { Engine } from "../../src/engine/client";
const loaded = new WeakMap<Engine, Uint8Array<ArrayBuffer>>();

export async function loadEngine(
  path = new URL("../../public/antropy-engine.wasm", import.meta.url)
) {
  const bytes = readFileSync(path);
  const source = new Uint8Array(bytes);
  const engine = await Engine.load(source);
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
