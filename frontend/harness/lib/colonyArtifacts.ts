import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { validateColonyModel } from "../../src/sim/controller/colonyNetwork";
import { validateDirectionalModel } from "../../src/sim/controller/directionalModel";
import { type ColonyModel } from "./learnedColony";
import { validateRegisteredModel } from "../../src/sim/controller/registeredModel";

export function digest(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export function loadColonyModel(path: string): ColonyModel {
  const model = JSON.parse(readFileSync(path, "utf8")) as ColonyModel;
  if (model.version === 5) return validateRegisteredModel(model);
  return model.version === 1 ? validateColonyModel(model) : validateDirectionalModel(model);
}

export function physicsDigest(root = "src/sim"): string {
  return digest(
    JSON.stringify(
      runtimeSources(root)
        .sort()
        .map((path) => [relative(root, path), readFileSync(path, "utf8")])
    )
  );
}

/** Includes newly extracted runtime modules automatically; model payloads have their own hash. */
function runtimeSources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return runtimeSources(path);
    return entry.name.endsWith(".ts") && !/\.(test|spec)\.ts$/.test(entry.name) ? [path] : [];
  });
}
