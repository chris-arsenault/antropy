import { Input, Output } from "../controller/contract";
import { EGG_EXPOSURE } from "../tunables";
import { type OraclePolicy, steer } from "./policies";

const SIGNAL_FLOOR = 0.01;
const TURN_GAIN = 6;
const CAST_TURN = 0.4;
const DEFAULT_OVERFLOW = 0.25;
const DEFAULT_WORK_SIGNAL = 0.5;
const SAFE_TEMPERATURE_INPUT = (EGG_EXPOSURE.safeMultiplier - 1) / 9;

function taxis(left: number, right: number): number {
  return TURN_GAIN * (left - right);
}

function navigate(inputs: Float32Array): number {
  const trailLeft = inputs[Input.PHEROMONE_A_LEFT];
  const trailRight = inputs[Input.PHEROMONE_A_RIGHT];
  if (trailLeft + trailRight >= SIGNAL_FLOOR) {
    return taxis(trailLeft, trailRight);
  }
  const nestLeft = inputs[Input.NEST_SCENT_LEFT];
  const nestRight = inputs[Input.NEST_SCENT_RIGHT];
  return nestLeft + nestRight >= SIGNAL_FLOOR ? taxis(nestLeft, nestRight) : CAST_TURN;
}

function broodTurn(inputs: Float32Array): number {
  const vaultLeft = inputs[Input.PHEROMONE_B_LEFT];
  const vaultRight = inputs[Input.PHEROMONE_B_RIGHT];
  return vaultLeft + vaultRight >= SIGNAL_FLOOR ? taxis(vaultLeft, vaultRight) : navigate(inputs);
}

function carryBrood(inputs: Float32Array, safeTemperature: number): Float32Array {
  const safe = inputs[Input.TEMPERATURE] <= safeTemperature;
  const outputs = steer(broodTurn(inputs), safe ? 0.25 : 0.6);
  outputs[Output.VERTICAL_BIAS] = safe ? 0 : -1;
  outputs[Output.DIG] = safe ? 1 : 0;
  return outputs;
}

function seekQueen(inputs: Float32Array, safeTemperature: number): Float32Array {
  const nestLeft = inputs[Input.NEST_SCENT_LEFT];
  const nestRight = inputs[Input.NEST_SCENT_RIGHT];
  const vaultSignal = inputs[Input.PHEROMONE_B_LEFT] + inputs[Input.PHEROMONE_B_RIGHT];
  const outputs = steer(
    nestLeft + nestRight >= SIGNAL_FLOOR ? taxis(nestLeft, nestRight) : CAST_TURN,
    0.6
  );
  outputs[Output.VERTICAL_BIAS] =
    vaultSignal >= SIGNAL_FLOOR || inputs[Input.TEMPERATURE] <= safeTemperature ? 1 : -1;
  return outputs;
}

/** Shared sensor-limited carrier for the paired brood ledger. */
export function makeThermalBroodCarrier(safeTemperature = SAFE_TEMPERATURE_INPUT): OraclePolicy {
  return (_world, _ant, inputs) => {
    if (inputs[Input.CARRY_LOAD] > 0 && inputs[Input.CARRIED_MATERIAL] === 0) {
      return carryBrood(inputs, safeTemperature);
    }
    if (inputs[Input.CONTACT_EGG] > 0) {
      const pickup = steer(0, 0);
      pickup[Output.DIG] = 1;
      return pickup;
    }
    return seekQueen(inputs, safeTemperature);
  };
}

export interface ThermalBuilderOptions {
  /** Normalized thermoreceptor value at which excavation stops. */
  safeTemperature: number;
  /** Normalized crowding value that changes downward work to lateral work. */
  overflowCrowding: number;
  /** Total local channel-A strength required to authorize excavation. */
  workSignal: number;
  /** Meaning assigned to channel B by this candidate policy. */
  signalRole: "completed-work" | "return-traffic";
  /** Total local channel-B strength that suppresses another digger. */
  inhibitionSignal: number;
}

export const DEFAULT_THERMAL_BUILDER_OPTIONS: ThermalBuilderOptions = {
  safeTemperature: SAFE_TEMPERATURE_INPUT,
  overflowCrowding: DEFAULT_OVERFLOW,
  workSignal: DEFAULT_WORK_SIGNAL,
  signalRole: "completed-work",
  inhibitionSignal: SIGNAL_FLOOR,
};

function haulSpoil(
  outputs: Float32Array,
  trail: number,
  signalRole: ThermalBuilderOptions["signalRole"]
): Float32Array {
  outputs[Output.VERTICAL_BIAS] = 1;
  if (signalRole === "return-traffic") {
    outputs[Output.PHEROMONE_B] = 1;
  }
  if (trail < SIGNAL_FLOOR) {
    outputs[Output.DIG] = 1;
  }
  return outputs;
}

function workAtAuthorizedSite(
  inputs: Float32Array,
  outputs: Float32Array,
  options: ThermalBuilderOptions,
  inhibition: number
): Float32Array {
  const crowded = inputs[Input.CROWDING] >= options.overflowCrowding;
  const safe = inputs[Input.TEMPERATURE] <= options.safeTemperature;
  if (safe && options.signalRole === "completed-work") {
    outputs[Output.PHEROMONE_B] = 1;
  }
  if (inhibition >= options.inhibitionSignal) {
    outputs[Output.TURN] = taxis(inputs[Input.PHEROMONE_B_RIGHT], inputs[Input.PHEROMONE_B_LEFT]);
    outputs[Output.VERTICAL_BIAS] = safe ? 0 : 1;
    return outputs;
  }
  if (safe && crowded) {
    outputs[Output.VERTICAL_BIAS] = 0;
    outputs[Output.DIG] = 1;
    outputs[Output.PHEROMONE_A] = 1;
    return outputs;
  }
  if (!safe && !crowded) {
    outputs[Output.DIG] = 1;
    outputs[Output.PHEROMONE_A] = 1;
    return outputs;
  }
  if (!safe) {
    outputs[Output.VERTICAL_BIAS] = 1;
  }
  return outputs;
}

/**
 * Coordinate-free construction oracle. It follows physical scent carriers,
 * digs while local thermal stress exceeds the brood-safe band. Candidate
 * policies use channel B either to mark completed safe work or to expose
 * active spoil-return traffic; both inhibit redundant recruitment and leave
 * a route brood carriers can reuse. Crowding expands only the safe work zone
 * laterally. No target depth or shape is encoded.
 */
export function makeThermalBuilder(
  options: ThermalBuilderOptions = DEFAULT_THERMAL_BUILDER_OPTIONS
): OraclePolicy {
  return (_world, _ant, inputs) => {
    const trail = inputs[Input.PHEROMONE_A_LEFT] + inputs[Input.PHEROMONE_A_RIGHT];
    const inhibition = inputs[Input.PHEROMONE_B_LEFT] + inputs[Input.PHEROMONE_B_RIGHT];
    const loaded = inputs[Input.CARRY_LOAD] > 0;
    const outputs = steer(navigate(inputs), loaded ? 0.7 : 0.6);
    outputs[Output.VERTICAL_BIAS] = -1;
    if (loaded) {
      return haulSpoil(outputs, trail, options.signalRole);
    }
    if (trail < options.workSignal) {
      return outputs;
    }
    return workAtAuthorizedSite(inputs, outputs, options, inhibition);
  };
}
