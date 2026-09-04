import { Input, Output, OUTPUT_COUNT, type SensorPolicy } from "../controller/contract";
import { COLONY_ODOR } from "../tunables";

const OUT = new Float32Array(OUTPUT_COUNT);
const BANDS = [-1, 0, 1] as const;
const HUNGRY = 0.3;
const CACHE_DEPTH = 0.05;
const GRADIENT_EPSILON = 0.00001;
const OUTWARD_TIE_WINDOW = 0.001;
const SIGNAL_FLOOR = 0.00001;
const PHASIC_EPSILON = 0.000001;
const CAST_TURN = 0.8;
const CAST_FORWARD = 0.35;
const EXPLORE_TURN = 0.15;
const BREADCRUMB_GAIN = 6;
const DIRECT_FOOD_SIGNAL = 0.99;
let stereoGain = 6;

interface ScentChannels {
  readonly left: number;
  readonly right: number;
  readonly down: number;
  readonly up: number;
  readonly center: number;
  readonly leftChange: number;
  readonly rightChange: number;
  readonly downChange: number;
  readonly upChange: number;
  readonly centerChange: number;
  readonly downLeft: number;
  readonly downRight: number;
  readonly upLeft: number;
  readonly upRight: number;
}

const FOOD_CHANNELS: ScentChannels = {
  left: Input.FOOD_SCENT_LEFT,
  right: Input.FOOD_SCENT_RIGHT,
  down: Input.FOOD_SCENT_DOWN,
  up: Input.FOOD_SCENT_UP,
  center: Input.FOOD_SCENT_CENTER,
  leftChange: Input.FOOD_SCENT_LEFT_CHANGE,
  rightChange: Input.FOOD_SCENT_RIGHT_CHANGE,
  downChange: Input.FOOD_SCENT_DOWN_CHANGE,
  upChange: Input.FOOD_SCENT_UP_CHANGE,
  centerChange: Input.FOOD_SCENT_CENTER_CHANGE,
  downLeft: Input.FOOD_SCENT_DOWN_LEFT,
  downRight: Input.FOOD_SCENT_DOWN_RIGHT,
  upLeft: Input.FOOD_SCENT_UP_LEFT,
  upRight: Input.FOOD_SCENT_UP_RIGHT,
};

const NEST_CHANNELS: ScentChannels = {
  left: Input.NEST_SCENT_LEFT,
  right: Input.NEST_SCENT_RIGHT,
  down: Input.NEST_SCENT_DOWN,
  up: Input.NEST_SCENT_UP,
  center: Input.NEST_SCENT_CENTER,
  leftChange: Input.NEST_SCENT_LEFT_CHANGE,
  rightChange: Input.NEST_SCENT_RIGHT_CHANGE,
  downChange: Input.NEST_SCENT_DOWN_CHANGE,
  upChange: Input.NEST_SCENT_UP_CHANGE,
  centerChange: Input.NEST_SCENT_CENTER_CHANGE,
  downLeft: Input.NEST_SCENT_DOWN_LEFT,
  downRight: Input.NEST_SCENT_DOWN_RIGHT,
  upLeft: Input.NEST_SCENT_UP_LEFT,
  upRight: Input.NEST_SCENT_UP_RIGHT,
};

const COLONY_CHANNELS: ScentChannels = {
  left: Input.COLONY_SCENT_LEFT,
  right: Input.COLONY_SCENT_RIGHT,
  down: Input.COLONY_SCENT_DOWN,
  up: Input.COLONY_SCENT_UP,
  center: Input.COLONY_SCENT_CENTER,
  leftChange: Input.COLONY_SCENT_LEFT_CHANGE,
  rightChange: Input.COLONY_SCENT_RIGHT_CHANGE,
  downChange: Input.COLONY_SCENT_DOWN_CHANGE,
  upChange: Input.COLONY_SCENT_UP_CHANGE,
  centerChange: Input.COLONY_SCENT_CENTER_CHANGE,
  downLeft: Input.COLONY_SCENT_DOWN_LEFT,
  downRight: Input.COLONY_SCENT_DOWN_RIGHT,
  upLeft: Input.COLONY_SCENT_UP_LEFT,
  upRight: Input.COLONY_SCENT_UP_RIGHT,
};

