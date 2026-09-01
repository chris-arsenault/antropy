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
  DEPTH: 11,
  FACING_SLOPE: 12,
  LOCAL_SOLIDITY: 13,
  CROWDING: 14,
  CONTACT_FOOD: 15,
  CONTACT_EGG: 16,
  CONTACT_ANT: 17,
  FALLING: 18,
  BIAS: 19,
} as const;

export const INPUT_COUNT = 20;

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
