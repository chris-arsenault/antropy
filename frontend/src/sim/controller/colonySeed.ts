import { Input, INPUT_COUNT, Output, OUTPUT_COUNT } from "./contract";
import { HIDDEN_COUNT } from "./rnnShape";

const W_IN = 0;
const W_REC = W_IN + HIDDEN_COUNT * INPUT_COUNT;
const B_H = W_REC + HIDDEN_COUNT * HIDDEN_COUNT;
const W_OUT = B_H + HIDDEN_COUNT;
const B_OUT = W_OUT + OUTPUT_COUNT * HIDDEN_COUNT;

const H_FOOD_LEFT = 0;
const H_FOOD_RIGHT = 1;
const H_NEST_LEFT = 2;
const H_NEST_RIGHT = 3;
const H_SLOPE = 4;
const H_PICKUP = 5;
const H_EAT = 6;
const H_CONTACT = 7;
const H_CARRY = 8;
const H_DEPOSIT = 9;
const H_EXIT_LEFT = 10;
const H_EXIT_RIGHT = 11;
const WEIGHT_COUNT = B_OUT + OUTPUT_COUNT;

function input(vector: Float32Array, hidden: number, channel: number, value: number): void {
  vector[W_IN + hidden * INPUT_COUNT + channel] = value;
}

function output(vector: Float32Array, channel: number, hidden: number, value: number): void {
  vector[W_OUT + channel * HIDDEN_COUNT + hidden] = value;
}

function compensate(
  vector: Float32Array,
  channel: number,
  hiddenBias: number,
  outputWeight: number
): void {
  vector[B_OUT + channel] -= Math.tanh(hiddenBias) * outputWeight;
}

function addTaxis(vector: Float32Array): void {
  input(vector, H_FOOD_LEFT, Input.FOOD_SCENT_LEFT, 3);
  input(vector, H_FOOD_LEFT, Input.CARRY_LOAD, -12);
  input(vector, H_FOOD_RIGHT, Input.FOOD_SCENT_RIGHT, 3);
  input(vector, H_FOOD_RIGHT, Input.CARRY_LOAD, -12);
  output(vector, Output.TURN, H_FOOD_LEFT, 2);
  output(vector, Output.TURN, H_FOOD_RIGHT, -2);

  input(vector, H_NEST_LEFT, Input.NEST_SCENT_LEFT, 3);
  input(vector, H_NEST_LEFT, Input.CARRIED_MATERIAL, 8);
  input(vector, H_NEST_LEFT, Input.BIAS, -6);
  input(vector, H_NEST_RIGHT, Input.NEST_SCENT_RIGHT, 3);
  input(vector, H_NEST_RIGHT, Input.CARRIED_MATERIAL, 8);
  input(vector, H_NEST_RIGHT, Input.BIAS, -6);
  output(vector, Output.TURN, H_NEST_LEFT, 1.4);
  output(vector, Output.TURN, H_NEST_RIGHT, -1.4);

  input(vector, H_EXIT_LEFT, Input.NEST_SCENT_LEFT, 3);
  input(vector, H_EXIT_LEFT, Input.CARRIED_MATERIAL, -12);
  input(vector, H_EXIT_RIGHT, Input.NEST_SCENT_RIGHT, 3);
  input(vector, H_EXIT_RIGHT, Input.CARRIED_MATERIAL, -12);
  output(vector, Output.TURN, H_EXIT_LEFT, -1.6);
  output(vector, Output.TURN, H_EXIT_RIGHT, 1.6);
}

function addVerticalAttention(vector: Float32Array): void {
  input(vector, H_SLOPE, Input.FACING_SLOPE, 3);
  output(vector, Output.VERTICAL_BIAS, H_SLOPE, 1.5);

  input(vector, H_CARRY, Input.CARRIED_MATERIAL, 4);
  output(vector, Output.VERTICAL_BIAS, H_CARRY, -1);
}

function addContactHandling(vector: Float32Array): void {
  const pickupBias = -10;
  input(vector, H_PICKUP, Input.CONTACT_FOOD, 6);
  input(vector, H_PICKUP, Input.ENERGY, 6);
  input(vector, H_PICKUP, Input.CARRY_LOAD, -12);
  input(vector, H_PICKUP, Input.BIAS, pickupBias);
  output(vector, Output.DIG, H_PICKUP, 2);
  compensate(vector, Output.DIG, pickupBias, 2);

  const eatBias = -3;
  input(vector, H_EAT, Input.CONTACT_FOOD, 6);
  input(vector, H_EAT, Input.ENERGY, -6);
  input(vector, H_EAT, Input.CARRY_LOAD, -12);
  input(vector, H_EAT, Input.BIAS, eatBias);
  output(vector, Output.EAT, H_EAT, 2);
  compensate(vector, Output.EAT, eatBias, 2);

  const contactBias = -2;
  input(vector, H_CONTACT, Input.CONTACT_FOOD, 4);
  input(vector, H_CONTACT, Input.CARRY_LOAD, -8);
  input(vector, H_CONTACT, Input.BIAS, contactBias);
  output(vector, Output.FORWARD, H_CONTACT, -2);
  compensate(vector, Output.FORWARD, contactBias, -2);
}

