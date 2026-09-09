import { type SimConfig } from "./config";
import { type Action } from "./controller/contract";
import { type Point } from "./geometry";
import { type Grid } from "./grid";
import { type RandomState } from "./random";
import { type ChemicalField } from "./scent";
import { type RegisteredModel } from "./controller/registeredModel";
import { type ColonyKnowledge, type DecisionState } from "./colony/contract";
import { type LinearGenome } from "./controller/linear/genome";
import { type ConstructionState } from "./construction/state";
import { type Material } from "./materials";
import { type ClimateState } from "./climate/state";
import { type HabitatState } from "./construction/habitat";
import { type BehaviorState } from "./colony/behavior";

export type ScenarioId =
  | "oracle"
  | "programmed"
  | "programmed-lifecycle"
  | "rnn"
  | "registered-colony"
  | "colony-programmed"
  | "colony-lgp";
export type ChamberRole = "brood" | "pupae" | "food" | "queen";

export interface Chamber {
  readonly id: string;
  readonly role: ChamberRole;
  readonly center: Point;
  readonly radius: Point;
}

export interface Junction {
  readonly id: string;
  readonly point: Point;
}

export interface Passage {
  readonly from: string;
  readonly to: string;
  readonly points: readonly Point[];
}

export interface Nest {
  readonly entrance: Point;
  readonly home: Point;
  readonly start: Point;
  readonly chambers: readonly Chamber[];
  readonly junctions: readonly Junction[];
  readonly passages: readonly Passage[];
  readonly primaryRoute: readonly Point[];
}

export interface Ant {
  readonly caste: "worker" | "queen";
  brood: number | null;
  job: number | null;
  spoil: Material | null;
  decision: DecisionState;
  readonly id: number;
  x: number;
  y: number;
  heading: number;
  /** Transported food quantity; energy is quantity times the world's food density. */
  cargo: number;
  energy: number;
  distanceMoved: number;
  turns: number;
  previousTurn: -1 | 0 | 1;
  immediateTurnReversals: number;
  lastInputs: Float32Array;
  lastAction: Action;
  controllerState: Float32Array;
  task: number;
  taskAge: number;
  taskChanges: number;
  age: number;
  readonly birthTick: number;
  pickupTick: number | null;
}

export interface Cache extends Point {
  y: number;
  readonly capacity: number;
}

export interface Brood extends Point {
  x: number;
  y: number;
  readonly id: number;
  stage: "egg" | "larva" | "pupa";
  age: number;
  energy: number;
  investment: number;
}

export interface Queen extends Ant {
  readonly caste: "queen";
  carrier: number | null;
  layingAge: number;
  alive: boolean;
}

export interface Economy {
  initial: number;
  grown: number;
  dissipated: number;
  metabolism: number;
  work: number;
  queenFed: number;
  broodFed: number;
  eaten: number;
  ageDeaths: number;
  starvationDeaths: number;
  broodDeaths: number;
  queenDeath: "age" | "starvation" | null;
  movement: number;
  workerTicks: number;
  completedReturns: number;
  returnTicks: number;
  harvested: number;
}

export interface WorldMetrics {
  foodPickedUp: number;
  foodDeposited: number;
  pheromoneDeposited: number;
  failedMoves: number;
  energySpent: number;
  pickupTicks: number[];
  depositTicks: number[];
  deaths: number;
  workerEggs: number;
  workerHatches: number;
}

export interface World {
  behavior: BehaviorState;
  habitat: HabitatState;
  climate: ClimateState;
  construction: ConstructionState;
  caches: Map<number, Cache>;
  knowledge: ColonyKnowledge;
  linearGenome: LinearGenome | null;
  readonly dimension: "2d";
  readonly checkpointVersion: 19;
  taskOverrides: number;
  registeredController: RegisteredModel | null;
  readonly seed: number;
  tick: number;
  readonly scenario: ScenarioId;
  readonly config: SimConfig;
  readonly random: RandomState;
  readonly grid: Grid;
  /** Derived first-worker accessor for historical diagnostics; throws after extinction. */
  readonly ant: Ant;
  /** Worker bodies. Reproductives share Ant machinery and retain separate population accounting. */
  readonly ants: Ant[];
  readonly brood: Brood[];
  readonly queen: Queen;
  nextAntId: number;
  nextBroodId: number;
  readonly economy: Economy;
  /** Cell to food quantity, independent of nutritional density. */
  readonly food: Map<number, number>;
  readonly renewableSources: number[];
  readonly cache: Cache;
  readonly nest: Nest;
  readonly foodSources: Set<number>;
  readonly foodOdor: ChemicalField;
  readonly nestOdor: ChemicalField;
  readonly pheromoneA: ChemicalField;
  readonly pheromoneB: ChemicalField;
  readonly freshAir: ChemicalField;
  readonly metrics: WorldMetrics;
}
