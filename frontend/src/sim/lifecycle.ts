import { createAnt } from "./ant";
import { cellIndex } from "./grid";
import { putFood, spend } from "./resources";
import { type Ant, type Brood, type World } from "./types";
import { releaseWorkerLoads } from "./construction/transport";
import {
  maintenanceMultiplier,
  developmentRate,
  releaseBodyWater,
  spoilFood,
} from "./climate/physiology";
import { adultBodies, bodyWaterKey, reproductive } from "./adultBody";
import { broodLandmark } from "./construction/brood";

function burn(world: World, requested: number, energy: number): number {
  const amount = Math.min(requested, energy);
  world.economy.dissipated += amount;
  world.economy.metabolism += amount;
  world.metrics.energySpent += amount;
  return energy - amount;
}

function maintainAdult(world: World, ant: Ant): boolean {
  if (reproductive(ant) && !ant.alive) return false;
  ant.age += 1;
  if (!world.config.mortalityEnabled) return true;
  const queen = reproductive(ant);
  if (queen) ant.layingAge += 1;
  const metabolism = queen ? world.config.queenMetabolism : world.config.metabolism;
  const lifespan = queen ? world.config.queenLifespan : world.config.workerLifespan;
  spend(world, ant, metabolism * maintenanceMultiplier(world, ant, bodyWaterKey(ant)), true);
  if (ant.energy > 0 && ant.age < lifespan) return true;
  retireAdult(world, ant);
  return false;
}

function retireAdult(world: World, ant: Ant): void {
  const cause = ant.energy <= 0 ? "starvation" : "age";
  if (reproductive(ant)) {
    world.economy.queenDeath = cause;
    ant.alive = false;
    ant.carrier = null;
  } else {
    if (cause === "starvation") world.economy.starvationDeaths += 1;
    else world.economy.ageDeaths += 1;
    world.metrics.deaths += 1;
  }
  putFood(
    world,
    cellIndex(world.grid, ant.x, ant.y),
    ant.energy / world.config.foodEnergyDensity + ant.cargo
  );
  ant.energy = 0;
  ant.cargo = 0;
  releaseWorkerLoads(world, ant);
  releaseBodyWater(world, ant, bodyWaterKey(ant));
}

function stepBrood(world: World, brood: Brood): boolean {
  brood.age += developmentRate(world, brood);
  brood.energy = burn(
    world,
    world.config.broodMetabolism * maintenanceMultiplier(world, brood, `brood:${brood.id}`),
    brood.energy
  );
  const energy = brood.energy + brood.investment;
  if (brood.energy <= 0) {
    putFood(
      world,
      cellIndex(world.grid, brood.x, brood.y),
      brood.investment / world.config.foodEnergyDensity
    );
    world.economy.broodDeaths += 1;
    releaseBodyWater(world, brood, `brood:${brood.id}`);
    clearBrood(world, brood);
    return false;
  }
  if (brood.stage === "egg" && brood.age >= world.config.eggDuration) {
    brood.stage = "larva";
    brood.age = 0;
  } else if (
    brood.stage === "larva" &&
    brood.age >= world.config.larvaDuration &&
    brood.investment >= world.config.broodInvestment
  ) {
    brood.stage = "pupa";
    brood.age = 0;
  } else if (brood.stage === "pupa" && brood.age >= world.config.pupaDuration) {
    if (
      adultBodies(world).some(
        (ant) => ant.brood === brood.id || (ant.x === brood.x && ant.y === brood.y)
      )
    )
      return true;
    world.ants.push(createAnt(world, world.nextAntId++, 0, brood, energy));
    world.metrics.workerHatches += 1;
    world.knowledge.locations.delete(broodLandmark(brood.id));
    releaseBodyWater(world, brood, `brood:${brood.id}`);
    return false;
  }
  return true;
}

function clearBrood(world: World, brood: Brood): void {
  for (const ant of adultBodies(world)) if (ant.brood === brood.id) ant.brood = null;
  world.knowledge.locations.delete(broodLandmark(brood.id));
}

export function maintainColony(world: World): void {
  const survivors = world.ants.filter((ant) => maintainAdult(world, ant));
  world.ants.splice(0, world.ants.length, ...survivors);
  if (world.config.mortalityEnabled) {
    const liveBrood = world.brood.filter((brood) => stepBrood(world, brood));
    world.brood.splice(0, world.brood.length, ...liveBrood);
    maintainAdult(world, world.queen);
  }
  spoilFood(world);
}
