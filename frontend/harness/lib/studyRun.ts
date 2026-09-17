import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type EngineWorld } from "../../src/engine/client";
import { type Summary, type Definition } from "../../src/engine/types";
import { loadEngine, captureEngine } from "../numerical/engine";
import { sourceDigest, warnIfSourceChanged } from "./bacteriaRun";
import { flag, integerFlag, type Flags } from "./flags";
import { requireRegistration } from "./longRun";
import { loadStudyWorld } from "./studyWorld";
import { StudyObserver } from "./studyObserver";
import { openLedger, recordRun } from "./ledger";

export async function runStudy(flags: Flags): Promise<void> {
  const ticks = integerFlag(flags, "ticks", 50000),
    wallSeconds = integerFlag(flags, "wall-seconds", 900),
    justification = requireRegistration(flags, ticks);
  validateStudyBudget(ticks, wallSeconds);
  const engine = await loadEngine(),
    { world, source, sourceBytes, sourceSelection, fixture } = await loadStudyWorld(flags, engine);
  const run = flag(flags, "run", "probe"),
    output = flag(flags, "output", "harness/artifacts/chemical-study"),
    directory = join(output, run);
  let observer: StudyObserver | null = null;
  try {
    mkdirSync(output, { recursive: true });
    mkdirSync(directory);
    const startTick = world.command<Summary>("summary").tick,
      definition = world.command<Definition>("definition"),
      started = performance.now();
    const manifest = studyManifest({
      run,
      wallSeconds,
      source,
      sourceSelection,
      fixture,
      startTick,
      ticks,
      flags,
      definition,
      justification,
      kernelDigest: engine.sourceDigest,
      binaryDigest: captureEngine(directory, engine),
    });
    const save = () =>
      writeFileSync(join(directory, "manifest.json"), JSON.stringify(manifest, null, 2));
    save();
    writeFileSync(join(directory, "initial.bin"), world.snapshot());
    writeFileSync(join(directory, "source.bin"), sourceBytes);
    observer = new StudyObserver(world, directory);
    try {
      manifest.reconstruction = advance(world, observer, ticks, {
        deadline: started + wallSeconds * 1000,
        compare: flag(flags, "compare-source", "false") === "true",
        sourceTick: source.tick,
        sourceBytes,
        beforeStep: fixture?.beforeStep,
        afterStep: fixture?.afterStep,
      });
      observer.close();
      const summary = world.command<Summary>("summary");
      manifest.stop =
        summary.stopReason ?? (summary.tick < startTick + ticks ? "wall cap" : "horizon");
      manifest.status = manifest.stop === "wall cap" ? "incomplete" : "complete";
      manifest.harnessDigestAfter = sourceDigest();
      manifest.ledgerId = recordStudy(manifest, summary, definition.seed, started);
      writeFileSync(join(directory, "result.json"), JSON.stringify(summary, null, 2));
      logResult(manifest, summary);
    } catch (error) {
      manifest.status = "failed";
      manifest.stop = String(error);
      throw error;
    } finally {
      writeFileSync(join(directory, "checkpoint.bin"), world.snapshot());
      manifest.harnessDigestAfter = sourceDigest();
      warnIfSourceChanged(manifest.harnessDigest, manifest.harnessDigestAfter);
      save();
    }
  } finally {
    try {
      observer?.close();
    } finally {
      world.dispose();
    }
  }
}
function advance(world: EngineWorld, observer: StudyObserver, ticks: number, input: AdvanceInput) {
  let reconstruction = input.compare ? "source tick not reached" : "not requested",
    state = world.command<Summary>("summary");
  for (let i = 0; i < ticks && !state.stopReason; i++) {
    if (performance.now() >= input.deadline) break;
    input.beforeStep?.();
    world.step();
    input.afterStep?.();
    state = world.command<Summary>("summary");
    reconstruction = sampleStudy(world, observer, state, input, reconstruction);
  }
  if (state.tick % 100 !== 0) observer.sample();
  return reconstruction;
}
function logResult(m: ReturnType<typeof studyManifest>, summary: Summary) {
  console.log(
    JSON.stringify({
      run: m.run,
      id: m.ledgerId,
      tick: summary.tick,
      population: summary.population,
      stop: m.stop,
    })
  );
}

interface ManifestInput {
  run: string;
  wallSeconds: number;
  source: Awaited<ReturnType<typeof loadStudyWorld>>["source"];
  sourceSelection: Awaited<ReturnType<typeof loadStudyWorld>>["sourceSelection"];
  fixture: Awaited<ReturnType<typeof loadStudyWorld>>["fixture"];
  startTick: number;
  ticks: number;
  flags: Flags;
  definition: Definition;
  justification: string;
  kernelDigest: string;
  binaryDigest: string;
}
function studyManifest({
  run,
  wallSeconds,
  source,
  sourceSelection,
  fixture,
  startTick,
  ticks,
  flags,
  definition,
  justification,
  kernelDigest,
  binaryDigest,
}: ManifestInput) {
  return {
    run,
    schemaVersion: 3,
    checkpointVersion: definition.version,
    wallSeconds,
    source,
    sourceSelection,
    fixture: fixture?.description,
    sourceDigest: kernelDigest,
    binaryDigest,
    harnessDigest: sourceDigest(),
    harnessDigestAfter: "",
    startTick,
    ticks,
    flags: Object.fromEntries(flags.values),
    config: definition.config,
    justification,
    status: "running",
    stop: "running",
    reconstruction: "not requested",
    ledgerId: 0,
  };
}
function recordStudy(
  manifest: ReturnType<typeof studyManifest>,
  summary: Summary,
  seed: number,
  started: number
) {
  const db = openLedger();
  try {
    return recordRun(db, {
      experiment: "bacteria-adaptation",
      label: manifest.run,
      driver: "wasm",
      seed,
      ticks: summary.tick - manifest.startTick,
      params: manifest,
      summary: { ...summary },
      wallMs: performance.now() - started,
    });
  } finally {
    db.close();
  }
}

type AdvanceInput = {
  deadline: number;
  compare: boolean;
  sourceTick: number;
  sourceBytes: Uint8Array;
  beforeStep?: () => void;
  afterStep?: () => void;
};
function sampleStudy(
  world: EngineWorld,
  observer: StudyObserver,
  state: Summary,
  input: AdvanceInput,
  reconstruction: string
) {
  if (state.tick % 100 === 0) {
    observer.flush();
    observer.sample();
  }
  if (input.compare && state.tick === input.sourceTick)
    reconstruction =
      Buffer.compare(world.snapshot(), input.sourceBytes) === 0
        ? "exact physical checkpoint match"
        : "different physical checkpoint";
  if (state.tick % 5000 === 0)
    console.log(JSON.stringify({ progress: state.tick, population: state.population }));
  return reconstruction;
}

function validateStudyBudget(ticks: number, wallSeconds: number) {
  if (ticks < 1 || ticks > 50000 || wallSeconds <= 0 || wallSeconds > 900)
    throw new Error("Study budget is 1..50000 ticks and at most 900 seconds");
}
