import { type Rng } from "../rng";

/**
 * The pluggable behavioral controller contract (design spec §2.3). Genomes
 * are opaque outside the controller module: nothing else may inspect them.
 */
export interface Controller {
  readonly id: string;
  act(genome: Genome, inputs: Float32Array, state: ControllerState): ActResult;
  /** Sigma is the normalized physical mutation-rate gene in [0, 1]. */
  mutate(genome: Genome, sigma: number, rng: Rng): Genome;
  /** Haplodiploid combination; null for asexual controllers. */
  recombine(a: Genome, b: Genome, rng: Rng): Genome | null;
  /** A structured-init founder genome (design spec §2.1). */
  seed(rng: Rng): Genome;
  /** Exact founder used when genetic variation is disabled. */
  fixedSeed(): Genome;
  /** RMS-like distance in the controller's expressed genome space. */
  genomeDistance(a: Genome, b: Genome): number;
  /**
   * A haploid offspring genome from an unfertilized mother (design spec
   * §7.1 channel 2 — worker-laid males). Ploidy stays behind the boundary.
   */
  haploidOffspring(genome: Genome, rng: Rng): Genome;
  createState(): ControllerState;
  /**
   * Expressed physical traits (design spec §3.2). Expression (ploidy,
   * dominance, squashing) is the controller's business; consumers see only
   * the trait values.
   */
  physical(genome: Genome): PhysicalTraits;
  /**
   * Read-only view of the recurrent state for the ant inspector (design
   * spec §11.4) — activations, not genome internals.
   */
  inspectState(state: ControllerState): readonly number[];
  /** Checkpoint codec: genomes cross the boundary only as opaque arrays. */
  serializeGenome(genome: Genome): Float32Array;
  deserializeGenome(data: Float32Array): Genome;
  serializeState(state: ControllerState): Float32Array;
  deserializeState(data: Float32Array): ControllerState;
}

/**
 * A diagnostic controller restricted to the shipped sensory interface.
 * The simulation owns one private state value per ant; the policy cannot
 * inspect ant identity, coordinates, or world state.
 */
export interface SensorPolicy {
  createState(): unknown;
  act(inputs: Float32Array, state: unknown): Float32Array;
}

/** Expressed physical trait values consumed by the simulation systems. */
export interface PhysicalTraits {
  /** Target adult body scale; drives metabolism and dig strength. */
  bodyScale: number;
  /** Step-speed factor; also scales per-step energy cost. */
  legLength: number;
  /** Scent acuity multiplier; upkeep scales with its square. */
  sensorGain: number;
  /** Energy storage capacity multiplier. */
  storage: number;
  /** Energy endowed to each egg (M6). */
  eggEndowment: number;
  /** Lifespan cap in ticks. */
  lifespanTicks: number;
  /** Normalized mutation-rate gene in [0, 1]. */
  mutationSigma: number;
}

/** Opaque behavioral genome. Only controller implementations look inside. */
export type Genome = { readonly __brand: "genome" };

/** Opaque recurrent state (the ant's only memory). */
export type ControllerState = { __brand: "controllerState" };

/**
 * Transient result of act(): controllers may reuse the result object and the
 * outputs buffer across calls (no hot-path allocation). Consume or copy
 * before the next act() call; never retain.
 */
export interface ActResult {
  outputs: Float32Array;
  thinkCost: number;
}

