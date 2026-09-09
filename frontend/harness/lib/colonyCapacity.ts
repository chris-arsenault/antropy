import { type World } from "../../src/sim/types";
import { isWalkable } from "../../src/sim/terrain";
import { cellIndex, pointAt } from "../../src/sim/grid";

export function capacityBudget(world: World, target: number) {
  const c = world.config;
  const births = target / c.workerLifespan;
  const development = c.eggDuration + c.larvaDuration + c.pupaDuration;
  const sources = world.renewableSources.length;
  return {
    targetWorkers: target,
    maximumReplacementPopulation: c.workerLifespan / c.layingInterval,
    requiredHatchesPerTick: births,
    maximumLayingInterval: 1 / births,
    minimumConcurrentBrood: births * development,
    queenEggFundingPerTick: births * c.workerEggCost,
    larvalInvestmentPerTick: births * c.broodInvestment,
    workerMetabolismPerTick: target * c.metabolism,
    minimumBroodMetabolismPerTick: births * development * c.broodMetabolism,
    maximumFoodGrowthEnergyPerTick: sources * c.foodRegrowth * c.foodEnergyDensity,
    queenMetabolismPerTick: c.queenMetabolism,
    // Egg and larval funding become body reserves; do not count transfers as dissipation.
    minimumMaintenanceEnergyPerTick:
      target * c.metabolism + births * development * c.broodMetabolism + c.queenMetabolism,
    nurserySearchCellsUpperBound: 48,
    actualSources: sources,
  };
}

/** High-count capacity fixture only. No overlapping founders or unaccounted reserves. */
export function spreadCapacityFounders(world: World): void {
  const cells: number[] = [];
  const queen = cellIndex(world.grid, world.queen.x, world.queen.y);
  for (let i = 0; i < world.grid.cells.length; i++) {
    const p = pointAt(world.grid, i);
    if (i !== queen && isWalkable(world.grid, p.x, p.y)) cells.push(i);
  }
  const distance = (i: number) => {
    const p = pointAt(world.grid, i);
    return Math.abs(p.x - world.queen.x) + Math.abs(p.y - world.queen.y);
  };
  cells.sort((a, b) => distance(a) - distance(b) || a - b);
  if (cells.length < world.ants.length) throw new Error("insufficient capacity fixture space");
  world.ants.forEach((ant, i) => Object.assign(ant, pointAt(world.grid, cells[i])));
}

export function timingSummary(samples: readonly number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  return {
    samples: samples.length,
    meanMs: mean,
    p50Ms: sorted[Math.floor(sorted.length * 0.5)],
    p95Ms: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))],
    maximumMs: sorted.at(-1),
    ticksPerSecond: 1000 / mean,
  };
}
