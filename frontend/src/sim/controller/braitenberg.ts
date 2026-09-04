import { ENERGY } from "../tunables";
import {
  Input,
  Output,
  OUTPUT_COUNT,
  type ActResult,
  type Controller,
  type ControllerState,
  type Genome,
  type PhysicalTraits,
} from "./contract";

const THINK_COST = 0.00005;
const TURN_GAIN = 6;
const WANDER_AMPLITUDE = 0.4;
const WANDER_STEP = 0.035;
const BLOCKED_TURN = 0.6;

const BRAITENBERG_GENOME = Object.freeze({}) as unknown as Genome;

// Reused act() buffers per the contract's transient-result rule.
const OUTPUT_SCRATCH = new Float32Array(OUTPUT_COUNT);
const ACT_RESULT: ActResult = { outputs: OUTPUT_SCRATCH, thinkCost: THINK_COST };

interface WanderState {
  phase: number;
}

/**
 * The reference controller (design spec §2.2): stereo chemotaxis toward food
 * scent plus a deterministic wander oscillator so ants explore when nothing
 * is in scent range, always eating on contact. No genome content; not an
 * evolutionary controller — mutate/recombine return the genome unchanged.
 * Used to calibrate the ecology (M4) and as a behavioral baseline in tests.
 */
export const braitenbergController: Controller = {
  id: "braitenberg",

  act(_genome, inputs, state): ActResult {
    const wander = state as unknown as WanderState;
    wander.phase += WANDER_STEP;

    const outputs = OUTPUT_SCRATCH;
    outputs.fill(0);
    const left = inputs[Input.FOOD_SCENT_LEFT];
    const right = inputs[Input.FOOD_SCENT_RIGHT];
    const scentTurn = (left - right) * TURN_GAIN;
    const wanderTurn = WANDER_AMPLITUDE * Math.sin(wander.phase);
    const blockedTurn = inputs[Input.FACING_SLOPE] > 0 ? BLOCKED_TURN : 0;

    outputs[Output.TURN] = Math.max(-1, Math.min(1, scentTurn + wanderTurn + blockedTurn));
    outputs[Output.FORWARD] = 0.7;
    outputs[Output.VERTICAL_BIAS] = 0;
    outputs[Output.EAT] = 1;
    ACT_RESULT.outputs = outputs;
    return ACT_RESULT;
  },

  mutate(genome) {
    return genome;
  },

  recombine() {
    return null;
  },

  seed() {
    return BRAITENBERG_GENOME;
  },

  fixedSeed() {
    return BRAITENBERG_GENOME;
  },

  haploidOffspring() {
    return BRAITENBERG_GENOME;
  },

  createState(): ControllerState {
    return { phase: 0 } as unknown as ControllerState;
  },

  inspectState(state) {
    return [(state as unknown as WanderState).phase];
  },

  serializeGenome() {
    return new Float32Array(0);
  },

  deserializeGenome() {
    return BRAITENBERG_GENOME;
  },

  serializeState(state) {
    return Float32Array.of((state as unknown as WanderState).phase);
  },

  deserializeState(data) {
    return { phase: data[0] ?? 0 } as unknown as ControllerState;
  },

  physical(): PhysicalTraits {
    return {
      bodyScale: 1,
      legLength: 1,
      sensorGain: 1,
      storage: 1,
      eggEndowment: 0.3,
      lifespanTicks: ENERGY.ageCap,
      mutationSigma: 0,
    };
  },
};
