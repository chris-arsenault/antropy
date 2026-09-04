import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { oracleCacheDemonstration, type SensorFrame } from "./colonyLoop";
import { GENOME_LENGTH } from "../../src/sim/controller/rnn";
import { createRng } from "../../src/sim/rng";
import { flag, intFlag, type Flags } from "../lib/flags";
import { openLedger, recordRun } from "../lib/ledger";
import {
  FRAME_DISTILLATION_SETTINGS,
  trainFrameDistillation,
  type FrameDistillationResult,
} from "../lib/rnnFrameClone";

interface CloneSettings {
  readonly trainSeeds: number[];
  readonly validationSeeds: number[];
  readonly ticks: number;
  readonly epochs: number;
  readonly batchSize: number;
  readonly rate: number;
  readonly rngSeed: number;
  readonly count: number;
  readonly label: string;
}

interface CloneDataset {
  readonly sequences: SensorFrame[][];
  readonly framesByWorld: number[];
  readonly successfulWorlds: number;
  readonly selectedWorlds: number;
  readonly worldCount: number;
}

function seedList(raw: string): number[] {
  return raw.split(",").map(Number);
}

function collect(seeds: number[], ticks: number): CloneDataset {
  const worlds = seeds.map((seed) => oracleCacheDemonstration(seed, ticks));
  const selected = worlds.filter(({ result }) => result.summary.cacheDrained === true);
  return {
    sequences: selected.map(({ frames }) => frames),
    framesByWorld: selected.map(({ frames }) => frames.length),
    successfulWorlds: worlds.filter(({ result }) => result.summary.cacheDrained === true).length,
    selectedWorlds: selected.length,
    worldCount: worlds.length,
  };
}

export function bakeClone(vector: Float32Array, runId: number): string {
  const artifact = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "src",
    "sim",
    "controller",
    "seeds",
    "colony.ts"
  );
  const values = Array.from(vector)
    .map((value) => value.toFixed(6))
    .join(",\n  ");
  writeFileSync(
    artifact,
    "/**\n" +
      ` * GENERATED ARTIFACT: full recurrent colony controller, ledger run ${runId}.\n` +
      " * The source ledger row records its training method and held-out measurements.\n" +
      " * Initial training fits feed-forward weights; recurrent genes remain evolvable.\n" +
      " * Do not edit by hand; regenerate with `pnpm harness bake-colony-run`.\n" +
      " */\n" +
      "// prettier-ignore\n" +
      `export const COLONY_SEED: number[] = [\n  ${values},\n];\n`
  );
  return artifact;
}

function vectorFromRun(runId: number): Float32Array {
  const row = openLedger().prepare("SELECT summary FROM runs WHERE id = ?").get(runId) as
    { summary: string } | undefined;
  const vector = row ? (JSON.parse(row.summary) as { vector?: number[] }).vector : undefined;
  if (vector?.length !== GENOME_LENGTH) throw new Error(`run ${runId} has no controller vector`);
  return Float32Array.from(vector);
}

/** Regenerate the checked-in seed from an already measured ledger row. */
export function runBakeColonyRun(flags: Flags): void {
  const runId = intFlag(flags, "run", 0);
  if (runId < 1) throw new Error("--run is required");
  console.log(`baked ${bakeClone(vectorFromRun(runId), runId)}`);
}

function settingsOf(flags: Flags): CloneSettings {
  return {
    trainSeeds: seedList(
      flag(
        flags,
        "train-seeds",
        "9300,9301,9302,9303,9304,9305,9306,9307,9308,9309,9310,9311,9312,9313,9314,9315"
      )
    ),
    validationSeeds: seedList(flag(flags, "validation-seeds", "9400,9401,9402,9403")),
    ticks: intFlag(flags, "ticks", 2500),
    ...FRAME_DISTILLATION_SETTINGS,
    rngSeed: intFlag(flags, "seed", 9510),
    count: intFlag(flags, "count", 4),
    label: flag(flags, "label", ""),
  };
}

