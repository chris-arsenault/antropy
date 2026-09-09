import { type Config } from "./config";
import { type RandomState } from "./random";
import { type Genome, type BrainState } from "./controller";
import { type Action } from "./interface";

export interface Point {
  x: number;
  y: number;
}
export interface Cell extends Point {
  id: number;
  parent: number | null;
  lineage: number;
  generation: number;
  genome: number;
  heading: number;
  mass: number;
  energy: number;
  born: number;
  brain: BrainState;
  receptors: [number, number];
  contacts: number[];
  inputs: Float32Array;
  action: Action;
}
export interface Source extends Point {
  remaining: number;
}
export interface GenomeRecord {
  id: number;
  parent: number | null;
  born: number;
  genome: Genome;
}
export interface Ancestor {
  id: number;
  parent: number | null;
  lineage: number;
  genome: number;
  born: number;
  ended: number | null;
  cause: "alive" | "division" | "starvation";
}
export interface Event {
  tick: number;
  kind: "division" | "death" | "task" | "override";
  cell: number;
  values: number[];
}
export interface Ledger {
  initial: number;
  supplied: number;
  nutrientLoss: number;
  metabolism: number;
  motors: number;
  secretion: number;
  growthLoss: number;
  division: number;
  deathLoss: number;
  emitted: number;
  chemicalLoss: number;
  births: number;
  deaths: number;
  divisions: number;
  mutations: number;
  distance: number;
  turning: number;
  taskWrites: number;
  blockedDivisions: number;
}
export interface Intervention {
  tick: number;
  cell: number;
  previous: number;
  value: number;
}
export interface World {
  substrate: "bacteria-xy";
  version: 2;
  seed: number;
  tick: number;
  config: Config;
  rng: RandomState;
  environmentRng: RandomState;
  geneticRng: RandomState;
  cells: Cell[];
  nutrient: Float64Array;
  chemical: Float64Array;
  sources: Source[];
  genomes: Map<number, GenomeRecord>;
  nextCell: number;
  nextGenome: number;
  ancestry: Map<number, Ancestor>;
  ledger: Ledger;
  events: Event[];
  interventions: Intervention[];
  stopReason: string | null;
}
