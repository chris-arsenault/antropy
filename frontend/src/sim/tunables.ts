/**
 * Single home for simulation constants (MVP-PLAN confirmed decisions).
 * Values are calibrated inside the phase that first exercises them.
 */

// World dimensions in voxels. Y is up, matching the renderer's axis.
export const WORLD_SIZE_X = 192;
export const WORLD_SIZE_Y = 64;
export const WORLD_SIZE_Z = 192;

// Terrain generation (M1).
export const TERRAIN = {
  /** Mean surface height. */
  surfaceBase: 40,
  /** fBm amplitude of the surface, in voxels. */
  surfaceAmplitude: 10,
  /** Horizontal feature scale: noise-space units per voxel. */
  surfaceScale: 1 / 48,
  /** Octaves for the surface heightmap. */
  surfaceOctaves: 4,
  /** Mean topsoil skin thickness below the surface. */
  topsoilDepth: 4,
  /** Warp amplitude on the topsoil/clay boundary. */
  topsoilWarp: 2,
  /** Mean clay band thickness below the topsoil. */
  clayDepth: 12,
  /** Warp amplitude on the clay/rock boundary. */
  clayWarp: 5,
  /** Boundary-warp feature scale. */
  warpScale: 1 / 24,
  /** Rows at the bottom that are always rock. */
  basementRows: 2,
} as const;

// Scent machinery shared across fields; physics differ per field role.
export const SCENT = {
  /** Ticks between diffusion/evaporation passes. */
  stepInterval: 5,
  /** Scent injected next to each FOOD voxel per pass (drives R3 reach). */
  foodSourceStrength: 0.8,
  /** Nest scent injected at each queen per pass (ADR-0006). */
  nestSourceStrength: 0.8,
} as const;

/**
 * Trail physics (pheromone A/B): slow evaporation so reinforced deposits
 * accumulate into long-lived trails (~575-tick mass half-life), low
 * diffusion so trails stay narrow with usable local gradients.
 */
export const TRAIL_PHYSICS = {
  diffusionRate: 0.06,
  evaporation: 0.994,
  epsilon: 2e-3,
} as const;

/**
 * Beacon physics (food and nest scent): fast turnover keeps continuously
 * re-emitted source clouds compact, bounding the active set.
 */
export const BEACON_PHYSICS = {
  diffusionRate: 0.5,
  evaporation: 0.9,
  epsilon: 5e-3,
} as const;

// Energy economy (M4, design spec §6). Energy is normalized: 1 = a full ant.
// Mutable (no `as const`) solely for the calibration harness's scoped,
// restoring overrides (calibration.ts); production code never writes it.
export const ENERGY = {
  /** Basal metabolic drain per tick at bodyScale 1 (superlinear in scale). */
  basalPerTick: 0.00012,
  basalScaleExponent: 1.5,
  /** Cost per lattice step. */
  stepCost: 0.0003,
  /** Extra per-step cost while carrying spoil (per load). */
  carryStepCost: 0.0003,
  /** Sensor upkeep per tick. */
  sensorUpkeep: 0.0001,
  /** Cost per unit of pheromone deposited. */
  depositCostPerUnit: 0.002,
  /** Energy granted by eating one FOOD voxel (corpses are FOOD voxels too).
   * Sized for satiation ratio R2 in its 0.1–0.3 band (§B.3). */
  foodEnergy: 0.2,
  /** Maximum stored energy. */
  max: 1,
  /** Age cap in ticks (pre-genome default; the lifespan gene refines it). */
  ageCap: 20_000,
};

// Digging and carrying (design spec §5.4).
export const DIG = {
  /** Energy cost by material. */
  cost: {
    topsoil: 0.004,
    clay: 0.012,
    looseFill: 0.002,
    /** Picking up a FOOD voxel for transport (ADR-0006). */
    foodPickup: 0.001,
  },
  /** Cost to place a carried load. */
  depositCost: 0.001,
} as const;