const PHEROMONE_B_CHANNELS: ScentChannels = {
  left: Input.PHEROMONE_B_LEFT,
  right: Input.PHEROMONE_B_RIGHT,
  down: Input.PHEROMONE_B_DOWN,
  up: Input.PHEROMONE_B_UP,
  center: Input.PHEROMONE_B_CENTER,
  leftChange: Input.PHEROMONE_B_LEFT_CHANGE,
  rightChange: Input.PHEROMONE_B_RIGHT_CHANGE,
  downChange: Input.PHEROMONE_B_DOWN_CHANGE,
  upChange: Input.PHEROMONE_B_UP_CHANGE,
  centerChange: Input.PHEROMONE_B_CENTER_CHANGE,
  downLeft: Input.PHEROMONE_B_DOWN_LEFT,
  downRight: Input.PHEROMONE_B_DOWN_RIGHT,
  upLeft: Input.PHEROMONE_B_UP_LEFT,
  upRight: Input.PHEROMONE_B_UP_RIGHT,
};

function setMotion(turn: number, forward: number, vertical: number): void {
  OUT[Output.TURN] = Math.max(-1, Math.min(1, turn));
  OUT[Output.FORWARD] = forward;
  OUT[Output.VERTICAL_BIAS] = vertical;
}

function bandSignals(
  inputs: Float32Array,
  channels: ScentChannels
): readonly [number, number, number] {
  return [
    Math.max(inputs[channels.down], inputs[channels.downLeft], inputs[channels.downRight]),
    Math.max(inputs[channels.left], inputs[channels.right]),
    Math.max(inputs[channels.up], inputs[channels.upLeft], inputs[channels.upRight]),
  ];
}

function bandStereo(channels: ScentChannels, band: number): readonly [number, number] {
  if (band === 0) return [channels.downLeft, channels.downRight];
  if (band === 2) return [channels.upLeft, channels.upRight];
  return [channels.left, channels.right];
}

function strongestBand(samples: readonly [number, number, number]): number {
  let best = 0;
  for (let index = 1; index < samples.length; index++) {
    if (samples[index] > samples[best]) best = index;
  }
  return best;
}

function outboundBand(inputs: Float32Array): number {
  const carrier = bandSignals(inputs, NEST_CHANNELS);
  const trail = bandSignals(inputs, PHEROMONE_B_CHANNELS);
  const minimumCarrier = Math.min(...carrier.filter((value) => value >= SIGNAL_FLOOR));
  let best = -1;
  // A band with no nest carrier is solid in the mature authored nest. Prefer
  // the least recently traversed band among those with an approximately
  // equal outward gradient. A materially stronger (inward) band is never
  // selected just because it is unmarked.
  for (const index of [2, 1, 0]) {
    if (carrier[index] < SIGNAL_FLOOR || carrier[index] > minimumCarrier + OUTWARD_TIE_WINDOW) {
      continue;
    }
    if (
      best < 0 ||
      trail[index] < trail[best] - GRADIENT_EPSILON ||
      (Math.abs(trail[index] - trail[best]) < GRADIENT_EPSILON && carrier[index] < carrier[best])
    ) {
      best = index;
    }
  }
  return best < 0 ? 1 : best;
}

function searchBand(inputs: Float32Array): number {
  const carrier = bandSignals(inputs, NEST_CHANNELS);
  const trail = bandSignals(inputs, PHEROMONE_B_CHANNELS);
  let best = -1;
  for (const index of [2, 1, 0]) {
    if (carrier[index] < SIGNAL_FLOOR) continue;
    if (best < 0 || trail[index] < trail[best] - GRADIENT_EPSILON) best = index;
  }
  return best < 0 ? 1 : best;
}

function bandChanges(
  inputs: Float32Array,
  channels: ScentChannels
): readonly [number, number, number] {
  return [inputs[channels.downChange], inputs[channels.centerChange], inputs[channels.upChange]];
}

function taxisTurn(
  inputs: Float32Array,
  channels: ScentChannels,
  direction: 1 | -1,
  band: number
): number {
  if (inputs[Input.FACING_SLOPE] > 0.5) return CAST_TURN;
  const [left, right] = bandStereo(channels, band);
  const difference = direction * (inputs[left] - inputs[right]);
  if (Math.abs(difference) < GRADIENT_EPSILON) return 0.15;
  return stereoGain * difference;
}

