/** Shared recorded execution for registered population, epoch and discovery studies. */
import { mkdirSync, writeFileSync, openSync, writeSync, closeSync } from "node:fs";
import { join } from "node:path";
import { type Engine, type EngineWorld } from "../../src/engine/client";
import { type Definition, type Summary, type Genotype } from "../../src/engine/types";
import { captureEngine } from "../numerical/engine";
import { measure, sourceDigest, warnIfSourceChanged } from "./bacteriaRun";
import { openLedger, recordRun } from "./ledger";
import { type Flags, flag } from "./flags";

export interface ObservedCell {
  id: number;
  parent: number | null;
  lineage: number;
  genome: number;
  generation: number;
  born: number;
  x: number;
  y: number;
  heading: number;
  energy: number;
  material: number;
  mass: number;
  damage: number;
  phenotype: number[];
  task: number;
}
export interface ObservedFrame {
  tick: number;
  cells: ObservedCell[];
  summary: Summary;
  events: unknown[];
}
export function readFrame(world: EngineWorld) {
  return world.command<ObservedFrame>("frame");
}
export function requireRegistration(flags: Flags, ticks: number) {
  const justification = flag(flags, "justification", "");
  if (ticks > 3000 && !justification.trim())
    throw new Error(
      "Runs beyond 3000 ticks require --justification linking the question, short evidence, registered horizon and stopping criteria"
    );
  return justification;
}
interface Settings {
  directory: string;
  experiment: string;
  label: string;
  ticks: number;
  cadence: number;
  checkpointEvery: number;
  wallSeconds: number;
  provenance: Record<string, unknown>;
  observation?: (world: EngineWorld) => Record<string, unknown>;
  stop?: () => string | null;
}
function sample(
  world: EngineWorld,
  known: Set<number>,
  genomes: number,
  samples: number,
  extra?: Settings["observation"]
) {
  const frame = readFrame(world);
  for (const c of frame.cells)
    if (!known.has(c.genome)) {
      const genotype = world.command<Genotype>("genotype", { id: c.genome });
      writeSync(
        genomes,
        JSON.stringify({ genotype, facts: world.command("genotypeFacts", { id: c.genome }) }) + "\n"
      );
      known.add(c.genome);
    }
  writeSync(
    samples,
    JSON.stringify({
      ...frame,
      ...extra?.(world),
      population: frame.cells.length,
      populationTraits: world.command("census"),
      environment: world.command("environment"),
    }) + "\n"
  );
  return frame.tick;
}
export function runRecorded(engine: Engine, world: EngineWorld, s: Settings) {
  if (
    !Number.isSafeInteger(s.checkpointEvery) ||
    s.checkpointEvery < 1 ||
    s.checkpointEvery % s.cadence !== 0
  )
    throw new Error("Invalid checkpoint cadence");
  mkdirSync(s.directory, { recursive: false });
  const definition = world.command<Definition>("definition"),
    digest = sourceDigest();
  const binaryDigest = captureEngine(s.directory, engine);
  const save = (name: string, value: unknown) =>
    writeFileSync(join(s.directory, name), JSON.stringify(value, null, 2));
  const manifest = createManifest(s, definition, engine.sourceDigest, binaryDigest);
  save("manifest.json", manifest);
  writeFileSync(join(s.directory, "initial.bin"), world.snapshot());
  const samples = openSync(join(s.directory, "samples.jsonl"), "wx"),
    genomes = openSync(join(s.directory, "genomes.jsonl"), "wx"),
    known = new Set<number>();
  try {
    sample(world, known, genomes, samples, s.observation);
    const result = measure(world, s.ticks, s.cadence, {
      wallSeconds: s.wallSeconds,
      spatial: false,
      progress: true,
      stop: s.stop,
      onSample: (w) => {
        const tick = sample(w, known, genomes, samples, s.observation);
        if (tick % s.checkpointEvery === 0)
          writeFileSync(join(s.directory, `checkpoint-${tick}.bin`), w.snapshot());
      },
    });
    manifest.stop = result.stop;
    manifest.status = result.failure ? "failed" : completedStatus(result.stop);
    manifest.harnessDigestAfter = sourceDigest();
    const db = openLedger();
    try {
      const id = recordRun(db, {
        experiment: s.experiment,
        label: s.label,
        driver: "wasm",
        seed: definition.seed,
        ticks: result.final.tick,
        params: manifest,
        summary: { ...result.final, failure: result.failure },
        wallMs: result.wallMs,
      });
      save("result.json", { ...result, ledgerId: id });
      console.log(
        JSON.stringify({
          id,
          label: s.label,
          tick: result.final.tick,
          population: result.final.population,
          stop: result.stop,
        })
      );
    } finally {
      db.close();
    }
    if (result.failure) throw new Error(result.failure);
    return result;
  } catch (error) {
    manifest.status = "failed";
    throw error;
  } finally {
    closeSync(samples);
    closeSync(genomes);
    writeFileSync(join(s.directory, "checkpoint.bin"), world.snapshot());
    manifest.harnessDigestAfter = sourceDigest();
    warnIfSourceChanged(digest, manifest.harnessDigestAfter);
    save("manifest.json", manifest);
  }
}

function createManifest(
  s: Settings,
  definition: Definition,
  kernelDigest: string,
  binaryDigest: string
) {
  return {
    ...s.provenance,
    schemaVersion: 3,
    checkpointVersion: definition.version,
    label: s.label,
    seed: definition.seed,
    config: definition.config,
    ticks: s.ticks,
    cadence: s.cadence,
    checkpointEvery: s.checkpointEvery,
    wallSeconds: s.wallSeconds,
    sourceDigest: kernelDigest,
    binaryDigest,
    harnessDigest: sourceDigest(),
    harnessDigestAfter: "",
    status: "running",
    stop: "running",
  };
}
export function completedStatus(stop: string) {
  return stop === "horizon" || stop === "extinction" ? "complete" : "incomplete";
}