function addDeposit(vector: Float32Array): void {
  const depositBias = -10;
  input(vector, H_DEPOSIT, Input.CARRIED_MATERIAL, 8);
  input(vector, H_DEPOSIT, Input.NEST_SCENT_LEFT, 4);
  input(vector, H_DEPOSIT, Input.NEST_SCENT_RIGHT, 4);
  input(vector, H_DEPOSIT, Input.LOCAL_SOLIDITY, 4);
  input(vector, H_DEPOSIT, Input.BIAS, depositBias);
  output(vector, Output.DIG, H_DEPOSIT, 2);
  compensate(vector, Output.DIG, depositBias, 2);
}

/**
 * Appendix E constructive starting point. Ten memoryless relays express the
 * isolated reflexes; derivation owns their integration and may use recurrence.
 */
export function buildColonySeed(genomeLength: number): Float32Array {
  const vector = new Float32Array(genomeLength);
  vector[B_OUT + Output.TURN] = 0.12;
  vector[B_OUT + Output.FORWARD] = 0.85;
  addTaxis(vector);
  addVerticalAttention(vector);
  addContactHandling(vector);
  addDeposit(vector);
  return vector;
}

/**
 * Symmetry groups for Seed E integration derivation. Multiplying a group by
 * one positive factor preserves the hand-written topology, signs, and stereo
 * symmetry; unpaired nonzero loci remain independent groups.
 */
export function colonySeedLocusGroups(): number[][] {
  const paired = [
    [
      W_IN + H_FOOD_LEFT * INPUT_COUNT + Input.FOOD_SCENT_LEFT,
      W_IN + H_FOOD_RIGHT * INPUT_COUNT + Input.FOOD_SCENT_RIGHT,
    ],
    [
      W_IN + H_FOOD_LEFT * INPUT_COUNT + Input.CARRY_LOAD,
      W_IN + H_FOOD_RIGHT * INPUT_COUNT + Input.CARRY_LOAD,
    ],
    [
      W_OUT + Output.TURN * HIDDEN_COUNT + H_FOOD_LEFT,
      W_OUT + Output.TURN * HIDDEN_COUNT + H_FOOD_RIGHT,
    ],
    [
      W_IN + H_NEST_LEFT * INPUT_COUNT + Input.NEST_SCENT_LEFT,
      W_IN + H_NEST_RIGHT * INPUT_COUNT + Input.NEST_SCENT_RIGHT,
    ],
    [
      W_IN + H_NEST_LEFT * INPUT_COUNT + Input.CARRIED_MATERIAL,
      W_IN + H_NEST_RIGHT * INPUT_COUNT + Input.CARRIED_MATERIAL,
    ],
    [W_IN + H_NEST_LEFT * INPUT_COUNT + Input.BIAS, W_IN + H_NEST_RIGHT * INPUT_COUNT + Input.BIAS],
    [
      W_OUT + Output.TURN * HIDDEN_COUNT + H_NEST_LEFT,
      W_OUT + Output.TURN * HIDDEN_COUNT + H_NEST_RIGHT,
    ],
    [
      W_IN + H_EXIT_LEFT * INPUT_COUNT + Input.NEST_SCENT_LEFT,
      W_IN + H_EXIT_RIGHT * INPUT_COUNT + Input.NEST_SCENT_RIGHT,
    ],
    [
      W_IN + H_EXIT_LEFT * INPUT_COUNT + Input.CARRIED_MATERIAL,
      W_IN + H_EXIT_RIGHT * INPUT_COUNT + Input.CARRIED_MATERIAL,
    ],
    [
      W_OUT + Output.TURN * HIDDEN_COUNT + H_EXIT_LEFT,
      W_OUT + Output.TURN * HIDDEN_COUNT + H_EXIT_RIGHT,
    ],
  ];
  const grouped = new Set(paired.flat());
  const vector = buildColonySeed(WEIGHT_COUNT);
  const singles: number[][] = [];
  for (let locus = 0; locus < WEIGHT_COUNT; locus++) {
    if (vector[locus] !== 0 && !grouped.has(locus)) singles.push([locus]);
  }
  return [...paired, ...singles];
}
