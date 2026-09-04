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
  /** Nest scent injected at each queen site per pass: sized with
   * NEST_PHYSICS so the plume's detect radius covers the forage range. */
  nestSourceStrength: 1.2,
} as const;

/**
 * Trail physics (pheromone A/B): slow evaporation so reinforced deposits
 * accumulate into long-lived trails (~575-tick mass half-life), low
 * diffusion so trails stay narrow with usable local gradients.
 */
export const TRAIL_PHYSICS = {
  diffusionRate: 0.06,
  evaporation: 0.994,
  transferEpsilon: 2e-3,
  epsilon: 2e-3,
} as const;

/**
 * Beacon physics (food scent): persistent enough for a stored food source to
 * remain legible through the authored nest, while continuous evaporation
 * still removes a source that is consumed. The low transport cutoff preserves
 * weak gradients along branching tunnels instead of truncating the carrier a
 * few edges from its material source (Appendix F ledger runs 1673-1688).
 */
export const BEACON_PHYSICS = {
  diffusionRate: 0.5,
  evaporation: 0.98,
  transferEpsilon: 1e-5,
  epsilon: 1e-5,
} as const;

/**
 * Nest plume physics: the homing carrier (§C.8 world-side resolution —
 * there is no bearing sensor). Slow evaporation builds a wide standing
 * plume; measured detect radius 24 voxels at the queen's emission
 * (~6x mean food distance, clearing the homing inequality).
 */
export const NEST_PHYSICS = {
  diffusionRate: 0.5,
  /** A deep source must remain legible through roughly 100 air steps from
   * queen chamber to forage-radius edge. The resulting long-lived carrier
   * also matches mature nest fabric; abandonment is handled by absorption
   * loss rather than an entrance beacon disappearing immediately. */
  evaporation: 0.99999,
  /** Weak long-range gradients must continue transporting rather than pinning. */
  transferEpsilon: 0,
  /** Below the minimum navigable concentration across the authored
   * queen-to-surface path (Appendix F ledger runs 1323-1327). */
  epsilon: 1e-8,
} as const;

/** Airborne colony identity released locally by marked solid material. */
export const COLONY_ODOR_PHYSICS = {
  diffusionRate: 0.5,
  /** Material re-emission sustains occupied nest air; faster airborne loss
   * prevents the identity carrier accumulating into a surface-wide cloud. */
  evaporation: 0.98,
  transferEpsilon: 1e-5,
  epsilon: 1e-5,
} as const;

/** Initial standing odor in the pre-built Appendix E nest. The value is
 * evaluated over connected air-path distance, then handed to ordinary scent
 * diffusion; it is a carrier, not a bearing sensor or controller input. */
export const NEST_FIXTURE_SCENT = {
  /** Near-source initial guess for the steady-state solver. */
  sourceStrength: 3.2,
  /** Initial solver profile; runtime physics refines this to steady state. */
  distanceScale: 10,
  /** Surface neighborhood carrying mature odor at authored-world startup. */
  surfaceRadius: 24,
} as const;

/** Colony odor held by nest fabric and other solid material. Rates are per
 * scent pass, not per simulation tick. */
export const COLONY_ODOR = {
  saturation: 1,
  fixtureSaturation: 0.75,
  contactTransfer: 0.75,
  /** Establish the fixture's material/air equilibrium before ants act
   * (Appendix F startup and 2,500-tick ledger runs 1709-1718). */
  fixtureWarmupPasses: 125,
  absorptionRate: 0.002,
  absorptionFloor: 0.002,
  reemissionRate: 0.01,
  retention: 0.999,
  epsilon: 1e-5,
  /** Diagnostic/readable-policy boundary in normalized sensor space. */
  insideThreshold: 0.159,
} as const;

/**
 * Shared actuation noise. The sample is a pure hash of world seed, ant id,
 * and tick, so it breaks lockstep without adding hidden or checkpoint state.
 */
