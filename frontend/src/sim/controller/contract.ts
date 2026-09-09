import { type RandomState } from "../random";

export enum Input {
  OPEN_FORWARD = 0,
  OPEN_LEFT = 1,
  OPEN_RIGHT = 2,
  FOOD_CENTER = 3,
  FOOD_FORWARD = 4,
  FOOD_LEFT = 5,
  FOOD_RIGHT = 6,
  NEST_CENTER = 7,
  NEST_FORWARD = 8,
  NEST_LEFT = 9,
  NEST_RIGHT = 10,
  PHEROMONE_A_CENTER = 11,
  PHEROMONE_A_FORWARD = 12,
  PHEROMONE_A_LEFT = 13,
  PHEROMONE_A_RIGHT = 14,
  PHEROMONE_B_CENTER = 15,
  PHEROMONE_B_FORWARD = 16,
  PHEROMONE_B_LEFT = 17,
  PHEROMONE_B_RIGHT = 18,
  CONTACT_FOOD = 19,
  CARRYING = 20,
  SKY_LIGHT = 21,
  JITTER = 22,
  HANDEDNESS = 23,
  FOOD_WIDE_LEFT = 24,
  FOOD_WIDE_RIGHT = 25,
  NEST_WIDE_LEFT = 26,
  NEST_WIDE_RIGHT = 27,
  PHEROMONE_A_WIDE_LEFT = 28,
  PHEROMONE_A_WIDE_RIGHT = 29,
  PHEROMONE_B_WIDE_LEFT = 30,
  PHEROMONE_B_WIDE_RIGHT = 31,
  CONTACT_CACHE = 32,
}

export const INPUT_COUNT = 33;

export const INPUT_NAMES: readonly string[] = [
  "open forward",
  "open left",
  "open right",
  "food odor center",
  "food contrast forward",
  "food contrast left",
  "food contrast right",
  "nest odor center",
  "nest contrast forward",
  "nest contrast left",
  "nest contrast right",
  "pheromone A center",
  "pheromone A contrast forward",
  "pheromone A contrast left",
  "pheromone A contrast right",
  "pheromone B center",
  "pheromone B contrast forward",
  "pheromone B contrast left",
  "pheromone B contrast right",
  "contact food",
  "carrying",
  "sky light",
  "motor jitter",
  "handedness",
  "food contrast wide left",
  "food contrast wide right",
  "nest contrast wide left",
  "nest contrast wide right",
  "pheromone A contrast wide left",
  "pheromone A contrast wide right",
  "pheromone B contrast wide left",
  "pheromone B contrast wide right",
  "contact cache",
] as const;

export interface Action {
  /** Private persistent byte write; null retains the current value. */
  readonly task: number | null;
  readonly turn: -1 | 0 | 1;
  readonly move: boolean;
  readonly mandible: boolean;
  readonly pheromoneA: number;
  readonly pheromoneB: number;
  readonly eat: boolean;
  readonly feed: boolean;
  readonly release: boolean;
}

export const IDLE_ACTION: Action = Object.freeze({
  task: null,
  turn: 0,
  move: false,
  mandible: false,
  pheromoneA: 0,
  pheromoneB: 0,
  eat: false,
  feed: false,
  release: false,
});

export interface SensorPolicy {
  readonly id: string;
  act(inputs: Float32Array): Action;
}

export interface Controller<Genome, State> {
  readonly id: string;
  seed(random: RandomState): Genome;
  fixedSeed(): Genome;
  createState(): State;
  act(genome: Genome, inputs: Float32Array, state: State): Action;
  mutate(genome: Genome, random: RandomState): Genome;
  recombine(left: Genome, right: Genome, random: RandomState): Genome;
  genomeDistance(left: Genome, right: Genome): number;
  inspectState(state: State): ArrayLike<number>;
}
