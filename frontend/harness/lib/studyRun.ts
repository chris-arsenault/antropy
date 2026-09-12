import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { checkpointToJson } from "../../src/persist/checkpoint";
import { stepWorld } from "../../src/sim/world";
import { summary } from "../../src/sim/stats";
import { controller } from "../../src/sim/controller";
import { sourceDigest, warnIfSourceChanged } from "./bacteriaRun";
import { flag, integerFlag, type Flags } from "./flags";
import { loadStudyWorld } from "./studyWorld";
import { StudyObserver } from "./studyObserver";
import { openLedger, recordRun } from "./ledger";
import { type World } from "../../src/sim/types";
import { noteExecution } from "../../src/persist/provenance";

export function runStudy(flags: Flags): void {
  const { world, source, sourceText, sourceSelection, fixture } = loadStudyWorld(flags);
  const run = flag(flags, "run", "probe"),
    output = flag(flags, "output", "harness/artifacts/adaptation-2026-09-10");
  const directory = join(output, run);
  if (existsSync(directory)) throw new Error("Choose a new run name; evidence is append-only");
  mkdirSync(directory, { recursive: true });
  const startTick = world.tick,
    ticks = integerFlag(flags, "ticks", 50000);
  if (ticks < 1 || ticks > 50000) throw new Error("Study duration must be 1..50000 ticks");
  const manifest = {
    run,
    status: "running",
    source,
    sourceDigest: sourceDigest(),
    sourceDigestAfter: "",
    startTick,
    ticks,
    started: new Date().toISOString(),
    flags: Object.fromEntries(flags.values),
    config: world.config,
    sourceSelection,
    fixture: fixture?.description,
    reconstruction: "not requested",
    ledgerId: 0,
  };
  const save = () =>
    writeFileSync(join(directory, "manifest.json"), JSON.stringify(manifest, null, 2));
  save();
  const observer = new StudyObserver(world, directory),
    started = performance.now();
  noteExecution(world, `headless:${manifest.sourceDigest}`);
  try {
    manifest.reconstruction = advance(world, observer, ticks, {
      run,
      sourceTick: source.tick,
      sourceText,
      beforeStep: fixture?.beforeStep,
      afterStep: fixture?.afterStep,
    });
    manifest.sourceDigestAfter = sourceDigest();
    warnIfSourceChanged(manifest.sourceDigest, manifest.sourceDigestAfter);
    const result = summary(world),
      db = openLedger();
    manifest.ledgerId = recordRun(db, {
      experiment: "bacteria-adaptation",
      label: run,
      driver: controller.id,
      seed: world.seed,
      ticks: world.tick - startTick,
      params: manifest,
      summary: result,
      wallMs: performance.now() - started,
    });
    db.close();
    writeFileSync(join(directory, "checkpoint.json"), checkpointToJson(world));
    writeFileSync(join(directory, "result.json"), JSON.stringify(result, null, 2));
    manifest.status = "complete";
    save();
    console.log(
      JSON.stringify({
        run,
        ledger: manifest.ledgerId,
        tick: world.tick,
        population: result.population,
      })
    );
  } catch (error) {
    manifest.status = "failed";
    save();
    throw error;
  }
}
function advance(
  world: World,
  observer: StudyObserver,
  ticks: number,
  input: {
    run: string;
    sourceTick: number;
    sourceText: string;
    beforeStep?: () => void;
    afterStep?: () => void;
  }
): string {
  let reconstruction = "not requested";
  const compare = world.tick === 0 && world.seed === 101;
  for (let i = 0; i < ticks && !world.stopReason; i++) {
    input.beforeStep?.();
    observer.beforeStep();
    stepWorld(world);
    input.afterStep?.();
    if (world.tick % 100 === 0) {
      observer.flush();
      observer.sample();
    }
    if (compare && world.tick === input.sourceTick)
      reconstruction = compareCheckpoint(world, input.sourceText);
    progress(world, input.run);
  }
  if (world.tick % 100 !== 0) observer.sample();
  observer.close();
  return reconstruction;
}
function progress(world: World, run: string): void {
  if (world.tick % 5000 === 0)
    console.log(JSON.stringify({ run, tick: world.tick, population: world.cells.length }));
}
function compareCheckpoint(world: World, text: string): string {
  const current = JSON.parse(checkpointToJson(world)),
    saved = JSON.parse(text);
  for (const snapshot of [current, saved]) {
    delete snapshot.provenance;
    delete snapshot.exportSource;
  }
  return isDeepStrictEqual(current, saved)
    ? "exact physical checkpoint match; execution metadata excluded"
    : "different physical checkpoint";
}
