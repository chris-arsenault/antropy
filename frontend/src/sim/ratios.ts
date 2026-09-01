import { createGrid } from "./grid";
import {
  BEACON_PHYSICS,
  COLONY,
  DIG,
  ENERGY,
  FOOD_GOVERNOR,
  SCENT,
  SEASON,
  TRAIL_PHYSICS,
} from "./tunables";
import {
  createScentField,
  depositScent,
  sampleScent,
  stepScentField,
  type ScentPhysics,
} from "./scent";
import { voxelIndex } from "./grid";
import { type World } from "./world";

/**
 * Appendix B §B.3 viability ratios: the world's economy nondimensionalized.
 * Tune ratios, not knobs; log them live so out-of-band drift is visible.
 */
export interface ViabilityRatios {
  /** R1: energy per meal over energy per round trip. */
  tripProfitability: number;
  /** R2: meal size over tank size. */
  satiation: number;
  /** R3: scent detection radius over mean nearest-food distance. */
  scentHorizon: number;
  /** R4: maximum foraging radius over mean food distance. */
  foragingReach: number;
  /** R5a: trail half-life over trip time (want ≫ 1). */
  trailOverTrip: number;
  /** R5b: patch turnover over trail half-life (want ≫ 1). */
  patchOverTrail: number;
  /** R6: founding-chamber dig cost over worker lifetime budget. */
  digEconomics: number;
  /** R7: supportable population from food inflow. */
  ecosystemClosure: number;
}

export const RATIO_BANDS = {
  tripProfitability: { min: 3, max: Infinity },
  satiation: { min: 0.1, max: 0.3 },
  scentHorizon: { min: 1, max: Infinity },
  foragingReach: { min: 1, max: Infinity },
  trailOverTrip: { min: 3, max: Infinity },
  patchOverTrail: { min: 3, max: Infinity },
  digEconomics: { min: 0, max: 0.1 },
  ecosystemClosure: { min: 20, max: Infinity },
} as const;

/** Mean per-tick metabolic rate of a typical moving ant. */
export function typicalMetabolicRate(): number {
  const basal = ENERGY.basalPerTick;
  const upkeep = ENERGY.sensorUpkeep;
  const think = 0.00008;
  const stepping = ENERGY.stepCost * MEAN_SPEED;
  return basal + upkeep + think + stepping;
}

const MEAN_SPEED = 0.7; // voxels/tick at the seeded forward drive

/**
 * Beacon detection radius, measured by running the real scent physics to
 * steady state around a single source on a small open grid. Pass a physics
 * and emission strength to size a field (the nest plume needs a measured
 * radius, §C Rule 11); passes scale with the field's half-life.
 */
export function measureDetectRadius(
  sensoryResolution = 0.02,
  physics = BEACON_PHYSICS as ScentPhysics,
  strength = SCENT.foodSourceStrength * 5, // ~5 emitting faces
  size = 33
): number {
  const grid = createGrid(size, size, size);
  const field = createScentField(grid, physics);
  const center = Math.floor(size / 2);
  const source = voxelIndex(grid, center, center, center);
  const passes = Math.max(60, Math.round((6 * Math.log(0.5)) / Math.log(physics.evaporation)));
  for (let pass = 0; pass < passes; pass++) {
    depositScent(field, source, strength);
    stepScentField(grid, field);
  }
  let radius = 0;
  for (let r = 1; r < center; r++) {
    if (sampleScent(field, voxelIndex(grid, center + r, center, center)) >= sensoryResolution) {
      radius = r;
    }
  }
  return radius;
}

let cachedDetectRadius: number | null = null;

function detectRadius(): number {
  if (cachedDetectRadius === null) {
    cachedDetectRadius = measureDetectRadius();
  }
  return cachedDetectRadius;
}

/** Mean nearest-food distance for a Poisson field of the given count. */
export function meanFoodDistance(foodCount: number, area: number): number {
  if (foodCount <= 0) {
    return Infinity;
  }
  return 0.5 / Math.sqrt(foodCount / area);
}

function trailHalfLifeTicks(): number {
  return (Math.log(0.5) / Math.log(TRAIL_PHYSICS.evaporation)) * SCENT.stepInterval;
}

export function computeRatios(world: World): ViabilityRatios {
  const m = typicalMetabolicRate();
  const area = world.grid.sizeX * world.grid.sizeZ;
  const foodCount = Math.max(world.foodSources.size, world.foodTarget, 1);
  const dFood = meanFoodDistance(foodCount, area);
  const tripTicks = (2 * dFood) / MEAN_SPEED;
  const tank = ENERGY.max;
  const chamberCost = 27 * DIG.cost.topsoil + COLONY.chamberDepth * DIG.cost.topsoil;
  const lifetimeBudget = m * ENERGY.ageCap;
  const halfLife = trailHalfLifeTicks();
  const patchTurnover =
    (world.foodTarget / Math.max(1, FOOD_GOVERNOR.maxSpawnPerPass)) * FOOD_GOVERNOR.interval;

  return {
    tripProfitability: ENERGY.foodEnergy / (m * Math.max(1, tripTicks)),
    satiation: ENERGY.foodEnergy / tank,
    scentHorizon: detectRadius() / dFood,
    foragingReach: (tank * MEAN_SPEED) / (2 * m) / Math.max(1, dFood),
    trailOverTrip: halfLife / Math.max(1, tripTicks),
    patchOverTrail: patchTurnover / halfLife,
    digEconomics: chamberCost / lifetimeBudget,
    ecosystemClosure:
      (FOOD_GOVERNOR.maxSpawnPerPass * ENERGY.foodEnergy) / FOOD_GOVERNOR.interval / m,
  };
}

export function ratioInBand(key: keyof ViabilityRatios, value: number): boolean {
  const band = RATIO_BANDS[key];
  return value >= band.min && value <= band.max;
}

/**
 * Hard preconditions checked at world creation (§B.3 R7, §A.3.3 Design
 * Rule 1): a world that cannot support a colony, or whose seasons alias the
 * generation time, is invalid state and stops loudly.
 */
export function assertWorldViability(world: World): void {
  const ratios = computeRatios(world);
  if (ratios.ecosystemClosure < RATIO_BANDS.ecosystemClosure.min) {
    throw new Error(
      `ecosystem closure R7=${ratios.ecosystemClosure.toFixed(1)} below minimum viable colony (${RATIO_BANDS.ecosystemClosure.min})`
    );
  }
  const generationProxy = COLONY.incubationTicks + COLONY.eggIntervalMin;
  if (SEASON.periodTicks < 10 * generationProxy) {
    throw new Error(
      `season period ${SEASON.periodTicks} violates Design Rule 1 (< 10 × generation ${generationProxy})`
    );
  }
}