export const MOTOR_JITTER = {
  /** Maximum signed perturbation added to the normalized TURN output. */
  turnAmplitude: 0.08,
} as const;

// Energy economy (M4, design spec §6). Sensors normalize stored energy against
// the tank; ledger values remain absolute. Mutable (no `as const`) solely for
// calibration harnesses' scoped, restoring overrides; production code never
// writes it. Defaults are the broad-controller interior measured in colony-
// economy runs 922, 924, and 930.
export const ENERGY = {
  /** Basal metabolic drain per tick at bodyScale 1 (superlinear in scale). */
  basalPerTick: 0.0000015,
  basalScaleExponent: 1.5,
  /** Cost per lattice step. */
  stepCost: 0.00000375,
  /** Extra per-step cost while carrying spoil (per load). */
  carryStepCost: 0.00000375,
  /** Sensor upkeep per tick. */
  sensorUpkeep: 0.00000125,
  /** World price applied to every controller-reported thinking cost. */
  thinkCostScale: 0.0125,
  /** Cost per unit of pheromone deposited. */
  depositCostPerUnit: 0.0000625,
  /** Energy granted by eating one FOOD voxel (corpses are FOOD voxels too).
   * Meal/tank ratio R2 remains 0.3; broad viability comes from cheaper work. */
  foodEnergy: 2.4,
  /** Maximum stored energy. */
  max: 8,
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
    foodPickup: 0.0000125,
  },
  /** Cost to place a carried load, also charged for a failed terrain intent. */
  depositCost: 0.0000125,
} as const;

// Appendix D descriptive nest classifier. These thresholds name observed
// morphology; no evolving controller receives them and no function ledger is
// allowed to target them.
export const NEST_CLASSIFIER = {
  /** Edge length of the all-air block required to describe a void as a chamber. */
  chamberBlockSize: 2,
  /** Maximum corridor voxels adjacent to a chamber void. */
  maxDoorwayVoxels: 2,
};

// Food spawn governor: density-dependent target around a seasonal base.
// Mutable for calibration harness overrides only, like ENERGY above.
export const FOOD_GOVERNOR = {
  /** Ticks between governor passes. */
  interval: 50,
  /** Baseline FOOD voxels at season midpoint — dense enough that the scent
   * horizon R3 exceeds 1 (§B.3): mean nearest-food distance under the
   * beacon's measured detection radius. */
  targetCount: 1600,
  /** Maximum voxels spawned per pass (kept low enough that patch turnover
   * clears the trail half-life, R5b). */
  maxSpawnPerPass: 40,
};

