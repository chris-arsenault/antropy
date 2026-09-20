/** Registered L4 capacities; load one binary per process to avoid retained WASM heaps. */
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { loadEngine } from "./engine";
import { runCapacity } from "./capacity";

const [binary, output, mode] = process.argv.slice(2);
if (!binary || !output || (mode && mode !== "mature-sized"))
  throw new Error("Expected kernel.wasm, new output directory and optional mature-sized");
const engine = await loadEngine(pathToFileURL(resolve(binary)));
await runCapacity(output, engine, mode ? [[4166, false]] : undefined);
