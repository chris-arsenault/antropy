/**
 * Single home for simulation constants (MVP-PLAN confirmed decisions).
 * Values are calibrated inside the phase that first exercises them.
 */

// World dimensions in voxels. Y is up, matching the renderer's axis.
export const WORLD_SIZE_X = 128;
export const WORLD_SIZE_Y = 64;
export const WORLD_SIZE_Z = 128;

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

// Scent fields (M4): pheromone A/B and food scent share this machinery.
export const SCENT = {
  /** Ticks between diffusion/evaporation passes. */
  stepInterval: 5,
  /** Fraction of a voxel's scent offered to neighbors per pass. */
  diffusionRate: 0.5,
  /** Multiplicative retention per pass. */
  evaporation: 0.9,
  /** Values below this are zeroed and deactivated (caps the active set). */
  epsilon: 5e-3,
  /** Scent injected next to each FOOD voxel per pass. */
  foodSourceStrength: 0.5,
} as const;

// Energy economy (M4, design spec §6). Energy is normalized: 1 = a full ant.
export const ENERGY = {
  /** Basal metabolic drain per tick at bodyScale 1 (superlinear in scale). */
  basalPerTick: 0.0002,
  basalScaleExponent: 1.5,
  /** Cost per lattice step. */
  stepCost: 0.0005,
  /** Extra per-step cost while carrying spoil. */
  carryStepCost: 0.0004,
  /** Sensor upkeep per tick. */
  sensorUpkeep: 0.0001,
  /** Cost per unit of pheromone deposited. */
  depositCostPerUnit: 0.002,
  /** Energy granted by eating one FOOD voxel (corpses are FOOD voxels too). */
  foodEnergy: 0.5,
  /** Maximum stored energy. */
  max: 1,
  /** Age cap in ticks (pre-genome default; the lifespan gene refines it). */
  ageCap: 20_000,
} as const;

// Digging (M4, design spec §5.4).
export const DIG = {
  /** Energy cost by material. */
  cost: {
    topsoil: 0.004,
    clay: 0.012,
    looseFill: 0.002,
  },
  /** Cost to place carried spoil. */
  depositCost: 0.001,
} as const;

// Food spawn governor (M4): static density-dependent target.
export const FOOD_GOVERNOR = {
  /** Ticks between governor passes. */
  interval: 50,
  /** FOOD voxels the governor tries to keep in the world. */
  targetCount: 220,
  /** Maximum voxels spawned per pass. */
  maxSpawnPerPass: 10,
} as const;

/** Pheromone deposit amount when the output fires at full intensity. */
export const PHEROMONE_DEPOSIT_MAX = 1;
