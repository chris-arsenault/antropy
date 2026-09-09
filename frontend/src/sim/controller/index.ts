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
  genomeDistance: rnn.genomeDistance,
  encodeGenome: codec.encodeGenome,
  decodeGenome: codec.decodeGenome,
  encodeState: codec.encodeState,
  decodeState: codec.decodeState,
  inspectState: (state) => Array.from(state.hidden),
};
export type Genome = ReturnType<typeof controller.seed>;
export type BrainState = ReturnType<typeof controller.createState>;
