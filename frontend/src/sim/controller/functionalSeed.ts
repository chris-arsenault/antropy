import { Input, INPUT_COUNT, Output, OUTPUT_COUNT } from "./contract";
import { HIDDEN_COUNT } from "./rnnShape";

const W_IN = 0;
const W_REC = W_IN + HIDDEN_COUNT * INPUT_COUNT;
const B_H = W_REC + HIDDEN_COUNT * HIDDEN_COUNT;
const W_OUT = B_H + HIDDEN_COUNT;
const B_OUT = W_OUT + OUTPUT_COUNT * HIDDEN_COUNT;

const H_HAUL = 2;
const H_EGG_PAYLOAD = 6;
const H_MATERIAL_PAYLOAD = 7;
const H_CARGO_CONTACT = 8;
const H_SAFE_EGG = 9;
const H_HIGH_MATERIAL = 10;
const H_SAFE_CONTACT = 11;

const HAUL_EAT_INHIBITION = -8;
const EGG_PAYLOAD_LOAD_GAIN = 10;
const EGG_PAYLOAD_MATERIAL_INHIBITION = -64;
const EGG_PAYLOAD_BIAS = -7;
const EGG_PAYLOAD_DESCENT = -3.8;
const EGG_PAYLOAD_DIG_INHIBITION = -8;
const MATERIAL_PAYLOAD_GAIN = 16;
const MATERIAL_PAYLOAD_BIAS = -6;
const MATERIAL_PAYLOAD_DESCENT = -6;
const HIGH_MATERIAL_GAIN = 24;
const HIGH_MATERIAL_BIAS = -13.5;
const HIGH_MATERIAL_LIFT = 7;
const CARGO_CONTACT_GAIN = 14;
const CARGO_CONTACT_LOAD_INHIBITION = -28;
const CARGO_CONTACT_BIAS = -7;
const CARGO_CONTACT_STOP = -0.7;
const CARGO_CONTACT_LEVEL = 1;
const CARGO_CONTACT_PICKUP = 2;
const CARGO_CONTACT_EAT_INHIBITION = -12;
const SAFE_EGG_LOAD_GAIN = 10;
const SAFE_EGG_MATERIAL_INHIBITION = -64;
const SAFE_TEMPERATURE_INHIBITION = -20;
const SAFE_RELAY_BIAS = -5;
const SAFE_EGG_DROP = 10;
const SAFE_CONTACT_GAIN = 10;
const SAFE_CONTACT_DIG_INHIBITION = -10;

function compensate(
  vector: Float32Array,
  output: number,
  restingActivation: number,
  outputWeight: number
): void {
  vector[B_OUT + output] -= restingActivation * outputWeight;
}

function addEggPayload(vector: Float32Array): void {
  vector[W_IN + H_EGG_PAYLOAD * INPUT_COUNT + Input.CARRY_LOAD] = EGG_PAYLOAD_LOAD_GAIN;
  vector[W_IN + H_EGG_PAYLOAD * INPUT_COUNT + Input.CARRIED_MATERIAL] =
    EGG_PAYLOAD_MATERIAL_INHIBITION;
  vector[W_IN + H_EGG_PAYLOAD * INPUT_COUNT + Input.BIAS] = EGG_PAYLOAD_BIAS;
  vector[W_OUT + Output.VERTICAL_BIAS * HIDDEN_COUNT + H_EGG_PAYLOAD] = EGG_PAYLOAD_DESCENT;
  vector[W_OUT + Output.DIG * HIDDEN_COUNT + H_EGG_PAYLOAD] = EGG_PAYLOAD_DIG_INHIBITION;
  const resting = Math.tanh(EGG_PAYLOAD_BIAS);
  compensate(vector, Output.VERTICAL_BIAS, resting, EGG_PAYLOAD_DESCENT);
  compensate(vector, Output.DIG, resting, EGG_PAYLOAD_DIG_INHIBITION);
}