// Food spawn governor: density-dependent target around a seasonal base.
// Mutable for calibration harness overrides only, like ENERGY above.
export const FOOD_GOVERNOR = {
  /** Ticks between governor passes. */
  interval: 50,
  /** Baseline FOOD voxels at season midpoint — dense enough that the scent
   * horizon R3 exceeds 1 (§B.3): mean nearest-food distance under the
   * beacon's measured detection radius. */
  targetCount: 800,
  /** Maximum voxels spawned per pass (kept low enough that patch turnover
   * clears the trail half-life, R5b). */
  maxSpawnPerPass: 20,
};

// Oscillating carrying capacity (design spec §9.3): K breathes forever.
export const SEASON = {
  /** Ticks per full sinusoid cycle. */
  periodTicks: 40_000,
  /** Peak-to-midpoint amplitude as a fraction of the base. */
  amplitude: 0.5,
  /** Gaussian noise on each governor pass, as a fraction of the base. */
  noise: 0.05,
} as const;

/** Pheromone deposit amount when the output fires at full intensity. */
export const PHEROMONE_DEPOSIT_MAX = 1;

// Colony and reproduction (M6, design spec §7).
export const COLONY = {
  /** Stored sperm from polyandrous founding. */
  spermCount: 6,
  /** First brood spawned as adults at founding (fast-forwarded eggs). */
  initialWorkers: 40,
  /** Chamber depth below the surface. */
  chamberDepth: 6,
  /** Minimum ticks between eggs. */
  eggIntervalMin: 300,
  /** Stockpile cost of laying beyond the egg's energy endowment. */
  eggLayCost: 0.1,
  /** Chebyshev distance to the queen within which food deposit = delivery. */
  deliveryRadius: 2,
  /** Trophallaxis: energy above this transfers to the queen when nearby. */
  trophallaxisThreshold: 0.5,
  /** Maximum energy transferred to the stockpile per tick per worker. */
  trophallaxisRate: 0.02,
  /** Stockpile level at which the queen stops receiving. */
  stockpileSatiation: 8,
  /** Workers below this are fed from the stockpile when near the queen. */
  feedThreshold: 0.3,
  /** Maximum energy fed to a hungry worker per tick. */
  feedRate: 0.02,
  /** Stockpile floor the queen keeps for herself while feeding workers. */
  queenReserve: 1,
  /** Claustral body reserves a colony starts with (bridges to delivery). */
  foundingStockpile: 3,
  /** Queen lifespan before merit-weighted succession. */
  queenLifespanTicks: 30_000,
  /** Egg incubation time. */
  incubationTicks: 600,
  /** Hatchling body scale as a fraction of the genetic target. */
  juvenileFraction: 0.5,
  /** Body-scale growth per meal while juvenile. */
  growthPerMeal: 0.1,
} as const;

// Queen lifecycle and real founding (design spec §7.2, §9.1).
export const QUEEN = {
  /** Stockpile drain keeping the queen alive; starvation collapses the colony. */
  upkeepPerTick: 0.0002,
  /** Sustained empty-stockpile ticks before the queen starves (body reserves). */
  starvationGraceTicks: 3000,
  /** Stockpile level that triggers a queen-destined egg. */
  eggThreshold: 2.5,
  /** Energy endowment of a queen egg (claustral flight reserves seed). */
  eggEndowment: 1,
  /** Minimum ticks between queen eggs. */
  eggIntervalMin: 4000,
  /** Margin from map edges for flight landing sites. */
  flightMargin: 10,
} as const;

// Nest decay (design spec §9.2): abandonment is punished, not existence.
export const DECAY = {
  /** Ticks between decay passes. */
  interval: 25,
  /** Untrafficked time before a subsurface air voxel may collapse. */
  ttlTicks: 6000,
  /** Collapse chance per pass once overdue. */
  collapseChance: 0.05,
} as const;

// Egg exposure (design spec §7.3): surface brood is hazardous.
export const EGG_EXPOSURE = {
  /** Death chance per tick for an egg above the original surface. */
  deathChancePerTick: 0.002,
} as const;

// Haploid males (design spec §7.1 channel 2).
export const MALE = {
  /** Male lifespan as a fraction of the genetic lifespan cap. */
  lifespanFraction: 0.25,
  /** Energy margin a worker must keep after laying a male egg. */
  layReserve: 0.2,
} as const;
