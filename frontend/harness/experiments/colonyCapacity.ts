import { cpus } from "node:os";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createWorld, stepWorld } from "../../src/sim/world";
import { scenarioConfig } from "../../src/sim/scenarios";
import { energyResidual } from "../../src/sim/resources";
import { capacityBudget, spreadCapacityFounders, timingSummary } from "../lib/colonyCapacity";
import { flag, integerFlag, type Flags } from "../lib/flags";
import { physicsDigest } from "../lib/colonyArtifacts";
import { openLedger, recordRun } from "../lib/ledger";

export function runColonyCapacity(flags: Flags): void {
  const count = integerFlag(flags, "workers", 8);
  const ticks = integerFlag(flags, "ticks", 30);
  const seed = integerFlag(flags, "seed", 101);
  const driver = flag(flags, "driver", "colony-programmed");
  if (!["colony-programmed", "colony-lgp"].includes(driver)) throw new Error("invalid driver");
  if (count < 1 || count > 2000 || ticks < 1) throw new Error("invalid capacity probe size");
  const scenario = driver as "colony-programmed" | "colony-lgp";
  const config = { ...scenarioConfig(scenario, "compact"), workerCount: count };
  const sourceDigest = physicsDigest();
  const setup = performance.now();
  const world = createWorld(seed, scenario, config);
  spreadCapacityFounders(world);
  const setupMs = performance.now() - setup;
  const budget = capacityBudget(world, 2000);
  for (let i = 0; i < 10; i++) stepWorld(world);
  const samples: number[] = [];
  for (let i = 0; i < ticks; i++) {
    const start = performance.now();
    stepWorld(world);
    samples.push(performance.now() - start);
  }
  const summary = {
    kind: "capacity fixture; not demographic survival",
    budget,
    setupMs,
    timing: timingSummary(samples),
    finalWorkers: world.ants.length,
    knowledgeRecords: world.knowledge.locations.size,
    energyResidual: energyResidual(world),
  };
  const database = openLedger();
  const id = recordRun(database, {
    experiment: "colony-capacity",
    label: flag(flags, "label", "baseline"),
    driver,
    seed,
    ticks,
    params: { config, sourceDigest, warmupTicks: 10, cpu: cpus()[0].model, node: process.version },
    summary,
    wallMs: Math.round(samples.reduce((a, b) => a + b, 0)),
  });
  database.close();
  const result = { id, ...summary };
  const output = flag(flags, "output", "");
  if (output) {
    mkdirSync(resolve(output), { recursive: true });
    writeFileSync(resolve(output, `${driver}-${count}.json`), JSON.stringify(result, null, 2));
  }
  console.log(JSON.stringify(result));
}
