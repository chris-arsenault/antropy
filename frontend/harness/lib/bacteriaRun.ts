import { mkdirSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { createWorld, stepWorld } from "../../src/sim/world";
import { DEFAULT_CONFIG, type Config } from "../../src/sim/config";
import { type World } from "../../src/sim/types";
import { summary } from "../../src/sim/stats";
import { checkpointToJson } from "../../src/persist/checkpoint";
import { openLedger, recordRun } from "./ledger";
import { controller } from "../../src/sim/controller";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : [join(directory, entry.name)]
  );
}
export function sourceDigest(): string {
  const hash = createHash("sha256");
  for (const file of [
    ...sourceFiles("src"),
    ...sourceFiles("harness/lib"),
    "harness/cli.ts",
  ].sort()) {
    if (!file.endsWith(".ts") && !file.endsWith(".tsx")) continue;
    hash.update(file);
    hash.update(readFileSync(file));
  }
  return hash.digest("hex");
}
export function measure(world: World, ticks: number, cadence: number) {
  const series = [summary(world)],
    frames: Record<string, unknown>[] = [];
  const started = performance.now();
  let maxResidual = 0;
  while (world.tick < ticks && !world.stopReason) {
    stepWorld(world);
    if (world.tick % cadence === 0) {
      const s = summary(world);
      series.push(s);
      maxResidual = Math.max(maxResidual, Math.abs(s.energyResidual));
      frames.push({
        tick: world.tick,
        cells: world.cells.map((c) => ({
          id: c.id,
          x: c.x,
          y: c.y,
          heading: c.heading,
          mass: c.mass,
          energy: c.energy,
          genome: c.genome,
          lineage: c.lineage,
          task: c.brain.task,
          action: c.action,
        })),
      });
    }
  }
  return {
    wallMs: performance.now() - started,
    series,
    frames,
    maxResidual,
    final: summary(world),
  };
}
export function recordMeasurement(
  world: World,
  ticks: number,
  output: string,
  label: string,
  experiment = "bacteria-evolution"
) {
  const digest = sourceDigest(),
    result = measure(world, ticks, 100);
  const provenance = {
    sourceDigest: digest,
    sourceDigestAfter: sourceDigest(),
    interventions: world.interventions,
  };
  const database = openLedger();
  const id = recordRun(database, {
    experiment,
    label,
    driver: controller.id,
    seed: world.seed,
    ticks: world.tick,
    params: { ...world.config, substrate: world.substrate, version: world.version, ...provenance },
    summary: { ...result.final, maxResidual: result.maxResidual },
    wallMs: result.wallMs,
  });
  database.close();
  mkdirSync(output, { recursive: true });
  writeFileSync(
    join(output, `run-${id}.json`),
    JSON.stringify({ ...result, ...provenance }, null, 2)
  );
  writeFileSync(join(output, `checkpoint-${id}.json`), checkpointToJson(world));
  console.log(JSON.stringify({ id, output, ...result.final, wallMs: result.wallMs }));
  return id;
}
export function runBacteria(
  seed: number,
  ticks: number,
  regime: Config["regime"],
  mutation: boolean,
  output: string
): number {
  const world = createWorld(seed, {
    ...DEFAULT_CONFIG,
    regime,
    mutationRate: mutation ? DEFAULT_CONFIG.mutationRate : 0,
  });
  return recordMeasurement(world, ticks, output, `${regime}; mutation ${mutation}`);
}