function castWithoutBearing(inputs: Float32Array, channels: ScentChannels): void {
  const local = inputs[channels.center];
  const hasLocalCarrier = local >= SIGNAL_FLOOR;
  setMotion(hasLocalCarrier ? CAST_TURN : EXPLORE_TURN, hasLocalCarrier ? CAST_FORWARD : 1, 0);
}

function directlySampledFood(
  inputs: Float32Array,
  channels: ScentChannels,
  sourceBand: number
): boolean {
  if (channels !== FOOD_CHANNELS) return false;
  const central = sourceBand === 0 ? channels.down : channels.up;
  const [left, right] = bandStereo(channels, sourceBand);
  return (
    inputs[central] >= DIRECT_FOOD_SIGNAL &&
    inputs[central] >= Math.max(inputs[left], inputs[right])
  );
}

function moveVertical(inputs: Float32Array, channels: ScentChannels, sourceBand: number): boolean {
  if (sourceBand === 1) return false;
  const vertical = BANDS[sourceBand];
  if (directlySampledFood(inputs, channels, sourceBand)) {
    // Select the band without translating. The next frame's shared mandible
    // resolver can then report and consume this sampled food.
    setMotion(0, 0, vertical);
  } else {
    setMotion(taxisTurn(inputs, channels, 1, sourceBand), 1, vertical);
  }
  return true;
}

function moveLevel(inputs: Float32Array, channels: ScentChannels, improvement: number): void {
  const [left, right] = bandStereo(channels, 1);
  const directional = Math.abs(inputs[left] - inputs[right]);
  if (improvement <= PHASIC_EPSILON && directional < GRADIENT_EPSILON) {
    setMotion(CAST_TURN, CAST_FORWARD, 0);
    return;
  }
  setMotion(taxisTurn(inputs, channels, 1, 1), 1, 0);
}

function taxisToward(inputs: Float32Array, channels: ScentChannels): void {
  const samples = bandSignals(inputs, channels);
  const sourceBand = strongestBand(samples);
  if (samples[sourceBand] < SIGNAL_FLOOR) {
    // A carrier only at the current voxel is present but non-directional:
    // cast slowly rather than walking out of it. With no local carrier at
    // all, keep exploring until the plume is reacquired.
    castWithoutBearing(inputs, channels);
    return;
  }
  const improvement = bandChanges(inputs, channels)[sourceBand];
  if (improvement < -PHASIC_EPSILON) {
    setMotion(CAST_TURN, CAST_FORWARD, BANDS[1]);
    return;
  }
  if (moveVertical(inputs, channels, sourceBand)) return;
  moveLevel(inputs, channels, improvement);
}

function colonySignal(inputs: Float32Array): number {
  const samples = bandSignals(inputs, COLONY_CHANNELS);
  return Math.max(samples[0], samples[1], samples[2], inputs[COLONY_CHANNELS.center]);
}

function insideNest(inputs: Float32Array): boolean {
  return colonySignal(inputs) >= COLONY_ODOR.insideThreshold;
}

function handleFoodContact(inputs: Float32Array, inside: boolean): boolean {
  if (inputs[Input.CONTACT_FOOD] === 0) return false;
  setMotion(0, 0, BANDS[1]);
  if (inputs[Input.ENERGY] < HUNGRY) {
    OUT[Output.EAT] = 1;
  } else if (!inside) {
    OUT[Output.DIG] = 1;
  }
  return true;
}

function outboundTurn(inputs: Float32Array, band: number): number {
  const [nestLeft, nestRight] = bandStereo(NEST_CHANNELS, band);
  const [trailLeft, trailRight] = bandStereo(PHEROMONE_B_CHANNELS, band);
  const leftOpen = inputs[nestLeft] >= SIGNAL_FLOOR;
  const rightOpen = inputs[nestRight] >= SIGNAL_FLOOR;
  if (leftOpen && !rightOpen) return CAST_TURN;
  if (rightOpen && !leftOpen) return -CAST_TURN;
  if (!leftOpen && !rightOpen) return CAST_TURN;
  const trailDifference = inputs[trailRight] - inputs[trailLeft];
  if (Math.abs(trailDifference) >= GRADIENT_EPSILON) {
    return BREADCRUMB_GAIN * trailDifference;
  }
  const nestDifference = inputs[nestRight] - inputs[nestLeft];
  return Math.abs(nestDifference) >= GRADIENT_EPSILON ? stereoGain * nestDifference : EXPLORE_TURN;
}