function recordClone(
  settings: CloneSettings,
  initialization: number,
  training: CloneDataset,
  validation: CloneDataset,
  trained: FrameDistillationResult,
  wallMs: number,
  collectionWallMs: number
): number {
  return recordRun(
    openLedger(),
    {
      experiment: "clone-colony-loop",
      label: settings.label,
      driver: "balanced-stateless-frame-distillation",
      seed: settings.rngSeed + initialization,
      ticks: settings.ticks,
      cadence: 0,
      params: {
        dataset: "successful-cache-oracle-frames",
        stateHandling: "reset-every-frame",
        recurrentInitialization: "zero-frozen-during-distillation",
        frameSampling: "equal-output-regime",
        trainSeeds: settings.trainSeeds,
        validationSeeds: settings.validationSeeds,
        epochs: settings.epochs,
        batchSize: settings.batchSize,
        rate: settings.rate,
        initialization,
        initializationCount: settings.count,
        collectionWallMs,
      },
      patches: [],
      summary: {
        trainingFrames: training.framesByWorld,
        validationFrames: validation.framesByWorld,
        trainingSequences: training.sequences.length,
        validationSequences: validation.sequences.length,
        trainingTeacherSuccesses: training.successfulWorlds,
        validationTeacherSuccesses: validation.successfulWorlds,
        trainingSelectedWorlds: training.selectedWorlds,
        validationSelectedWorlds: validation.selectedWorlds,
        losses: trained.losses,
        validationLoss: trained.validationLoss,
        validationLosses: trained.validationLosses,
        bestEpoch: trained.bestEpoch,
        actionPositiveCounts: trained.actionPositiveCounts,
        actionPositiveWeights: trained.actionPositiveWeights,
        frameClassCounts: trained.frameClassCounts,
        samplesPerEpoch: trained.samplesPerEpoch,
        recurrentWeightNorm: trained.recurrentWeightNorm,
        vector: Array.from(trained.vector),
      },
      wallMs,
    },
    [],
    []
  );
}

function recordCohort(settings: CloneSettings, runIds: number[], wallMs: number): number {
  return recordRun(
    openLedger(),
    {
      experiment: "clone-colony-loop-cohort",
      label: settings.label,
      driver: "independent-frame-distilled-rnns",
      seed: settings.rngSeed,
      ticks: settings.ticks,
      cadence: 0,
      params: { ...settings },
      patches: [],
      summary: { runIds },
      wallMs,
    },
    [],
    []
  );
}

function validateSettings(settings: CloneSettings, bake: boolean): void {
  if (settings.count < 1) throw new Error("--count must be positive");
  if (bake && settings.count !== 1) throw new Error("--bake requires --count 1");
}

/** Train independent RNN seeds from balanced same-frame oracle decisions. */
export function runCloneColonyLoop(flags: Flags): void {
  const settings = settingsOf(flags);
  const bake = flag(flags, "bake", "false") === "true";
  validateSettings(settings, bake);
  const started = Date.now();
  const training = collect(settings.trainSeeds, settings.ticks);
  const validation = collect(settings.validationSeeds, settings.ticks);
  if (training.sequences.length === 0 || validation.sequences.length === 0) {
    throw new Error("training and validation datasets must each contain a selected sequence");
  }
  const collectionWallMs = Date.now() - started;
  const runIds: number[] = [];
  for (let initialization = 0; initialization < settings.count; initialization++) {
    const trainingStarted = Date.now();
    const trained = trainFrameDistillation(
      training.sequences,
      validation.sequences,
      createRng(settings.rngSeed + initialization),
      {
        epochs: settings.epochs,
        rate: settings.rate,
        batchSize: settings.batchSize,
      }
    );
    const runId = recordClone(
      settings,
      initialization,
      training,
      validation,
      trained,
      Date.now() - trainingStarted,
      collectionWallMs
    );
    runIds.push(runId);
    console.log(
      `[run ${runId}] frame distillation ${initialization + 1}/${settings.count}: ` +
        `loss ${trained.losses[0].toFixed(5)} -> ${trained.losses.at(-1)?.toFixed(5)} ` +
        `validation=${trained.validationLoss.toFixed(5)} ` +
        `classes=${Object.keys(trained.frameClassCounts).length}`
    );
    if (bake) console.log(`baked ${bakeClone(trained.vector, runId)}`);
  }
  if (settings.count > 1) {
    const cohortId = recordCohort(settings, runIds, Date.now() - started);
    console.log(
      `[run ${cohortId}] clone cohort: runs=${runIds.join(",")} ` +
        `teacher-success=${training.successfulWorlds}/${training.worldCount}`
    );
  }
}
