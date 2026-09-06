import { Input, Output, OUTPUT_COUNT, type SensorPolicy } from "../controller/contract";
import { COLONY_ODOR } from "../tunables";
import {
  COLONY_CHANNELS,
  FOOD_CHANNELS,
  NEST_CHANNELS,
  PHEROMONE_A_CHANNELS,
  type ScentChannels,
} from "./colonyLoopChannels";

type VerticalBand = -1 | 0 | 1;

interface BandSample {
  readonly direct: number;
  readonly ahead: number;
  readonly left: number;
  readonly right: number;
  readonly vertical: VerticalBand;
}

interface CarrierStep {
  readonly guide: number;
  readonly track: number;
  readonly turn: number;
  readonly vertical: number;
}

interface ScentStep {
  readonly signal: number;
  readonly turn: number;
  readonly vertical: number;
}

const SIGNAL_FLOOR = 1e-5;
const GRADIENT_FLOOR = 1e-6;
const DIRECT_FOOD = 0.999;
const MAX_TAXIS_TURN = 1;
const NEST_CORE_SIGNAL = 0.9858;
const NEST_DIRECTION_EPSILON = 1e-7;
const DIAGONAL_VERTICAL_BIAS = 0.6;
const TRAIL_EDGE_FRACTION = 0.5;

function sampleBands(inputs: Float32Array, channels: ScentChannels): readonly BandSample[] {
  return [
    {
      direct: inputs[channels.down],
      ahead: inputs[channels.downAhead],
      left: inputs[channels.downLeft],
      right: inputs[channels.downRight],
      vertical: -1,
    },
    {
      direct: inputs[channels.center],
      ahead: inputs[channels.ahead],
      left: inputs[channels.left],
      right: inputs[channels.right],
      vertical: 0,
    },
    {
      direct: inputs[channels.up],
      ahead: inputs[channels.upAhead],
      left: inputs[channels.upLeft],
      right: inputs[channels.upRight],
      vertical: 1,
    },
  ];
}

function bandStrength(sample: BandSample): number {
  return Math.max(sample.direct, sample.ahead, sample.left, sample.right);
}

function strongestBand(samples: readonly BandSample[]): BandSample {
  let strongest = samples[0];
  for (let index = 1; index < samples.length; index++) {
    if (bandStrength(samples[index]) > bandStrength(strongest)) strongest = samples[index];
  }
  return strongest;
}

function carrierStrength(inputs: Float32Array, channels: ScentChannels): number {
  return bandStrength(strongestBand(sampleBands(inputs, channels)));
}

function setMotion(outputs: Float32Array, turn: number, forward: number, vertical: number): void {
  outputs[Output.TURN] = turn;
  outputs[Output.FORWARD] = forward;
  outputs[Output.VERTICAL_BIAS] = vertical;
}

function diagonalBias(vertical: VerticalBand): number {
  return vertical * DIAGONAL_VERTICAL_BIAS;
}

function directFoodSample(samples: readonly BandSample[]): BandSample | null {
  for (const sample of samples) {
    if (bandStrength(sample) >= DIRECT_FOOD) return sample;
  }
  return null;
}

function faceFood(outputs: Float32Array, sample: BandSample): void {
  let turn = 0;
  if (sample.left >= DIRECT_FOOD) turn = 1;
  else if (sample.right >= DIRECT_FOOD) turn = -1;
  setMotion(outputs, turn, 0, sample.vertical);
}

function betterScentStep(current: ScentStep | null, candidate: ScentStep): ScentStep {
  return current === null || candidate.signal > current.signal ? candidate : current;
}

function considerScentStep(
  current: ScentStep | null,
  signal: number,
  turn: number,
  vertical: number,
  center: number
): ScentStep | null {
  if (signal <= center + GRADIENT_FLOOR) return current;
  return betterScentStep(current, { signal, turn, vertical });
}

function followCarrier(
  outputs: Float32Array,
  inputs: Float32Array,
  channels: ScentChannels
): boolean {
  const samples = sampleBands(inputs, channels);
  const center = inputs[channels.center];
  let best: ScentStep | null = null;
  for (const sample of samples) {
    const diagonal = diagonalBias(sample.vertical);
    best = considerScentStep(best, sample.ahead, 0, diagonal, center);
    best = considerScentStep(best, sample.left, MAX_TAXIS_TURN, diagonal, center);
    best = considerScentStep(best, sample.right, -MAX_TAXIS_TURN, diagonal, center);
    if (sample.vertical !== 0) {
      best = considerScentStep(best, sample.direct, 0, sample.vertical, center);
    }
  }
  if (best === null) return false;
  setMotion(outputs, best.turn, best.turn === 0 ? 1 : 0, best.vertical);
  return true;
}

