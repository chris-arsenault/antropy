import { isInterior } from "../../src/sim/terrain";
import { createWorld, stepWorld } from "../../src/sim/world";
import { PROGRAMMED_LIFECYCLE_CONFIG } from "../../src/sim/config";
import { energyResidual, storedFood, totalEnergy } from "../../src/sim/resources";
import { type World } from "../../src/sim/types";
import { flag, integerFlag, seedsFlag, type Flags } from "../lib/flags";
import { openLedger, recordRun } from "../lib/ledger";
import { writeFileSync } from "node:fs";
import { encodeCheckpoint } from "../../src/persist/checkpoint";

function removeExternalFood(world: World): number {
  world.renewableSources.splice(0);
  let removed = 0;
  for (const [index, amount] of world.food) {
    if (isInterior(world.grid, index)) continue;
    removed += amount * world.config.foodEnergyDensity;
    world.food.delete(index);
    world.foodSources.delete(index);
  }
  return removed;
}

function snapshot(world: World) {
  const stage = (name: string) => world.brood.filter((brood) => brood.stage === name).length;
  return {
    tick: world.tick,
    workers: world.ants.length,
    founders: world.ants.filter((ant) => ant.birthTick <= 0).length,
    queenAlive: world.queen.alive,
    queenEnergy: world.queen.energy,
    eggs: stage("egg"),
    larvae: stage("larva"),
    pupae: stage("pupa"),
    births: world.metrics.workerHatches,
    deaths: world.metrics.deaths,
    pickups: world.metrics.foodPickedUp,
    deposits: world.metrics.foodDeposited,
    queenFed: world.economy.queenFed,
    broodFed: world.economy.broodFed,
    harvested: world.economy.harvested,
    storedFood: storedFood(world),
    ageDeaths: world.economy.ageDeaths,
    starvationDeaths: world.economy.starvationDeaths,
    broodDeaths: world.economy.broodDeaths,
    energy: totalEnergy(world),
    residual: energyResidual(world),
    positions: world.ants.map((ant) => [ant.id, ant.x, ant.y, ant.energy, ant.cargo]),
  };
}

export function runColonySurvival(flags: Flags): void {
  const seeds = seedsFlag(flags, "1,2,3");
  const ticks = integerFlag(flags, "ticks", 24_000);
  const deprivation = integerFlag(flags, "deprivation", 0);
  const config = {
    ...PROGRAMMED_LIFECYCLE_CONFIG,
    workerCount: integerFlag(flags, "workers", PROGRAMMED_LIFECYCLE_CONFIG.workerCount),
  };
  const started = Date.now();
  const results = seeds.map((seed) => {
    const world = createWorld(seed, "programmed-lifecycle", config);
    const series = [];
    let removedEnergy = 0;
    for (let tick = 0; tick < ticks; tick++) {
      if (deprivation > 0 && tick === deprivation) removedEnergy = removeExternalFood(world);
      stepWorld(world);
      if (world.tick % 2_000 === 0 || world.tick === ticks) {
        const point = snapshot(world);
        series.push(point);
        console.log(
          JSON.stringify({
            seed,
            ...point,
            positions: undefined,
            residual: point.residual - removedEnergy,
          })
        );
      }
    }
    const checkpointPath = flag(flags, "checkpoint", "");
    if (checkpointPath && seeds.length === 1)
      writeFileSync(checkpointPath, encodeCheckpoint(world));
    return { seed, series, removedEnergy, final: snapshot(world) };
  });
  const database = openLedger();
  const id = recordRun(database, {
    experiment: "2d-programmed-colony",
    label: flag(flags, "label", "physical-survival"),
    driver: "local-programmed-policy",
    seed: seeds[0],
    ticks,
    params: { seeds, config, deprivation },
    summary: { results },
    wallMs: Date.now() - started,
  });
  database.close();
  console.log(`Recorded colony run ${id}`);
}
