import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GENOME_LENGTH, WEIGHT_COUNT } from "../../src/sim/controller/rnn";
import { Output } from "../../src/sim/controller/contract";
import { createRng, randNormal, type Rng } from "../../src/sim/rng";
import { colonyTrainingSettings, type ColonyTrainingSettings } from "../lib/colonyTrainingSettings";
import { flag, type Flags } from "../lib/flags";
import { compareColonyOutcomes, type ColonyOutcomeVerdict } from "../lib/colonyOutcome";
import { openLedger, recordRun } from "../lib/ledger";
import { withInactiveOutputs } from "../lib/rnnClone";
import { generationWorldSeeds, rankUtilities } from "../lib/stochasticTraining";
import { bakeClone } from "./cloneColonyLoop";

const WORKER = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "colonyOutcomeWorker.ts"
);

interface Candidate {
  vector: Float32Array;
  noise: Float64Array;
  verdict: ColonyOutcomeVerdict;
}

interface CheckpointContext {
  generation: number;
  parentRun: number;
  rngSeed: number;
  ticks: number;
  trainingWorldSeeds: number[];
  sigma: number;
}

interface SearchSettings {
  rng: Rng;
  pairs: number;
  ticks: number;
  jobs: number;
  learningRate: number;
}

interface TrainingGeneration {
  vector: Float32Array;
  best: ColonyOutcomeVerdict;
  populationMean: number;
}

interface TrainingResult {
  vector: Float32Array;
  finalSigma: number;
  trajectory: Record<string, unknown>[];
  checkpointRuns: number[];
}

function searchSettings(
  rngSeed: number,
  pairs: number,
  ticks: number,
  jobs: number,
  learningRate: number
): SearchSettings {
  return {
    rng: createRng(rngSeed),
    pairs,
    ticks,
    jobs,
    learningRate,
  };
}

function startingVector(runId: number): Float32Array {
  const row = openLedger().prepare("SELECT summary FROM runs WHERE id = ?").get(runId) as
    { summary: string } | undefined;
  const vector = row ? (JSON.parse(row.summary) as { vector?: number[] }).vector : undefined;
  if (vector?.length !== GENOME_LENGTH) throw new Error(`run ${runId} has no controller vector`);
  return Float32Array.from(vector);
}

function preparedStartingVector(runId: number, settings: ColonyTrainingSettings): Float32Array {
  const vector = startingVector(runId);
  return settings.silencePheromones
    ? withInactiveOutputs(vector, [Output.PHEROMONE_A, Output.PHEROMONE_B], settings.inactiveMargin)
    : vector;
}

function evaluate(
  vector: Float32Array,
  worldSeeds: number[],
  ticks: number
): Promise<ColonyOutcomeVerdict> {
  return new Promise((resolve, reject) => {
    // Dev-tool process fan-out; the harness never runs in production.
    // eslint-disable-next-line sonarjs/no-os-command-from-path
    const child = spawn("pnpm", ["exec", "tsx", WORKER], {
      cwd: path.join(path.dirname(WORKER), ".."),
      stdio: ["pipe", "pipe", "inherit"],
    });
    let output = "";
    child.stdout.on("data", (data: Buffer) => (output += data.toString()));
    child.on("close", (code) => {
      if (code === 0) resolve(JSON.parse(output) as ColonyOutcomeVerdict);
      else reject(new Error(`colony outcome worker exited ${code}`));
    });
    child.stdin.end(JSON.stringify({ vector: Array.from(vector), worldSeeds, ticks }));
  });
}

async function pooled<T>(tasks: (() => Promise<T>)[], jobs: number): Promise<T[]> {
  const results = new Array<T>(tasks.length);
  let next = 0;
  const lane = async (): Promise<void> => {
    while (next < tasks.length) {
      const index = next++;
      results[index] = await tasks[index]();
    }
  };
  await Promise.all(Array.from({ length: Math.min(jobs, tasks.length) }, lane));
  return results;
}

