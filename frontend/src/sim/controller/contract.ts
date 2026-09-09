import { type RandomState } from "../random";
import { type Action } from "../interface";
import { type LearningContext } from "./plasticity";
import { type Mutation, type Crossover } from "../genetics/operators";

export interface Controller<Genome, State extends { task: number }> {
  readonly id: string;
  seed(): Genome;
  createState(): State;
  act(genome: Genome, observation: Float32Array, state: State, context?: LearningContext): Action;
  mutate(genome: Genome, rng: RandomState, rate: number, scale: number, kind?: Mutation): Genome;
  recombine(a: Genome, b: Genome, rng: RandomState, kind?: Crossover): Genome;
  express(a: Genome, b: Genome): Genome;
  plasticityStrength(genome: Genome): number;
  learnedMagnitude(genome: Genome, state: State): number;
  assimilate(allele: Genome, expressed: Genome, state: State, retention: number): Genome;
  genomeDistance(a: Genome, b: Genome): number;
  encodeGenome(genome: Genome): unknown;
  decodeGenome(data: unknown): Genome;
  encodeState(state: State): unknown;
  decodeState(data: unknown): State;
  inspectState(state: State): readonly number[];
}
