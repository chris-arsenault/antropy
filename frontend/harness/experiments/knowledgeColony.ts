import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { scenarioConfig } from "../../src/sim/scenarios";
import { createWorld, stepWorld } from "../../src/sim/world";
import { encodeCheckpoint } from "../../src/persist/checkpoint";
import { type TerrainLayout } from "../../src/sim/config";
import { colonyOutcomePoint, scoreColonyOutcome } from "../lib/colonyOutcome";
import { flag, integerFlag, type Flags } from "../lib/flags";
import { openLedger, recordRun } from "../lib/ledger";
import { type World } from "../../src/sim/types";
import { physicsDigest } from "../lib/colonyArtifacts";

function countRequests(world: World, counts: Record<string, number>): void {
  for (const ant of world.ants) {
    const entry = ant.decision.history.at(-1);
    if (!entry) continue;
    const key = `${entry.request.kind}:${entry.result}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
}

export function runKnowledgeColony(flags: Flags): void {
  const driver = flag(flags, "driver", "colony-programmed");
  if (driver !== "colony-programmed" && driver !== "colony-lgp")
    throw new Error("unknown knowledge driver");
  const layout = flag(flags, "layout", "compact");
  if (!["baseline", "reference", "compact", "tiered"].includes(layout))
    throw new Error("unknown terrain layout");
  const ticks = integerFlag(flags, "ticks", 48_000),
    seed = integerFlag(flags, "seed", 101);
  const base = scenarioConfig(driver, layout as TerrainLayout);
  const gravity = flag(flags, "gravity", "true");
  if (!["true", "false"].includes(gravity)) throw new Error("invalid gravity flag");
  const config = { ...base, environment: { ...base.environment, gravity: gravity === "true" } };
  const sourceDigest = physicsDigest();
  const world = createWorld(seed, driver, config);
  const series = [colonyOutcomePoint(world)];
  const counts: Record<string, number> = {};
  const start = performance.now();
  for (let tick = 1; tick <= ticks; tick++) {
    stepWorld(world);
    countRequests(world, counts);
    if (tick % 1000 === 0 || tick === ticks) series.push(colonyOutcomePoint(world));
    if (tick % 8000 === 0) console.error(JSON.stringify(colonyOutcomePoint(world)));
  }
  const summary = {
    ...scoreColonyOutcome(series, config.workerLifespan),
    series,
    counts,
    knowledge: [...world.knowledge.locations.values()],
    workers: world.ants.map((ant) => ({
      id: ant.id,
      x: ant.x,
      y: ant.y,
      cargo: ant.cargo,
      task: ant.task,
      history: ant.decision.history,
    })),
  };
  const database = openLedger();
  const id = recordRun(database, {
    experiment: "knowledge-colony",
    label: layout,
    driver,
    seed,
    ticks,
    params: {
      config,
      sourceDigest,
      genomeHash: createHash("sha256").update(JSON.stringify(world.linearGenome)).digest("hex"),
    },
    summary,
    wallMs: Math.round(performance.now() - start),
  });
  database.close();
  const output = flag(flags, "output", "");
  if (output) {
    mkdirSync(resolve(output), { recursive: true });
    writeFileSync(resolve(output, "checkpoint.json"), encodeCheckpoint(world));
  }
  console.log(JSON.stringify({ id, ...summary }, null, 2));
}
