import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { oracleCacheDemonstration, type SensorFrame } from "./colonyLoop";
import { oracleEnergyDemonstration } from "./colonyLoopEnergy";
import { createRng } from "../../src/sim/rng";
import { flag, intFlag, type Flags } from "../lib/flags";
import { openLedger, recordRun } from "../lib/ledger";
import { trainBehaviorClone, type CloneTrainingResult } from "../lib/rnnClone";

interface CloneSettings {
  readonly dataset: "cache" | "population";
  readonly successfulOnly: boolean;
  readonly balanceActions: boolean;
  readonly earlyStopping: boolean;
  readonly parameterNoise: number;
  readonly trainSeeds: number[];
  readonly validationSeeds: number[];
  readonly ticks: number;
  readonly epochs: number;
  readonly chunk: number;
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

function collectCache(seeds: number[], ticks: number, successfulOnly: boolean): CloneDataset {
  const worlds = seeds.map((seed) => oracleCacheDemonstration(seed, ticks));
  const selected = successfulOnly
    ? worlds.filter(({ result }) => result.summary.cacheDrained === true)
    : worlds;
  return {
    sequences: selected.map(({ frames }) => frames),
    framesByWorld: selected.map(({ frames }) => frames.length),
    successfulWorlds: worlds.filter(({ result }) => result.summary.cacheDrained === true).length,
    selectedWorlds: selected.length,
    worldCount: worlds.length,
  };
}

function collectPopulation(seeds: number[], ticks: number, successfulOnly: boolean): CloneDataset {
  const worlds = seeds.map((seed) => oracleEnergyDemonstration(seed, ticks));
  const selected = successfulOnly
    ? worlds.filter(
        ({ result }) => typeof result.summary.balance === "number" && result.summary.balance > 0
      )
    : worlds;
  return {
    sequences: selected.flatMap(({ sequences }) => sequences),
    framesByWorld: selected.map(({ sequences }) =>
      sequences.reduce((sum, frames) => sum + frames.length, 0)
    ),
    successfulWorlds: worlds.filter(
      ({ result }) => typeof result.summary.balance === "number" && result.summary.balance > 0
    ).length,
    selectedWorlds: selected.length,
    worldCount: worlds.length,
  };
}

function collect(settings: CloneSettings, seeds: number[]): CloneDataset {
  return settings.dataset === "population"
    ? collectPopulation(seeds, settings.ticks, settings.successfulOnly)
    : collectCache(seeds, settings.ticks, settings.successfulOnly);
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
      ` * GENERATED ARTIFACT: full recurrent behavior cloning, ledger run ${runId}.\n` +
      " * Trained from sensor/output sequences produced by the sensor-limited\n" +
      " * colony controller. All behavioral weights were trainable.\n" +
      " * Do not edit by hand; regenerate with `pnpm harness clone-colony-loop`.\n" +
      " */\n" +
      "// prettier-ignore\n" +
      `export const COLONY_SEED: number[] = [\n  ${values},\n];\n`
  );
  return artifact;
}

function settingsOf(flags: Flags): CloneSettings {
  const dataset = flag(flags, "dataset", "cache");
  if (dataset !== "cache" && dataset !== "population") {
    throw new Error('--dataset must be "cache" or "population"');
  }
  return {
    dataset,
    successfulOnly: flag(flags, "successful-only", "false") === "true",
    balanceActions: flag(flags, "balance-actions", "false") === "true",
    earlyStopping: flag(flags, "early-stopping", "false") === "true",
    parameterNoise: Number(flag(flags, "parameter-noise", "0")),
    trainSeeds: seedList(flag(flags, "train-seeds", "9100,9101,9102,9103,9104,9105")),
    validationSeeds: seedList(flag(flags, "validation-seeds", "9200,9201")),
    ticks: intFlag(flags, "ticks", 2500),
    epochs: intFlag(flags, "epochs", 30),
    chunk: intFlag(flags, "chunk", 96),
    rate: Number(flag(flags, "rate", "0.003")),
    rngSeed: intFlag(flags, "seed", 9300),
    count: intFlag(flags, "count", 1),
    label: flag(flags, "label", ""),
  };
}

function recordClone(
  settings: CloneSettings,
  initialization: number,
  training: CloneDataset,
  validation: CloneDataset,
  trained: CloneTrainingResult,
  wallMs: number,
  collectionWallMs: number
): number {
  return recordRun(
    openLedger(),
    {
      experiment: "clone-colony-loop",
      label: settings.label,
      driver: "full-rnn-sequence-clone",
      seed: settings.rngSeed + initialization,
      ticks: settings.ticks,
      cadence: 0,
      params: {
        dataset: settings.dataset,
        successfulOnly: settings.successfulOnly,
        balanceActions: settings.balanceActions,
        earlyStopping: settings.earlyStopping,
        parameterNoise: settings.parameterNoise,
        trainSeeds: settings.trainSeeds,
        validationSeeds: settings.validationSeeds,
        epochs: settings.epochs,
        chunk: settings.chunk,
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
      driver: "independent-full-rnn-clones",
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

/** Train the full recurrent behavioral weight space from oracle sequences. */
export function runCloneColonyLoop(flags: Flags): void {
  const settings = settingsOf(flags);
  const bake = flag(flags, "bake", "false") === "true";
  validateSettings(settings, bake);
  const started = Date.now();
  const training = collect(settings, settings.trainSeeds);
  const validation = collect(settings, settings.validationSeeds);
  if (training.sequences.length === 0 || validation.sequences.length === 0) {
    throw new Error("training and validation datasets must each contain a selected sequence");
  }
  const collectionWallMs = Date.now() - started;
  const runIds: number[] = [];
  for (let initialization = 0; initialization < settings.count; initialization++) {
    const trainingStarted = Date.now();
    const trained = trainBehaviorClone(
      training.sequences,
      validation.sequences,
      createRng(settings.rngSeed + initialization),
      settings.epochs,
      settings.rate,
      settings.chunk,
      null,
      {
        balanceActions: settings.balanceActions,
        earlyStopping: settings.earlyStopping,
        parameterNoise: settings.parameterNoise,
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
      `[run ${runId}] clone ${initialization + 1}/${settings.count}: ` +
        `loss ${trained.losses[0].toFixed(5)} -> ${trained.losses.at(-1)?.toFixed(5)} ` +
        `validation=${trained.validationLoss.toFixed(5)}`
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
