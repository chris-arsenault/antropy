import { PROGRAMMED_LIFECYCLE_CONFIG } from "../../src/sim/config";
import {
  actColonyNetwork,
  colonyModelDistance,
  perturbColonyModel,
  type ColonyModel,
  createColonyState,
  withoutColonyMemory,
} from "../lib/learnedColony";
import { colonyMotor } from "../../src/sim/controller/colonyEncoding";
import { programmedColony } from "../../src/sim/policies/colony";
import { createRandomState } from "../../src/sim/random";
import { energyResidual, storedFood } from "../../src/sim/resources";
import { createWorld, stepWorld } from "../../src/sim/world";
import { type World } from "../../src/sim/types";
import { flag, integerFlag, seedsFlag, type Flags } from "../lib/flags";
import { digest, loadColonyModel, physicsDigest } from "../lib/colonyArtifacts";
import { openLedger, recordRun } from "../lib/ledger";
import { ColonyMotion } from "../lib/colonyMotion";
import { COLONY_OBSERVATION_CONTRACT } from "../../src/sim/controller/colonyObservation";

function snapshot(world: World) {
  return {
    tick: world.tick,
    workers: world.ants.length,
    founders: world.ants.filter((ant) => ant.birthTick <= 0).length,
    queen: world.queen.energy,
    queenAlive: world.queen.alive,
    brood: world.brood.length,
    births: world.metrics.workerHatches,
    deaths: world.metrics.deaths,
    starvation: world.economy.starvationDeaths,
    harvested: world.economy.harvested,
    queenFed: world.economy.queenFed,
    broodFed: world.economy.broodFed,
    stored: storedFood(world),
    residual: energyResidual(world),
  };
}

function isViable(series: ReturnType<typeof snapshot>[], ticks: number): boolean {
  const final = series.at(-1)!;
  const prior = series.find((point) => point.tick >= ticks - 8_000) ?? series[0];
  return (
    final.queenAlive &&
    final.founders === 0 &&
    final.workers >= 8 &&
    final.births > prior.births &&
    final.harvested > prior.harvested &&
    Math.abs(final.residual) < 1e-6
  );
}

function evaluate(
  seed: number,
  ticks: number,
  model: ColonyModel | null,
  discreteScents: boolean,
  historyOff: boolean
) {
  const world = createWorld(seed, "programmed-lifecycle", PROGRAMMED_LIFECYCLE_CONFIG);
  const states = new Map<number, Float32Array>();
  const confusion = Array.from({ length: 8 }, () => new Array<number>(8).fill(0));
  const errors: unknown[] = [];
  const series = [];
  const motion = new ColonyMotion();
  for (let tick = 0; tick < ticks; tick++) {
    stepWorld(world, (frame, ant) => {
      const teacher = programmedColony(frame);
      if (!model) {
        motion.observe(ant.id, ant.x, ant.y, colonyMotor(teacher));
        return teacher;
      }
      const state = states.get(ant.id) ?? createColonyState(model);
      states.set(ant.id, state);
      if (historyOff) state.fill(0, model.hidden);
      const decoded = actColonyNetwork(model, frame, state);
      const action = discreteScents
        ? {
            ...decoded,
            pheromoneA: Number(decoded.pheromoneA >= 0.5),
            pheromoneB: Number(decoded.pheromoneB >= 0.5),
          }
        : decoded;
      const expected = colonyMotor(teacher),
        actual = colonyMotor(action);
      confusion[expected][actual]++;
      motion.observe(ant.id, ant.x, ant.y, actual);
      if (
        expected !== actual &&
        (errors.length < 16 || (world.tick % 2_000 === 0 && errors.length < 80))
      )
        errors.push({
          tick: world.tick,
          ant: ant.id,
          x: ant.x,
          y: ant.y,
          expected,
          actual,
          frame: { ...frame, navigation: [...frame.navigation] },
        });
      return action;
    });
    if (world.tick % 2_000 === 0 || world.tick === ticks) {
      const point = snapshot(world);
      series.push(point);
      console.log(JSON.stringify({ seed, ...point }));
    }
  }
  const final = series.at(-1)!;
  return {
    seed,
    viable: isViable(series, ticks),
    series,
    final,
    confusion,
    errors,
    positions: world.ants.map((ant) => ({
      id: ant.id,
      x: ant.x,
      y: ant.y,
      heading: ant.heading,
      cargo: ant.cargo,
    })),
    motion: motion.counts,
  };
}

function candidate(original: ColonyModel | null, rms: number, seed: number, memoryOff: boolean) {
  if (!original) return null;
  const model = rms > 0 ? perturbColonyModel(original, createRandomState(seed), rms) : original;
  return memoryOff ? withoutColonyMemory(model) : model;
}

export function runColonyNetworkEvaluation(flags: Flags): void {
  const seeds = seedsFlag(flags, "4,5,6");
  const ticks = integerFlag(flags, "ticks", 12_000);
  const path = flag(flags, "model", "");
  const original = path ? loadColonyModel(path) : null;
  if (original?.version === 5) throw new Error("use colony-outcomes for registered controllers");
  const memoryOff = flag(flags, "memory-off", "false") === "true";
  const rms = Number(flag(flags, "rms", "0"));
  const mutationSeed = integerFlag(flags, "mutation-seed", 1);
  const model = candidate(original, rms, mutationSeed, memoryOff);
  const discreteScents = flag(flags, "discrete-scents", "false") === "true";
  const historyOff = flag(flags, "history-off", "false") === "true";
  const started = Date.now();
  const results = seeds.map((seed) => evaluate(seed, ticks, model, discreteScents, historyOff));
  const database = openLedger();
  const id = recordRun(database, {
    experiment: "colony-network-evaluation",
    label: flag(flags, "label", path || "programmed-control"),
    driver: model ? "learned-local" : "programmed",
    seed: seeds[0],
    ticks,
    params: {
      observationContract: COLONY_OBSERVATION_CONTRACT,
      seeds,
      config: PROGRAMMED_LIFECYCLE_CONFIG,
      physics: physicsDigest(),
      modelHash: model ? digest(JSON.stringify(model)) : null,
      rms,
      mutationSeed,
      memoryOff,
      discreteScents,
      historyOff,
      distance: model && original ? colonyModelDistance(original, model) : 0,
    },
    summary: { results },
    wallMs: Date.now() - started,
  });
  database.close();
  console.log(
    `Recorded evaluation ${id}: ${results.filter((result) => result.viable).length}/${seeds.length} viable`
  );
}