function addFoodBand(vector: Float32Array): void {
  vector[W_IN + H_MATERIAL_PAYLOAD * INPUT_COUNT + Input.CARRIED_MATERIAL] = MATERIAL_PAYLOAD_GAIN;
  vector[W_IN + H_MATERIAL_PAYLOAD * INPUT_COUNT + Input.BIAS] = MATERIAL_PAYLOAD_BIAS;
  vector[W_OUT + Output.VERTICAL_BIAS * HIDDEN_COUNT + H_MATERIAL_PAYLOAD] =
    MATERIAL_PAYLOAD_DESCENT;
  compensate(
    vector,
    Output.VERTICAL_BIAS,
    Math.tanh(MATERIAL_PAYLOAD_BIAS),
    MATERIAL_PAYLOAD_DESCENT
  );

  vector[W_IN + H_HIGH_MATERIAL * INPUT_COUNT + Input.CARRIED_MATERIAL] = HIGH_MATERIAL_GAIN;
  vector[W_IN + H_HIGH_MATERIAL * INPUT_COUNT + Input.BIAS] = HIGH_MATERIAL_BIAS;
  vector[W_OUT + Output.VERTICAL_BIAS * HIDDEN_COUNT + H_HIGH_MATERIAL] = HIGH_MATERIAL_LIFT;
  compensate(vector, Output.VERTICAL_BIAS, Math.tanh(HIGH_MATERIAL_BIAS), HIGH_MATERIAL_LIFT);
}

function addCargoContact(vector: Float32Array): void {
  vector[W_IN + H_CARGO_CONTACT * INPUT_COUNT + Input.CONTACT_EGG] = CARGO_CONTACT_GAIN;
  vector[W_IN + H_CARGO_CONTACT * INPUT_COUNT + Input.CONTACT_FOOD] = CARGO_CONTACT_GAIN;
  vector[W_IN + H_CARGO_CONTACT * INPUT_COUNT + Input.CARRY_LOAD] = CARGO_CONTACT_LOAD_INHIBITION;
  vector[W_IN + H_CARGO_CONTACT * INPUT_COUNT + Input.BIAS] = CARGO_CONTACT_BIAS;
  vector[W_OUT + Output.FORWARD * HIDDEN_COUNT + H_CARGO_CONTACT] = CARGO_CONTACT_STOP;
  vector[W_OUT + Output.VERTICAL_BIAS * HIDDEN_COUNT + H_CARGO_CONTACT] = CARGO_CONTACT_LEVEL;
  vector[W_OUT + Output.DIG * HIDDEN_COUNT + H_CARGO_CONTACT] = CARGO_CONTACT_PICKUP;
  vector[W_OUT + Output.EAT * HIDDEN_COUNT + H_CARGO_CONTACT] = CARGO_CONTACT_EAT_INHIBITION;
  const resting = Math.tanh(CARGO_CONTACT_BIAS);
  compensate(vector, Output.FORWARD, resting, CARGO_CONTACT_STOP);
  compensate(vector, Output.VERTICAL_BIAS, resting, CARGO_CONTACT_LEVEL);
  compensate(vector, Output.DIG, resting, CARGO_CONTACT_PICKUP);
  compensate(vector, Output.EAT, resting, CARGO_CONTACT_EAT_INHIBITION);
}

function addSafeRelease(vector: Float32Array): void {
  vector[W_IN + H_SAFE_EGG * INPUT_COUNT + Input.CARRY_LOAD] = SAFE_EGG_LOAD_GAIN;
  vector[W_IN + H_SAFE_EGG * INPUT_COUNT + Input.CARRIED_MATERIAL] = SAFE_EGG_MATERIAL_INHIBITION;
  vector[W_IN + H_SAFE_EGG * INPUT_COUNT + Input.TEMPERATURE] = SAFE_TEMPERATURE_INHIBITION;
  vector[W_IN + H_SAFE_EGG * INPUT_COUNT + Input.BIAS] = SAFE_RELAY_BIAS;
  vector[W_OUT + Output.DIG * HIDDEN_COUNT + H_SAFE_EGG] = SAFE_EGG_DROP;

  vector[W_IN + H_SAFE_CONTACT * INPUT_COUNT + Input.CONTACT_EGG] = SAFE_CONTACT_GAIN;
  vector[W_IN + H_SAFE_CONTACT * INPUT_COUNT + Input.CONTACT_FOOD] = SAFE_CONTACT_GAIN;
  vector[W_IN + H_SAFE_CONTACT * INPUT_COUNT + Input.TEMPERATURE] = SAFE_TEMPERATURE_INHIBITION;
  vector[W_IN + H_SAFE_CONTACT * INPUT_COUNT + Input.BIAS] = SAFE_RELAY_BIAS;
  vector[W_OUT + Output.DIG * HIDDEN_COUNT + H_SAFE_CONTACT] = SAFE_CONTACT_DIG_INHIBITION;
}

/** Add Appendix D step-12 transport to a five-reflex digger vector. */
export function extendFunctionalSeed(vector: Float32Array): Float32Array {
  vector[W_OUT + Output.EAT * HIDDEN_COUNT + H_HAUL] = HAUL_EAT_INHIBITION;
  addEggPayload(vector);
  addFoodBand(vector);
  addCargoContact(vector);
  addSafeRelease(vector);
  return vector;
}