function exploreOut(inputs: Float32Array): void {
  const band = outboundBand(inputs);
  setMotion(outboundTurn(inputs, band), 1, BANDS[band]);
  OUT[Output.PHEROMONE_B] = 0.5;
}

function searchNest(inputs: Float32Array): void {
  const band = searchBand(inputs);
  const [nestLeft, nestRight] = bandStereo(NEST_CHANNELS, band);
  const [trailLeft, trailRight] = bandStereo(PHEROMONE_B_CHANNELS, band);
  const leftOpen = inputs[nestLeft] >= SIGNAL_FLOOR;
  const rightOpen = inputs[nestRight] >= SIGNAL_FLOOR;
  let turn = CAST_TURN;
  if (leftOpen && !rightOpen) turn = CAST_TURN;
  if (rightOpen && !leftOpen) turn = -CAST_TURN;
  if (leftOpen && rightOpen) {
    const difference = inputs[trailRight] - inputs[trailLeft];
    turn = Math.abs(difference) >= GRADIENT_EPSILON ? BREADCRUMB_GAIN * difference : EXPLORE_TURN;
  }
  setMotion(turn, 1, BANDS[band]);
  OUT[Output.PHEROMONE_B] = 0.5;
}

function hasFoodCarrier(inputs: Float32Array): boolean {
  const samples = bandSignals(inputs, FOOD_CHANNELS);
  return Math.max(samples[0], samples[1], samples[2], inputs[FOOD_CHANNELS.center]) >= SIGNAL_FLOOR;
}

function depositFood(inputs: Float32Array): void {
  const wallAhead = inputs[Input.FACING_SLOPE] > 0.5;
  const downIsAir = inputs[NEST_CHANNELS.down] >= SIGNAL_FLOOR;
  setMotion(0.5, 0, wallAhead && downIsAir ? BANDS[0] : BANDS[1]);
  OUT[Output.DIG] = 1;
}

function carryFood(inputs: Float32Array, inside: boolean): void {
  if (inside && inputs[Input.DEPTH] >= CACHE_DEPTH) {
    depositFood(inputs);
    return;
  }
  taxisToward(inputs, NEST_CHANNELS);
}

function seekFood(inputs: Float32Array, inside: boolean): void {
  if (handleFoodContact(inputs, inside)) return;
  if (inputs[Input.ENERGY] >= HUNGRY && inside) {
    exploreOut(inputs);
    return;
  }
  if (inside) {
    // Hunger plus local colony odor is the cache coincidence; food supplies
    // the bearing. Multiplying directional odor samples lets strong ambient
    // nest fabric overpower the food direction without adding information.
    if (hasFoodCarrier(inputs)) {
      taxisToward(inputs, FOOD_CHANNELS);
    } else {
      searchNest(inputs);
    }
  } else {
    taxisToward(inputs, FOOD_CHANNELS);
  }
}

/**
 * Appendix F sensor-only reference policy. Colony odor and food identity stay
 * in physical carriers. Phasic channels trigger casting without stored
 * readings, counters, latches, or another control system.
 */
export const colonyLoopOracle: SensorPolicy = {
  createState: () => null,
  act(inputs) {
    OUT.fill(0);
    const inside = insideNest(inputs);
    if (inputs[Input.CARRY_LOAD] > 0) {
      carryFood(inputs, inside);
    } else {
      seekFood(inputs, inside);
    }
    return OUT;
  },
};

export function resetColonyLoopOracle(): void {
  // State is owned by each World and disappears with the diagnostic run.
}

/** Scope a harness-only steering gain experiment and return its restore hook. */
export function tuneColonyLoopOracle(nextStereoGain: number): () => void {
  const previous = stereoGain;
  stereoGain = nextStereoGain;
  return () => {
    stereoGain = previous;
  };
}