function mirrored(mean: Float32Array, pairs: number, sigma: number, rng: Rng) {
  const candidates: { vector: Float32Array; noise: Float64Array }[] = [];
  for (let pair = 0; pair < pairs; pair++) {
    const direction = new Float64Array(WEIGHT_COUNT);
    for (let locus = 0; locus < WEIGHT_COUNT; locus++) direction[locus] = randNormal(rng);
    for (const sign of [-1, 1]) {
      const vector = Float32Array.from(mean);
      const noise = new Float64Array(WEIGHT_COUNT);
      for (let locus = 0; locus < WEIGHT_COUNT; locus++) {
        noise[locus] = direction[locus] * sign;
        vector[locus] += sigma * noise[locus];
      }
      candidates.push({ vector, noise });
    }
  }
  return candidates;
}

function updateMean(
  mean: Float32Array,
  candidates: Candidate[],
  sigma: number,
  learningRate: number
): Float32Array {
  const utilities = rankUtilities(candidates.map(({ verdict }) => verdict));
  const next = Float32Array.from(mean);
  for (let locus = 0; locus < WEIGHT_COUNT; locus++) {
    let gradient = 0;
    for (let index = 0; index < candidates.length; index++) {
      gradient += utilities[index] * candidates[index].noise[locus];
    }
    next[locus] += (learningRate * gradient) / (sigma * candidates.length);
  }
  return next;
}

async function proposeGeneration(
  mean: Float32Array,
  sigma: number,
  worldSeeds: number[],
  settings: SearchSettings
): Promise<TrainingGeneration> {
  const samples = mirrored(mean, settings.pairs, sigma, settings.rng);
  const verdicts = await pooled(
    samples.map(
      ({ vector }) =>
        () =>
          evaluate(vector, worldSeeds, settings.ticks)
    ),
    settings.jobs
  );
  const candidates = samples.map((sample, index) => ({ ...sample, verdict: verdicts[index] }));
  const best = candidates.reduce((current, candidate) =>
    compareColonyOutcomes(candidate.verdict, current.verdict) > 0 ? candidate : current
  );
  return {
    vector: updateMean(mean, candidates, sigma, settings.learningRate),
    best: best.verdict,
    populationMean:
      candidates.reduce((sum, candidate) => sum + candidate.verdict.mean, 0) / candidates.length,
  };
}

function recordCheckpoint(
  vector: Float32Array,
  generation: TrainingGeneration,
  context: CheckpointContext,
  wallMs: number
): number {
  return recordRun(
    openLedger(),
    {
      experiment: "optimize-colony-loop/checkpoint",
      label: `generation-${context.generation}`,
      driver: "full-rnn-stochastic-es",
      seed: context.rngSeed,
      ticks: context.ticks,
      cadence: 0,
      params: { ...context },
      patches: [],
      summary: {
        trainingPopulationMean: generation.populationMean,
        trainingPopulationBest: outcomeSummary(generation.best),
        vector: Array.from(vector),
      },
      wallMs,
    },
    [],
    []
  );
}

function outcomeSummary(verdict: ColonyOutcomeVerdict): Omit<ColonyOutcomeVerdict, "runs"> {
  return {
    fitness: verdict.fitness,
    mean: verdict.mean,
    worst: verdict.worst,
    completionCount: verdict.completionCount,
    cacheCount: verdict.cacheCount,
    returnCount: verdict.returnCount,
    pickupCount: verdict.pickupCount,
    exitCount: verdict.exitCount,
    scores: verdict.scores,
  };
}