// Oscillating carrying capacity (design spec §9.3): K breathes forever.
export const SEASON = {
  /** Ticks per full sinusoid cycle. */
  periodTicks: 40_000,
  /** Peak-to-midpoint amplitude as a fraction of the base. Deep troughs
   * (~5x food collapse) make the harsh season a genuine famine
   * bottleneck: stores and shelter decide who comes out of it, which is
   * what prices underground living (§B.8). */
  amplitude: 0.8,
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
  /** Stockpile level at which the queen stops receiving — a small crop,
   * not a granary. Large hoards must be physical FOOD caches, whose
   * placement (surface vs excavated gallery) the rain liability prices
   * (§B.7.3 storage insurance). */
  stockpileSatiation: 8,
  /** Workers below this are fed from the stockpile when near the queen. */
  feedThreshold: 0.3,
  /** Maximum energy fed to a hungry worker per tick. */
  feedRate: 0.02,
  /** Stockpile floor the queen keeps for herself while feeding workers. */
  queenReserve: 1,
  /** Attendants refill a crop below this from the physical larder. */
  restockBelow: 2,
  /** Horizontal reach of larder restocking around the queen (any depth
   * down to the workings; scripted logistics like trophallaxis). */
  restockRadius: 6,
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

// Automatic continue (R3): the world is never left dead — below the
// population floor (or with no colony at all), a new colony is force-
// founded from the survivor genome pool.
export const CONTINUITY = {
  /** Total living ants below which a continuation triggers. */
  minPopulation: 4,
  /** Minimum ticks between continuations (no thrash while one recovers). */
  cooldownTicks: 3000,
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

// Microclimate (Appendix B Rule 5): the surface is metabolically hostile;
// depth shelters. Charges colonies for the absence of a nest. Mutable for
// harness ablations only (calibration.ts withPatched), like ENERGY.
export const MICROCLIMATE = {
  /** Peak seasonal surface-stress factor − 1 (harsh-season trough). The
   * seasonal and diurnal factors compose multiplicatively so peak surface
   * exposure is survival-scale, not marginal-cost-scale — otherwise trip
   * profitability (R1 ≫ 1) makes foraging through stress always win and
   * shelter can never dominate on the idle ledger (Rule 6). Surface life
   * stays survivable-but-inferior (never lethal, §B.8.2): extremes price
   * idling on the surface — lush midday ~3.5x, harsh midday ~10.5x — and
   * depth is stable. */
  seasonalStress: 2,
  /** Peak diurnal surface-stress factor − 1 (midday). */
  diurnalStress: 2.5,
  /** Ticks per day-night cycle. */
  dayTicks: 2000,
  /** Depth in voxels at which surface stress halves. */
  halfDepth: 3,
};

// Rain (Appendix B Rule 5): storms punish surface food caches and surface
// trail networks; sheltered stores and tunnels ride them out.
export const RAIN = {
  /** Ticks between storm-scheduling draws (own rng stream). */
  checkInterval: 500,
  /** Storm chance per check at the wet-season (food-peak) phase. */
  chanceAtPeak: 0.25,
  /** Storm length in ticks. */
  durationTicks: 300,
  /** Chance each exposed surface FOOD voxel is destroyed per wash pass. */
  foodDestroyFraction: 0.15,
  /** Ticks between wash passes while raining. */
  washInterval: 25,
  /** Fraction of above-surface pheromone surviving each wash pass. */
  pheromoneRetention: 0.2,
  /** Egg exposure hazard multiplier while raining. */
  eggExposureMultiplier: 5,
};

// Larval rearing (ADR-0011 brood-as-capital, R3-PLAN M4.75): hatchlings
// are not free — a larva is immobile brood that consumes stockpile
// feedings over a rearing period before becoming a worker. Replacement
// cost (endowment + lay cost + rearing energy + rearing time) is the
// capital that makes brood protection and famine stores bind on the
// master ledger.
export const LARVA = {
  /** Stockpile energy a larva must absorb before pupating into an adult. */
  rearingCost: 0.6,
  /** Maximum stockpile draw per larva per tick while being fed. */
  feedPerTick: 0.0005,
  /** Unfed ticks a larva survives before perishing into FOOD. */
  starvationGraceTicks: 600,
} as const;

// Egg exposure (design spec §7.3, Appendix B §B.7.3): brood dies where
// the microclimate is unstable — the same stress field that prices adult
// idling prices incubation, so brood placement depth is a real
// reproductive asset (surface: lethal middays; chamber: lethal only at
// harsh peaks; deep vault: stable year-round).
export const EGG_EXPOSURE = {
  /** Death chance per tick per unit of local stress multiplier above the
   * safe threshold. */
  deathChancePerTick: 0.002,
  /** Local multiplier at or below which incubation is safe. The founding
   * chamber (~2.5 at spring middays) sits exactly at the edge: safe in
   * lush, hazarded at harsh peaks — deeper vaults buy the difference. */
  safeMultiplier: 2.5,
} as const;

// Haploid males (design spec §7.1 channel 2).
export const MALE = {
  /** Male lifespan as a fraction of the genetic lifespan cap. */
  lifespanFraction: 0.25,
  /** Energy margin a worker must keep after laying a male egg. */
  layReserve: 0.2,
} as const;
