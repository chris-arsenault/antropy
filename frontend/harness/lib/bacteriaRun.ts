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
import { distance } from "../../src/sim/geometry";
import { sample } from "../../src/sim/fields";

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
/**
 * A source edit during a run is provenance, not a failure: the process keeps the code it loaded,
 * both digests are recorded, and the result, checkpoint and ledger row are still written.
 */
export function warnIfSourceChanged(before: string, after: string): void {
  if (before !== after)
    console.error(
      `warning: source changed during run (${before.slice(0, 12)} -> ${after.slice(0, 12)})`
    );
}
interface MeasurementOptions {
  spatial?: boolean;
  progress?: boolean;
  onSample?: (world: World) => void;
}
function reportProgress(
  world: World,
  s: ReturnType<typeof summary>,
  enabled: boolean | undefined
): void {
  if (!enabled || world.tick % 5000 !== 0) return;
  console.log(
    JSON.stringify({
      progress: world.tick,
      seed: world.seed,
      regime: world.config.regime,
      population: s.population,
      generation: s.maxGeneration,
      leader: s.lineages[0],
    })
  );
}
export function measure(
  world: World,
  ticks: number,
  cadence: number,
  options: MeasurementOptions = {}
) {
  const series = [summary(world)],
    frames: Record<string, unknown>[] = [];
  const started = performance.now();
  let maxResidual = 0;
  let maxMaterialResidual = 0;
  while (world.tick < ticks && !world.stopReason) {
    stepWorld(world);
    if (world.tick % cadence === 0) {
      const s = summary(world);
      series.push(s);
      maxResidual = Math.max(maxResidual, Math.abs(s.energyResidual));
      maxMaterialResidual = Math.max(maxMaterialResidual, Math.abs(s.materialResidual));
      options.onSample?.(world);
      reportProgress(world, s, options.progress);
      if (options.spatial !== false)
        frames.push({
          tick: world.tick,
          cells: world.cells.map((c) => ({
            id: c.id,
            x: c.x,
            y: c.y,
            heading: c.heading,
            body: { ...c.body },
            reserve: c.reserve,
            energy: c.energy,
            damage: c.damage,
            genome: c.genome,
            lineage: c.lineage,
            task: c.brain.task,
            action: c.action,
          })),
          sources: world.sources.map((source) => ({ ...source })),
          toxin: Array.from(world.toxin),
          matrix: Array.from(world.matrix),
          boundToxin: Array.from(world.boundToxin),
        });
    }
  }
  const final = summary(world);
  return {
    wallMs: performance.now() - started,
    series,
    frames,
    maxResidual: Math.max(maxResidual, Math.abs(final.energyResidual)),
    maxMaterialResidual: Math.max(maxMaterialResidual, Math.abs(final.materialResidual)),
    final,
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
    start = founderConditions(world),
    result = measure(world, ticks, 100, { progress: true });
  const provenance = {
    sourceDigest: digest,
    sourceDigestAfter: sourceDigest(),
    interventions: world.interventions,
    initialConditions: start,
  };
  const database = openLedger();
  const id = recordRun(database, {
    experiment,
    label,
    driver: controller.id,
    seed: world.seed,
    ticks: world.tick,
    params: { ...world.config, substrate: world.substrate, version: world.version, ...provenance },
    summary: {
      ...result.final,
      maxResidual: result.maxResidual,
      maxMaterialResidual: result.maxMaterialResidual,
    },
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
function founderConditions(world: World) {
  return world.cells
    .filter((c) => c.parent === null)
    .map((c) => ({
      id: c.id,
      x: c.x,
      y: c.y,
      heading: c.heading,
      nutrient: sample(world.nutrient, c, world.config),
      nearestSourceDistance: world.sources.length
        ? Math.min(...world.sources.map((s) => distance(c, s, world.config)))
        : null,
    }));
}
export function runBacteria(
  seed: number,
  ticks: number,
  regime: Config["regime"],
  mutation: boolean,
  output: string,
  overrides: Partial<Config> = {}
): number {
  const world = createWorld(seed, {
    ...DEFAULT_CONFIG,
    ...overrides,
    regime,
    mutationRate: mutation ? DEFAULT_CONFIG.mutationRate : 0,
    physicalMutationRate: mutation ? DEFAULT_CONFIG.physicalMutationRate : 0,
  });
  return recordMeasurement(world, ticks, output, `${regime}; mutation ${mutation}`);
}