function betterStep(current: CarrierStep | null, candidate: CarrierStep): CarrierStep {
  if (current === null || candidate.track > current.track + GRADIENT_FLOOR) return candidate;
  return Math.abs(candidate.track - current.track) <= GRADIENT_FLOOR &&
    candidate.guide < current.guide
    ? candidate
    : current;
}

function considerStep(
  current: CarrierStep | null,
  track: number,
  guide: number,
  turn: number,
  vertical: number,
  minimumTrack: number,
  currentGuide: number
): CarrierStep | null {
  if (track < minimumTrack || guide >= currentGuide - NEST_DIRECTION_EPSILON) return current;
  return betterStep(current, { track, guide, turn, vertical });
}

/**
 * Follow the physical A trail away from its nest-scent source. A marks where
 * workers walked; the independently diffusing nest scent resolves which way
 * along that undirected trace leads outward. Both values come from the current
 * local sensory frame.
 */
function followEntranceTraffic(outputs: Float32Array, inputs: Float32Array): boolean {
  const trackBands = sampleBands(inputs, PHEROMONE_A_CHANNELS);
  const guideBands = sampleBands(inputs, NEST_CHANNELS);
  const currentGuide = inputs[NEST_CHANNELS.center];
  const minimumTrack = Math.max(
    SIGNAL_FLOOR,
    inputs[PHEROMONE_A_CHANNELS.center] * TRAIL_EDGE_FRACTION
  );
  let best: CarrierStep | null = null;
  for (let index = 0; index < trackBands.length; index++) {
    const track = trackBands[index];
    const guide = guideBands[index];
    const diagonal = diagonalBias(track.vertical);
    best = considerStep(best, track.ahead, guide.ahead, 0, diagonal, minimumTrack, currentGuide);
    best = considerStep(
      best,
      track.left,
      guide.left,
      MAX_TAXIS_TURN,
      diagonal,
      minimumTrack,
      currentGuide
    );
    best = considerStep(
      best,
      track.right,
      guide.right,
      -MAX_TAXIS_TURN,
      diagonal,
      minimumTrack,
      currentGuide
    );
    if (track.vertical !== 0) {
      best = considerStep(
        best,
        track.direct,
        guide.direct,
        0,
        track.vertical,
        minimumTrack,
        currentGuide
      );
    }
  }
  if (best === null) return false;
  setMotion(outputs, best.turn, best.turn === 0 ? 1 : 0, best.vertical);
  return true;
}

function colonySignal(inputs: Float32Array): number {
  return carrierStrength(inputs, COLONY_CHANNELS);
}

function insideNest(inputs: Float32Array): boolean {
  return inputs[Input.DEPTH] > 0 && colonySignal(inputs) >= COLONY_ODOR.insideThreshold;
}

function atNestCore(inputs: Float32Array): boolean {
  if (!insideNest(inputs) || inputs[NEST_CHANNELS.center] < NEST_CORE_SIGNAL) return false;
  return (
    inputs[NEST_CHANNELS.center] + NEST_DIRECTION_EPSILON >= carrierStrength(inputs, NEST_CHANNELS)
  );
}

function depositFood(outputs: Float32Array): void {
  // Repeated local release attempts rotate the physical body around one nest-core
  // stance. No policy state or selected larder coordinate is involved.
  setMotion(outputs, 0.25, 0, 1);
  outputs[Output.DIG] = 1;
}

function carryFood(outputs: Float32Array, inputs: Float32Array): void {
  if (atNestCore(inputs)) {
    depositFood(outputs);
    return;
  }
  if (!followCarrier(outputs, inputs, NEST_CHANNELS)) setMotion(outputs, MAX_TAXIS_TURN, 0, 0);
}

function seekFood(outputs: Float32Array, inputs: Float32Array): void {
  if (insideNest(inputs)) {
    if (!followEntranceTraffic(outputs, inputs)) setMotion(outputs, MAX_TAXIS_TURN, 0, 0);
    return;
  }
  if (inputs[Input.CONTACT_FOOD] > 0) {
    outputs[Output.DIG] = 1;
    return;
  }
  const foodSamples = sampleBands(inputs, FOOD_CHANNELS);
  const direct = directFoodSample(foodSamples);
  if (direct) {
    faceFood(outputs, direct);
    return;
  }
  if (!followCarrier(outputs, inputs, FOOD_CHANNELS)) setMotion(outputs, MAX_TAXIS_TURN, 0, 0);
}

/**
 * Stateless programmed forager. The current sensory frame completely determines
 * its output. The authored nest's interior entrance trail is its only seeded
 * traffic convention; food and home navigation use ordinary material odor.
 */
export const sensorLimitedForager: SensorPolicy = {
  act(inputs) {
    const outputs = new Float32Array(OUTPUT_COUNT);
    if (inputs[Input.CARRY_LOAD] > 0) carryFood(outputs, inputs);
    else seekFood(outputs, inputs);
    return outputs;
  },
};