/** Sensory input layout (design spec §4), all values normalized. */
export const Input = {
  PHEROMONE_A_LEFT: 0,
  PHEROMONE_A_RIGHT: 1,
  PHEROMONE_B_LEFT: 2,
  PHEROMONE_B_RIGHT: 3,
  FOOD_SCENT_LEFT: 4,
  FOOD_SCENT_RIGHT: 5,
  ENERGY: 6,
  AGE_FRACTION: 7,
  CARRY_LOAD: 8,
  CARRIED_MATERIAL: 9,
  BODY_SCALE: 10,
  /** Terrain-relative depth: zero at/above the local surface, increasing below it. */
  DEPTH: 11,
  FACING_SLOPE: 12,
  LOCAL_SOLIDITY: 13,
  CROWDING: 14,
  CONTACT_FOOD: 15,
  CONTACT_EGG: 16,
  CONTACT_ANT: 17,
  FALLING: 18,
  BIAS: 19,
  NEST_SCENT_LEFT: 20,
  NEST_SCENT_RIGHT: 21,
  /** Local temperature (thermoreception, innate in real ants): the
   * microclimate multiplier normalized to [0, 1]. A world quantity with a
   * physical carrier — a liability must be sensable to be avoidable
   * (Rules 4/5); homing has no sensor (§C.8: the nest-scent plume is the
   * carrier, chemotaxis the seeded use). */
  TEMPERATURE: 22,
  /** Simultaneous vertical chemoreception. The existing stereo pairs sample
   * the level band; these append-only channels sample directly below and
   * above, so vertical choice never requires attention switching or memory. */
  PHEROMONE_A_DOWN: 23,
  PHEROMONE_A_UP: 24,
  PHEROMONE_B_DOWN: 25,
  PHEROMONE_B_UP: 26,
  FOOD_SCENT_DOWN: 27,
  FOOD_SCENT_UP: 28,
  NEST_SCENT_DOWN: 29,
  NEST_SCENT_UP: 30,
  PHEROMONE_A_LEFT_CHANGE: 31,
  PHEROMONE_A_RIGHT_CHANGE: 32,
  PHEROMONE_A_DOWN_CHANGE: 33,
  PHEROMONE_A_UP_CHANGE: 34,
  PHEROMONE_B_LEFT_CHANGE: 35,
  PHEROMONE_B_RIGHT_CHANGE: 36,
  PHEROMONE_B_DOWN_CHANGE: 37,
  PHEROMONE_B_UP_CHANGE: 38,
  FOOD_SCENT_LEFT_CHANGE: 39,
  FOOD_SCENT_RIGHT_CHANGE: 40,
  FOOD_SCENT_DOWN_CHANGE: 41,
  FOOD_SCENT_UP_CHANGE: 42,
  NEST_SCENT_LEFT_CHANGE: 43,
  NEST_SCENT_RIGHT_CHANGE: 44,
  NEST_SCENT_DOWN_CHANGE: 45,
  NEST_SCENT_UP_CHANGE: 46,
  COLONY_SCENT_LEFT: 47,
  COLONY_SCENT_RIGHT: 48,
  COLONY_SCENT_DOWN: 49,
  COLONY_SCENT_UP: 50,
  COLONY_SCENT_LEFT_CHANGE: 51,
  COLONY_SCENT_RIGHT_CHANGE: 52,
  COLONY_SCENT_DOWN_CHANGE: 53,
  COLONY_SCENT_UP_CHANGE: 54,
  PHEROMONE_A_CENTER: 55,
  PHEROMONE_A_CENTER_CHANGE: 56,
  PHEROMONE_B_CENTER: 57,
  PHEROMONE_B_CENTER_CHANGE: 58,
  FOOD_SCENT_CENTER: 59,
  FOOD_SCENT_CENTER_CHANGE: 60,
  NEST_SCENT_CENTER: 61,
  NEST_SCENT_CENTER_CHANGE: 62,
  COLONY_SCENT_CENTER: 63,
  COLONY_SCENT_CENTER_CHANGE: 64,
  /** Stereo samples in the non-level bands. These complete the append-only
   * three-band chemoreception contract: each vertical choice has the same
   * left/right directional evidence as the original level band. */
  PHEROMONE_A_DOWN_LEFT: 65,
  PHEROMONE_A_DOWN_RIGHT: 66,
  PHEROMONE_A_UP_LEFT: 67,
  PHEROMONE_A_UP_RIGHT: 68,
  PHEROMONE_A_DOWN_LEFT_CHANGE: 69,
  PHEROMONE_A_DOWN_RIGHT_CHANGE: 70,
  PHEROMONE_A_UP_LEFT_CHANGE: 71,
  PHEROMONE_A_UP_RIGHT_CHANGE: 72,
  PHEROMONE_B_DOWN_LEFT: 73,
  PHEROMONE_B_DOWN_RIGHT: 74,
  PHEROMONE_B_UP_LEFT: 75,
  PHEROMONE_B_UP_RIGHT: 76,
  PHEROMONE_B_DOWN_LEFT_CHANGE: 77,
  PHEROMONE_B_DOWN_RIGHT_CHANGE: 78,
  PHEROMONE_B_UP_LEFT_CHANGE: 79,
  PHEROMONE_B_UP_RIGHT_CHANGE: 80,
  FOOD_SCENT_DOWN_LEFT: 81,
  FOOD_SCENT_DOWN_RIGHT: 82,
  FOOD_SCENT_UP_LEFT: 83,
  FOOD_SCENT_UP_RIGHT: 84,
  FOOD_SCENT_DOWN_LEFT_CHANGE: 85,
  FOOD_SCENT_DOWN_RIGHT_CHANGE: 86,
  FOOD_SCENT_UP_LEFT_CHANGE: 87,
  FOOD_SCENT_UP_RIGHT_CHANGE: 88,
  NEST_SCENT_DOWN_LEFT: 89,
  NEST_SCENT_DOWN_RIGHT: 90,
  NEST_SCENT_UP_LEFT: 91,
  NEST_SCENT_UP_RIGHT: 92,
  NEST_SCENT_DOWN_LEFT_CHANGE: 93,
  NEST_SCENT_DOWN_RIGHT_CHANGE: 94,
  NEST_SCENT_UP_LEFT_CHANGE: 95,
  NEST_SCENT_UP_RIGHT_CHANGE: 96,
  COLONY_SCENT_DOWN_LEFT: 97,
  COLONY_SCENT_DOWN_RIGHT: 98,
  COLONY_SCENT_UP_LEFT: 99,
  COLONY_SCENT_UP_RIGHT: 100,
  COLONY_SCENT_DOWN_LEFT_CHANGE: 101,
  COLONY_SCENT_DOWN_RIGHT_CHANGE: 102,
  COLONY_SCENT_UP_LEFT_CHANGE: 103,
  COLONY_SCENT_UP_RIGHT_CHANGE: 104,
} as const;

export const INPUT_COUNT = 105;

/**
 * Motor output layout (design spec §4). DIG manipulates terrain: it digs the
 * faced solid voxel when unburdened and deposits spoil as LOOSE_FILL when
 * carrying (design spec §5.4 — one terrain channel, no separate deposit).
 */
export const Output = {
  TURN: 0,
  FORWARD: 1,
  VERTICAL_BIAS: 2,
  EAT: 3,
  DIG: 4,
  PHEROMONE_A: 5,
  PHEROMONE_B: 6,
  LAY_EGG: 7,
} as const;

export const OUTPUT_COUNT = 8;

/** Threshold above which the binary action outputs fire. */
export const ACTION_THRESHOLD = 0.5;