async function trainDistribution(
  initial: Float32Array,
  configuration: ColonyTrainingSettings
): Promise<TrainingResult> {
  let vector = initial;
  let sigma = configuration.initialSigma;
  const settings = searchSettings(
    configuration.rngSeed,
    configuration.pairs,
    configuration.ticks,
    configuration.jobs,
    configuration.learningRate
  );
  const trajectory: Record<string, unknown>[] = [];
  const checkpointRuns: number[] = [];
  for (let generation = 1; generation <= configuration.generations; generation++) {
    const trainingWorldSeeds = generationWorldSeeds(
      configuration.trainingSeedBase,
      configuration.trainingWorldCount,
      generation
    );
    const generationStarted = Date.now();
    const result = await proposeGeneration(vector, sigma, trainingWorldSeeds, settings);
    vector = result.vector;
    trajectory.push({
      generation,
      trainingWorldSeeds,
      sigma,
      populationMean: result.populationMean,
      populationBest: outcomeSummary(result.best),
    });
    if (
      generation % configuration.checkpointEvery === 0 ||
      generation === configuration.generations
    ) {
      checkpointRuns.push(
        recordCheckpoint(
          vector,
          result,
          {
            generation,
            parentRun: configuration.parentRun,
            rngSeed: configuration.rngSeed,
            ticks: configuration.ticks,
            trainingWorldSeeds,
            sigma,
          },
          Date.now() - generationStarted
        )
      );
    }
    console.log(
      `gen ${generation}/${configuration.generations}: ` +
        `training complete=${result.best.completionCount}/${configuration.trainingWorldCount} ` +
        `best=${result.best.mean.toFixed(3)} population=${result.populationMean.toFixed(3)} ` +
        `sigma=${sigma.toFixed(4)}`
    );
    sigma *= configuration.sigmaDecay;
  }
  return { vector, finalSigma: sigma, trajectory, checkpointRuns };
}

function recordFinalResult(
  flags: Flags,
  configuration: ColonyTrainingSettings,
  training: TrainingResult,
  initialEvaluation: ColonyOutcomeVerdict,
  finalEvaluation: ColonyOutcomeVerdict,
  wallMs: number
): number {
  return recordRun(
    openLedger(),
    {
      experiment: "optimize-colony-loop",
      label: flag(flags, "label", ""),
      driver: "full-rnn-stochastic-es",
      seed: configuration.rngSeed,
      ticks: configuration.ticks,
      cadence: 0,
      params: { ...configuration, finalSigma: training.finalSigma },
      patches: [],
      summary: {
        initialEvaluation: outcomeSummary(initialEvaluation),
        finalEvaluation: outcomeSummary(finalEvaluation),
        trajectory: training.trajectory,
        checkpointRuns: training.checkpointRuns,
        vector: Array.from(training.vector),
      },
      wallMs,
    },
    [],
    []
  );
}

/** Fixed-budget full-weight ES over fresh world batches, followed by untouched evaluation. */
export async function runOptimizeColonyLoop(flags: Flags): Promise<void> {
  const configuration = colonyTrainingSettings(flags);
  const started = Date.now();
  const initial = preparedStartingVector(configuration.parentRun, configuration);
  const initialEvaluation = await evaluate(
    initial,
    configuration.evaluationWorldSeeds,
    configuration.ticks
  );
  console.log(
    `before training: complete=${initialEvaluation.completionCount}/` +
      `${configuration.evaluationWorldSeeds.length} mean=${initialEvaluation.mean.toFixed(3)}`
  );
  const training = await trainDistribution(initial, configuration);
  const finalEvaluation = await evaluate(
    training.vector,
    configuration.evaluationWorldSeeds,
    configuration.ticks
  );
  const runId = recordFinalResult(
    flags,
    configuration,
    training,
    initialEvaluation,
    finalEvaluation,
    Date.now() - started
  );
  console.log(
    `[run ${runId}] untouched complete ${initialEvaluation.completionCount}->${finalEvaluation.completionCount}` +
      `/${configuration.evaluationWorldSeeds.length}, ` +
      `mean ${initialEvaluation.mean.toFixed(3)}->${finalEvaluation.mean.toFixed(3)}`
  );
  if (flag(flags, "bake", "false") === "true") {
    console.log(`baked ${bakeClone(training.vector, runId)}`);
  }
}
