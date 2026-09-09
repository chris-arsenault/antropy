import { hungryRecipient, reachableCells } from "./contact";
import { isInterior } from "./terrain";
import { cellIndex } from "./grid";
import { stepFrom } from "./geometry";
import { foodAt, putFood, spend, takeFood } from "./resources";
import { isWalkable } from "./scent";
import { type Ant, type World } from "./types";
import { cacheAt } from "./construction/sites";
import { energyCapacity } from "./adultBody";

export function eat(world: World, ant: Ant): void {
  spend(world, ant, world.config.mandibleCost);
  const density = world.config.foodEnergyDensity;
  const wanted = Math.min(0.2, Math.max(0, energyCapacity(world, ant) - ant.energy) / density);
  const fromCrop = Math.min(wanted, ant.cargo);
  ant.cargo -= fromCrop;
  let eaten = fromCrop;
  for (const point of [ant, ...reachableCells(world, ant, ant.heading)]) {
    eaten += takeFood(world, cellIndex(world.grid, point.x, point.y), wanted - eaten);
  }
  ant.energy += eaten * density;
  world.economy.eaten += eaten * density;
}

export function feed(world: World, ant: Ant): void {
  spend(world, ant, world.config.mandibleCost);
  for (const point of reachableCells(world, ant, ant.heading)) {
    const recipient = hungryRecipient(world, point);
    if (!recipient) continue;
    const remaining =
      "investment" in recipient
        ? world.config.broodInvestment +
          world.config.workerEggCost -
          recipient.investment -
          recipient.energy
        : world.config.queenEnergy - recipient.energy;
    const quantity = Math.min(ant.cargo, 0.25, remaining / world.config.foodEnergyDensity);
    const amount = quantity * world.config.foodEnergyDensity;
    ant.cargo -= quantity;
    if ("investment" in recipient) {
      const reserve = Math.min(amount, Math.max(0, world.config.workerEggCost - recipient.energy));
      recipient.energy += reserve;
      recipient.investment += amount - reserve;
      world.economy.broodFed += amount;
    } else {
      recipient.energy += amount;
      world.economy.queenFed += amount;
    }
    return;
  }
}

export function releaseFood(world: World, ant: Ant, anywhere = false): void {
  const target = stepFrom(ant, ant.heading);
  const atCache = [...world.caches.values()].some(
    (cache) => target.x === cache.x && target.y === cache.y
  );
  if (!atCache && (!anywhere || !isWalkable(world.grid, target.x, target.y))) return;
  const available = foodAt(world, target.x, target.y);
  const amount = Math.min(ant.cargo, Math.max(0, world.config.cacheCapacity - available));
  if (amount <= 0) return;
  putFood(world, cellIndex(world.grid, target.x, target.y), amount);
  ant.cargo -= amount;
  world.metrics.foodDeposited += amount / world.config.initialFoodQuantity;
  world.metrics.depositTicks.push(world.tick);
  if (ant.pickupTick !== null) {
    world.economy.completedReturns += 1;
    world.economy.returnTicks += world.tick - ant.pickupTick;
    ant.pickupTick = null;
  }
}

export function operateMandibles(world: World, ant: Ant): void {
  spend(world, ant, world.config.mandibleCost);
  if (ant.spoil !== null || ant.brood !== null || world.queen.carrier === ant.id) return;
  if (ant.cargo > 0) {
    releaseFood(world, ant);
    return;
  }
  const target = stepFrom(ant, ant.heading);
  const amount = takeFood(
    world,
    cellIndex(world.grid, target.x, target.y),
    world.config.cropCapacity
  );
  if (amount <= 0) return;
  ant.cargo = amount;
  const harvest =
    cacheAt(world, target) === null &&
    !isInterior(world.grid, cellIndex(world.grid, target.x, target.y));
  if (harvest) world.economy.harvested += amount * world.config.foodEnergyDensity;
  world.metrics.foodPickedUp += amount / world.config.initialFoodQuantity;
  world.metrics.pickupTicks.push(world.tick);
  ant.pickupTick = harvest ? world.tick : null;
}
