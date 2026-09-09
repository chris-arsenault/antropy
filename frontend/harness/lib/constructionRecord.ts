import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { type World } from "../../src/sim/types";
import { encodeCheckpoint } from "../../src/persist/checkpoint";
import { flag, type Flags } from "./flags";
import { openLedger, recordRun } from "./ledger";

const LABELS: Record<string, string> = {
  "default-pressure-audit": "Run-only default; construction and colony outcomes",
  "construction-pressures": "autonomous pressure comparison; not survival certification",
  "collective-work": "collective work, attributed trips and spatial use; not motion certification",
};

export function constructionDriver(flags: Flags): "colony-programmed" | "colony-lgp" {
  const driver = flag(flags, "driver", "colony-programmed");
  if (driver !== "colony-programmed" && driver !== "colony-lgp") throw new Error("invalid driver");
  return driver;
}

export function recordConstruction(
  world: World,
  flags: Flags,
  experiment: string,
  sourceDigest: string,
  summary: Record<string, unknown>,
  wallMs: number
): void {
  const db = openLedger();
  const id = recordRun(db, {
    experiment,
    label: LABELS[experiment] ?? "requested work; not survival certification",
    driver: world.scenario,
    seed: world.seed,
    ticks: world.tick,
    params: { config: world.config, sourceDigest, flags: Object.fromEntries(flags.values) },
    summary,
    wallMs,
  });
  db.close();
  const output = flag(flags, "output", "");
  if (output) {
    mkdirSync(resolve(output), { recursive: true });
    writeFileSync(
      resolve(output, `${experiment}-${world.scenario}-${world.seed}-${id}.json`),
      encodeCheckpoint(world)
    );
  }
  console.log(JSON.stringify({ id, ...summary }));
}
