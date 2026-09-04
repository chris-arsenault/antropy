import os from "node:os";
import { flag, intFlag, type Flags } from "./flags";

export interface ColonyTrainingSettings {
  readonly generations: number;
  readonly pairs: number;
  readonly ticks: number;
  readonly jobs: number;
  readonly evaluationWorldSeeds: number[];
  readonly trainingSeedBase: number;
  readonly trainingWorldCount: number;
  readonly checkpointEvery: number;
  readonly rngSeed: number;
  readonly initialSigma: number;
  readonly sigmaDecay: number;
  readonly learningRate: number;
  readonly parentRun: number;
  readonly silencePheromones: boolean;
  readonly inactiveMargin: number;
}

function seedList(raw: string): number[] {
  return raw.split(",").map(Number);
}

function validate(settings: ColonyTrainingSettings): void {
  const positiveIntegers = [
    settings.generations,
    settings.pairs,
    settings.trainingWorldCount,
    settings.checkpointEvery,
    settings.jobs,
  ];
  if (positiveIntegers.some((value) => !Number.isInteger(value) || value < 1)) {
    throw new Error(
      "generations, pairs, training worlds, jobs, and checkpoint cadence must be positive"
    );
  }
  const positiveScalars = [settings.initialSigma, settings.sigmaDecay, settings.learningRate];
  if (positiveScalars.some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new Error("sigma, sigma decay, and learning rate must be finite and positive");
  }
  if (settings.sigmaDecay > 1) throw new Error("--sigma-decay must be no greater than 1");
  const trainingEnd =
    settings.trainingSeedBase + settings.generations * settings.trainingWorldCount;
  const overlaps = settings.evaluationWorldSeeds.some(
    (seed) => seed >= settings.trainingSeedBase && seed < trainingEnd
  );
  if (overlaps) throw new Error("evaluation worlds must not overlap training worlds");
}

export function colonyTrainingSettings(flags: Flags): ColonyTrainingSettings {
  const settings = {
    generations: intFlag(flags, "generations", 24),
    pairs: intFlag(flags, "pairs", 8),
    ticks: intFlag(flags, "ticks", 1800),
    jobs: intFlag(flags, "jobs", Math.max(2, os.cpus().length - 2)),
    evaluationWorldSeeds: seedList(flag(flags, "world-seeds", "19300,19301,19302,19303,19304")),
    trainingSeedBase: intFlag(flags, "training-seed-base", 19400),
    trainingWorldCount: intFlag(flags, "training-world-count", 3),
    checkpointEvery: intFlag(flags, "checkpoint-every", 4),
    rngSeed: intFlag(flags, "seed", 19500),
    initialSigma: Number(flag(flags, "sigma", "0.04")),
    sigmaDecay: Number(flag(flags, "sigma-decay", "0.99")),
    learningRate: Number(flag(flags, "rate", "0.025")),
    parentRun: intFlag(flags, "start-run", 824),
    silencePheromones: flag(flags, "silence-pheromones", "false") === "true",
    inactiveMargin: Number(flag(flags, "inactive-margin", "0.4")),
  };
  validate(settings);
  return settings;
}
