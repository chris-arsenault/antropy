import {
  Input,
  Output,
  OUTPUT_COUNT,
  type ActResult,
  type Controller,
  type ControllerState,
  type Genome,
} from "./contract";

const THINK_COST = 0.00005;
const TURN_GAIN = 6;
const WANDER_AMPLITUDE = 0.4;
const WANDER_STEP = 0.035;
const BLOCKED_TURN = 0.6;

const BRAITENBERG_GENOME = Object.freeze({}) as unknown as Genome;

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

    const outputs = new Float32Array(OUTPUT_COUNT);
    const left = inputs[Input.FOOD_SCENT_LEFT];
    const right = inputs[Input.FOOD_SCENT_RIGHT];
    const scentTurn = (left - right) * TURN_GAIN;
    const wanderTurn = WANDER_AMPLITUDE * Math.sin(wander.phase);
    const blockedTurn = inputs[Input.FACING_SLOPE] > 0 ? BLOCKED_TURN : 0;

    outputs[Output.TURN] = Math.max(-1, Math.min(1, scentTurn + wanderTurn + blockedTurn));
    outputs[Output.FORWARD] = 0.7;
    outputs[Output.VERTICAL_BIAS] = 0;
    outputs[Output.EAT] = 1;
    return { outputs, thinkCost: THINK_COST };
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

  createState(): ControllerState {
    return { phase: 0 } as unknown as ControllerState;
  },
};
