import * as rnn from "./rnn";
import * as codec from "./codec";
import { type Controller } from "./contract";

/** Static composition point; callers use behavior and codecs, not network layout. */
export const controller: Controller<rnn.Genome, rnn.BrainState> = {
  id: codec.CONTROLLER_ID,
  seed: rnn.seed,
  createState: rnn.createState,
  act: rnn.act,
  mutate: rnn.mutate,
  recombine: rnn.recombine,
  express: rnn.express,
  assimilate: rnn.assimilate,
  plasticityStrength: (genome) => Math.abs(genome.plasticity[0]),
  learnedMagnitude: (genome, state) =>
    Math.abs(genome.plasticity[0]) *
    Math.sqrt(state.traces.reduce((sum, v) => sum + v * v, 0) / state.traces.length),
  genomeDistance: rnn.genomeDistance,
  encodeGenome: codec.encodeGenome,
  decodeGenome: codec.decodeGenome,
  encodeState: codec.encodeState,
  decodeState: codec.decodeState,
  inspectState: (state) => Array.from(state.hidden),
};
export type Genome = ReturnType<typeof controller.seed>;
export type BrainState = ReturnType<typeof controller.createState>;
