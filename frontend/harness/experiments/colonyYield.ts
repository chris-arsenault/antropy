import { PROGRAMMED_LIFECYCLE_CONFIG } from "../../src/sim/config";
import { COLONY_OBSERVATION_CONTRACT } from "../../src/sim/controller/colonyObservation";
import { programmedColony } from "../../src/sim/policies/colony";
import { energyResidual, storedFood } from "../../src/sim/resources";
import { createWorld, stepWorld } from "../../src/sim/world";
import { type World } from "../../src/sim/types";
import { ColonyActivity } from "../lib/colonyActivity";
import { physicsDigest, digest } from "../lib/colonyArtifacts";
import { flag, integerFlag, seedsFlag, type Flags } from "../lib/flags";
import { openLedger, recordRun } from "../lib/ledger";
import { readFileSync } from "node:fs";

function snapshot(world: World) {
  return {
    tick: world.tick,
    population: world.ants.length,
    queenAlive: world.queen.alive,
    queenReserve: world.queen.energy,
    births: world.metrics.workerHatches,
    starvation: world.economy.starvationDeaths,
    broodDeaths: world.economy.broodDeaths,
    founders: world.ants.filter((ant) => ant.birthTick <= 0).length,
    storedQuantity: storedFood(world),
    storedEnergy: storedFood(world) * world.config.foodEnergyDensity,
    harvestedEnergy: world.economy.harvested,
    harvestedQuantity: world.economy.harvested / world.config.foodEnergyDensity,
    queenFed: world.economy.queenFed,
    broodFed: world.economy.broodFed,
    residual: energyResidual(world),
  };
}

function evaluate(seed: number, ticks: number, density: number) {
  const config = { ...PROGRAMMED_LIFECYCLE_CONFIG, foodEnergyDensity: density };
  const world = createWorld(seed, "programmed-lifecycle", config);
  const activity = new ColonyActivity();
  const series = [];
  for (let tick = 0; tick < ticks; tick++) {
    stepWorld(world, (frame, ant) => {
      const action = programmedColony(frame);
      activity.observe(world, ant, frame, action);
      return action;
    });
    activity.finishAction(world);
    if (world.tick % 2000 === 0 || world.tick === ticks) {
      const point = { ...snapshot(world), activity: activity.window(world.tick) };
      series.push(point);
      console.log(
        JSON.stringify({
          seed,
          density,
          ...point,
          activity: {
            activeForagers: point.activity.activeForagers,
            longTurnFraction:
              point.activity.longTurnTicks / Math.max(1, point.activity.workerTicks),
          },
        })
      );
    }
  }
  return { seed, density, series, final: snapshot(world), turnEpisodes: activity.episodes() };
}

export function runColonyYield(flags: Flags): void {
  const seeds = seedsFlag(flags, "21,22,23");
  const ticks = integerFlag(flags, "ticks", 40000);
  const densities = flag(flags, "densities", "1,0.75,0.5").split(",").map(Number);
  if (ticks <= 0 || !densities.every((value) => Number.isFinite(value) && value > 0))
    throw new Error("ticks and densities must be positive");
  const started = Date.now();
  const results = densities.flatMap((density) =>
    seeds.map((seed) => evaluate(seed, ticks, density))
  );
  const database = openLedger();
  const id = recordRun(database, {
    experiment: "colony-nutritional-yield",
    label: flag(flags, "label", "matched-yield-panel"),
    driver: "programmed-local-activity",
    seed: seeds[0],
    ticks,
    params: {
      seeds,
      densities,
      config: PROGRAMMED_LIFECYCLE_CONFIG,
      physics: physicsDigest(),
      observationContract: COLONY_OBSERVATION_CONTRACT,
      windowTicks: 2000,
      longTurnThreshold: 100,
      policyHash: digest(
        ["colony", "programmed", "gradient"]
          .map((name) => readFileSync(`src/sim/policies/${name}.ts`, "utf8"))
          .join("\n")
      ),
    },
    summary: { results },
    wallMs: Date.now() - started,
  });
  database.close();
  console.log(`Recorded nutritional yield run ${id}`);
}
