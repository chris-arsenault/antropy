import { type RandomState } from "../random";
import { type Action } from "../interface";

export interface Controller<Genome, State extends { task: number }> {
  readonly id: string;
  seed(): Genome;
  createState(): State;
  act(genome: Genome, observation: Float32Array, state: State): Action;
  mutate(genome: Genome, rng: RandomState, rate: number, scale: number): Genome;
  recombine(a: Genome, b: Genome, rng: RandomState): Genome;
  genomeDistance(a: Genome, b: Genome): number;
  encodeGenome(genome: Genome): unknown;
  decodeGenome(data: unknown): Genome;
  encodeState(state: State): unknown;
  decodeState(data: unknown): State;
  inspectState(state: State): readonly number[];
}
