import { existsSync } from "node:fs";
import { delimiter, resolve } from "node:path";

/** Resolve installed tools before execution; no shell interpolation. */
export function executable(name) {
  for (const directory of (process.env.PATH ?? "").split(delimiter)) {
    if (!directory) continue;
    const path = resolve(directory, name);
    if (existsSync(path)) return path;
  }
  throw new Error(`Required toolchain executable unavailable: ${name}`);
}
