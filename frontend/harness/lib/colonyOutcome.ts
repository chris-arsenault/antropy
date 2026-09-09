import { isInterior } from "../../src/sim/terrain";
import { energyResidual, storedFood } from "../../src/sim/resources";
import { type World } from "../../src/sim/types";

export interface ColonyOutcomePoint {
  taskOverrides: number;
  tick: number;
  queenAlive: boolean;
  queenReserve: number;
  workers: number;
  founders: number;
  births: number;
  workerReserve: number;
  broodReserve: number;
  broodInvestment: number;
  queenFed: number;
  broodFed: number;
  storedEnergy: number;
  residual: number;
}

export function colonyOutcomePoint(world: World, removedEnergy = 0): ColonyOutcomePoint {
  return {
    taskOverrides: world.taskOverrides,
    tick: world.tick,
    queenAlive: world.queen.alive,
    queenReserve: world.queen.energy,
    workers: world.ants.length,
    founders: world.ants.filter((ant) => ant.birthTick <= 0).length,
    births: world.metrics.workerHatches,
    workerReserve: world.ants.reduce((sum, ant) => sum + ant.energy, 0),
    broodReserve: world.brood.reduce((sum, brood) => sum + brood.energy, 0),
    broodInvestment: world.brood.reduce((sum, brood) => sum + brood.investment, 0),
    queenFed: world.economy.queenFed,
    broodFed: world.economy.broodFed,
    storedEnergy: storedFood(world) * world.config.foodEnergyDensity,
    residual: energyResidual(world) - removedEnergy,
  };
}

/** Whole-colony outcomes only: no teacher labels, pickup, drop, motion or scent rewards. */
export function scoreColonyOutcome(series: readonly ColonyOutcomePoint[], lifespan: number) {
  const first = series[0],
    final = series.at(-1)!;
  const valid = series.every(validPoint);
  const late = series.filter((point) => point.tick >= final.tick - lifespan);
  const middle = late.find((point) => point.tick >= final.tick - lifespan / 2) ?? final;
  const continued = [
    [late[0], middle],
    [middle, final],
  ].every(([a, b]) => b.births > a.births && b.queenFed > a.queenFed && b.broodFed > a.broodFed);
  const viable =
    valid &&
    series.every((point) => point.taskOverrides === 0) &&
    first.tick === 0 &&
    final.tick - first.tick >= lifespan * 3 &&
    late.every((point) => point.queenAlive && point.workers > 0 && point.founders === 0) &&
    continued;
  const aliveFraction = series.filter((point) => point.queenAlive).length / series.length;
  const queenHealth = series.reduce((sum, point) => sum + point.queenReserve, 0) / series.length;
  const gains = {
    queenFed: final.queenFed - first.queenFed,
    broodFed: final.broodFed - first.broodFed,
    births: final.births - first.births,
  };
  // Bounded physical-state shaping provides a gradient before a full survival pass exists.
  // It cannot let a queen-dead colony outrank a queen-alive colony, or either outrank viability.
  const reserve =
    series.reduce(
      (sum, point) => sum + point.workerReserve + point.broodReserve + point.broodInvestment,
      0
    ) / series.length;
  const progress =
    aliveFraction * 20 +
    Math.min(1, queenHealth / 24) * 20 +
    (10 * reserve) / (reserve + 64) +
    boundedGain(gains.births, 8) +
    boundedGain(gains.queenFed, 4) +
    boundedGain(gains.broodFed, 8);
  const score = valid ? Number(viable) * 1000 + Number(final.queenAlive) * 100 + progress : -1;
  return { valid, viable, score, final, continued, gains };
}

function boundedGain(gain: number, scale: number): number {
  return (10 * Math.max(0, gain)) / (Math.max(0, gain) + scale);
}

function validPoint(point: ColonyOutcomePoint): boolean {
  return (
    Object.entries(point).every(
      ([key, value]) =>
        typeof value === "boolean" || (Number.isFinite(value) && (key === "residual" || value >= 0))
    ) && Math.abs(point.residual) < 1e-6
  );
}

export function removeExternalSupply(world: World): number {
  world.renewableSources.splice(0);
  let removed = 0;
  for (const [index, quantity] of world.food) {
    if (isInterior(world.grid, index)) continue;
    removed += quantity * world.config.foodEnergyDensity;
    world.food.delete(index);
    world.foodSources.delete(index);
  }
  return removed;
}
