import { Output } from "../../src/sim/controller/contract";
import { GENOME_LENGTH } from "../../src/sim/controller/rnn";
import { createRng } from "../../src/sim/rng";
import { flag, intFlag, type Flags } from "../lib/flags";
import { openLedger, recordRun } from "../lib/ledger";
import { trainBehaviorClone } from "../lib/rnnClone";
import { oracleEnergyDemonstration, shadowOracleEnergyDemonstration } from "./colonyLoopEnergy";

type EnergyDemonstration = ReturnType<typeof oracleEnergyDemonstration>;

function seedList(raw: string): number[] {
  return raw.split(",").map(Number);
}

function startingVector(runId: number): Float32Array {
  const row = openLedger().prepare("SELECT summary FROM runs WHERE id = ?").get(runId) as
    { summary: string } | undefined;
  const vector = row ? (JSON.parse(row.summary) as { vector?: number[] }).vector : undefined;
  if (vector?.length !== GENOME_LENGTH) throw new Error(`run ${runId} has no controller vector`);
  return Float32Array.from(vector);
}

function inactiveActuatorMargin(demos: EnergyDemonstration[], margin: number) {
  return demos.flatMap(({ sequences }) =>
    sequences.map((frames) =>
      frames.map((frame) => {
        const outputs = Float32Array.from(frame.outputs);
        if (outputs[Output.PHEROMONE_A] === 0) outputs[Output.PHEROMONE_A] = -margin;
        if (outputs[Output.PHEROMONE_B] === 0) outputs[Output.PHEROMONE_B] = -margin;
        return { ...frame, outputs };
      })
    )
  );
}

/** Correct the recurrent controller on full-population sensor histories. */
export function runCorrectColonyEnergy(flags: Flags): void {
  const teacherSeeds = seedList(flag(flags, "teacher-seeds", "9800,9801"));
  const learnerSeeds = seedList(flag(flags, "learner-seeds", "9800,9801,9802"));
  const validationSeeds = seedList(flag(flags, "validation-seeds", "9803"));
  const parentRun = intFlag(flags, "start-run", 901);
  const ticks = intFlag(flags, "ticks", 1200);
  const epochs = intFlag(flags, "epochs", 2);
  const chunk = intFlag(flags, "chunk", 96);
  const rngSeed = intFlag(flags, "seed", 9940);
  const rate = Number(flag(flags, "rate", "0.00005"));
  const inactiveMargin = Number(flag(flags, "inactive-margin", "0.3"));
  const started = Date.now();
  const initial = startingVector(parentRun);
  const teacher = teacherSeeds.map((seed) => oracleEnergyDemonstration(seed, ticks));
  const learner = learnerSeeds.map((seed) => shadowOracleEnergyDemonstration(seed, ticks));
  const validation = validationSeeds.map((seed) => oracleEnergyDemonstration(seed, ticks));
  const trainingSequences = inactiveActuatorMargin([...teacher, ...learner], inactiveMargin);
  const validationSequences = inactiveActuatorMargin(validation, inactiveMargin);
  const trained = trainBehaviorClone(
    trainingSequences,
    validationSequences,
    createRng(rngSeed),
    epochs,
    rate,
    chunk,
    initial
  );
  const runId = recordRun(
    openLedger(),
    {
      experiment: "correct-colony-energy",
      label: flag(flags, "label", ""),
      driver: "rnn-population-shadow-oracle",
      seed: rngSeed,
      ticks,
      cadence: 0,
      params: {
        parentRun,
        teacherSeeds,
        learnerSeeds,
        validationSeeds,
        epochs,
        chunk,
        rate,
        inactiveMargin,
      },
      patches: [],
      summary: {
        trainingSequences: trainingSequences.length,
        validationSequences: validationSequences.length,
        losses: trained.losses,
        validationLoss: trained.validationLoss,
        vector: Array.from(trained.vector),
      },
      wallMs: Date.now() - started,
    },
    [],
    []
  );
  console.log(
    `[run ${runId}] population correction: loss ${trained.losses[0].toFixed(5)} -> ${trained.losses.at(-1)?.toFixed(5)} validation=${trained.validationLoss.toFixed(5)}`
  );
}
