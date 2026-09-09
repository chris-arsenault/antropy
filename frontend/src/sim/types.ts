import { type Config } from "./config";
import { type RandomState } from "./random";
import { type BrainState } from "./controller";
import { type Genotype } from "./genetics/genotype";
import { type Action } from "./interface";
import { type Body } from "./body";

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
  body: Body;
  reserve: number;
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
  genome: Genotype;
  learned: number;
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
  initialMaterial: number;
  supplied: number;
  nutrientLoss: number;
  metabolism: number;
  learning: number;
  motors: number;
  secretion: number;
  construction: number;
  constructedMaterial: number;
  catabolismLoss: number;
  metabolicWaste: number;
  division: number;
  deathLoss: number;
  deathMaterial: number;
  emitted: number;
  chemicalLoss: number;
  births: number;
  deaths: number;
  divisions: number;
  mutations: number;
  recombinations: number;
  learnedBirths: number;
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
  version: 4;
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
