import { Input, Output, OUTPUT_COUNT, type SensorPolicy } from "../controller/contract";
import { TURN_RADIANS_PER_TICK } from "../movement";
import { COLONY_ODOR, ENERGY } from "../tunables";
import {
  COLONY_CHANNELS,
  FOOD_CHANNELS,
  NEST_CHANNELS,
  PHEROMONE_A_CHANNELS,
  type ChannelName,
  type GoalKind,
} from "./colonyLoopChannels";

const OUT = new Float32Array(OUTPUT_COUNT);
const BANDS = [-1, 0, 1] as const;
const HUNGRY = 0.3;
const CARRIER_FLOOR = 0.00001;
const WILD_FOOD_BEARING_FLOOR = 0.02;
const GRADIENT_EPSILON = 0.00001;
const SEARCH_TURN = 0.8;
const MAX_TAXIS_TURN = 0.25;
const MIN_CONFINED_THRUST = 0.2;
const BEARING_DEADBAND = TURN_RADIANS_PER_TICK / 2;
const DIRECT_FOOD_SIGNAL = 0.99;
const ORACLE_THINK_COST = 0.00008;

function unloadedTravelCost(): number {
  return (
    ENERGY.basalPerTick +
    ENERGY.sensorUpkeep +
    ORACLE_THINK_COST * ENERGY.thinkCostScale +
    ENERGY.stepCost
  );
}

/** Equal outbound and home travel rates reserve the returning half of the tank. */
export function colonyLoopReturnThreshold(): number {
  const searchCost = unloadedTravelCost();
  const homeCost = unloadedTravelCost();
  return homeCost / (searchCost + homeCost);
}

function setMotion(turn: number, forward: number, vertical: number): void {
  OUT[Output.TURN] = Math.max(-1, Math.min(1, turn));
  OUT[Output.FORWARD] = forward;
  OUT[Output.VERTICAL_BIAS] = vertical;
}

function foodIdentityScore(food: number, colony: number, stored: boolean): number {
  return stored ? food * colony : food * (1 - colony);
}

function goalValue(inputs: Float32Array, goal: GoalKind, channel: ChannelName): number {
  if (goal === "nest") return inputs[NEST_CHANNELS[channel]];
  if (goal === "entranceTrail") return inputs[PHEROMONE_A_CHANNELS[channel]];
  return foodIdentityScore(
    inputs[FOOD_CHANNELS[channel]],
    inputs[COLONY_CHANNELS[channel]],
    goal === "storedFood"
  );
}

function bandSignals(inputs: Float32Array, goal: GoalKind): readonly [number, number, number] {
  return [
    Math.max(
      goalValue(inputs, goal, "down"),
      goalValue(inputs, goal, "downLeft"),
      goalValue(inputs, goal, "downRight")
    ),
    Math.max(goalValue(inputs, goal, "left"), goalValue(inputs, goal, "right")),
    Math.max(
      goalValue(inputs, goal, "up"),
      goalValue(inputs, goal, "upLeft"),
      goalValue(inputs, goal, "upRight")
    ),
  ];
}

function bandStereo(band: number): readonly [ChannelName, ChannelName] {
  if (band === 0) return ["downLeft", "downRight"];
  if (band === 2) return ["upLeft", "upRight"];
  return ["left", "right"];
}

function bandCenter(band: number): ChannelName {
  if (band === 0) return "down";
  if (band === 2) return "up";
  return "center";
}

function strongestBand(samples: readonly [number, number, number]): number {
  let best = 0;
  for (let index = 1; index < samples.length; index++) {
    if (samples[index] > samples[best]) best = index;
  }
  return best;
}

function signalFloor(goal: GoalKind): number {
  return goal === "wildFood" ? WILD_FOOD_BEARING_FLOOR : CARRIER_FLOOR;
}

function taxisTurn(inputs: Float32Array, goal: GoalKind, band: number): number {
  const [left, right] = bandStereo(band);
  const leftValue = goalValue(inputs, goal, left);
  const rightValue = goalValue(inputs, goal, right);
  const centerValue = goalValue(inputs, goal, bandCenter(band));
  const lateral = leftValue - rightValue;
  const forward = leftValue + rightValue - 2 * centerValue;
  if (Math.abs(lateral) + Math.abs(forward) < GRADIENT_EPSILON) return 0;
  const bearing = Math.atan2(lateral, forward);
  if (Math.abs(bearing) < BEARING_DEADBAND) return 0;
  return Math.max(-1, Math.min(1, bearing / TURN_RADIANS_PER_TICK));
}

function steerToward(turn: number, vertical: number, goal: GoalKind): void {
  if (goal !== "wildFood") {
    setMotion(turn, Math.max(MIN_CONFINED_THRUST, 1 - Math.abs(turn)), vertical);
    return;
  }
  const bounded = Math.max(-MAX_TAXIS_TURN, Math.min(MAX_TAXIS_TURN, turn));
  setMotion(bounded, 1 - Math.abs(bounded), vertical);
}

function exploreWithoutSignal(): void {
  // Physical heading carries the search direction; world-side jitter separates ants.
  setMotion(0, 1, 0);
}

function handleMissingSignal(inputs: Float32Array, goal: GoalKind): void {
  if (goal === "storedFood" && insideNest(inputs)) {
    follow(inputs, "entranceTrail");
    return;
  }
  if (goal === "entranceTrail") {
    exploreWithoutSignal();
    return;
  }
  if (goal !== "nest" && inputs[Input.ENERGY] <= colonyLoopReturnThreshold()) {
    follow(inputs, "nest");
    return;
  }
  if (centerSignalChange(inputs, goal) < -GRADIENT_EPSILON) {
    setMotion(SEARCH_TURN, 0, 0);
    return;
  }
  if (goal !== "nest" && insideNest(inputs)) {
    exploreWithoutSignal();
    return;
  }
  exploreWithoutSignal();
}

function centerSignalChange(inputs: Float32Array, goal: GoalKind): number {
  if (goal === "nest") return inputs[NEST_CHANNELS.centerChange];
  if (goal === "entranceTrail") return inputs[PHEROMONE_A_CHANNELS.centerChange];
  return inputs[FOOD_CHANNELS.centerChange];
}

function directFoodBand(inputs: Float32Array): number | null {
  for (const band of [0, 2]) {
    const central = band === 0 ? "down" : "up";
    const [left, right] = bandStereo(band);
    if (
      inputs[FOOD_CHANNELS[central]] >= DIRECT_FOOD_SIGNAL &&
      inputs[FOOD_CHANNELS[central]] >=
        Math.max(inputs[FOOD_CHANNELS[left]], inputs[FOOD_CHANNELS[right]])
    ) {
      return band;
    }
  }
  return null;
}

function handleDirectFoodSample(inputs: Float32Array, goal: GoalKind): boolean {
  const band = goal === "wildFood" || goal === "storedFood" ? directFoodBand(inputs) : null;
  if (band === null) return false;
  setMotion(0, 0, BANDS[band]);
  return true;
}

function handleStableCenter(goal: GoalKind, centerDominant: boolean, receding: boolean): boolean {
  if (!centerDominant || receding) return false;
  const followsCarrier = goal === "nest" || goal === "entranceTrail";
  setMotion(followsCarrier ? 0 : SEARCH_TURN, followsCarrier ? 1 : 0, 0);
  return true;
}

function followDetectedSignal(
  inputs: Float32Array,
  goal: GoalKind,
  sourceBand: number,
  strongestDirection: number
): void {
  const center = goalValue(inputs, goal, "center");
  const receding = centerSignalChange(inputs, goal) < -GRADIENT_EPSILON;
  const centerDominant = center > strongestDirection + GRADIENT_EPSILON;
  if (handleStableCenter(goal, centerDominant, receding)) return;
  const [leftChannel, rightChannel] = bandStereo(sourceBand);
  const direct = goalValue(inputs, goal, bandCenter(sourceBand));
  const directDominant =
    !receding &&
    sourceBand !== 1 &&
    direct >= Math.max(goalValue(inputs, goal, leftChannel), goalValue(inputs, goal, rightChannel));
  if (directDominant) {
    setMotion(0, 1, BANDS[sourceBand]);
    return;
  }
  const correction = taxisTurn(inputs, goal, sourceBand);
  if (receding && correction === 0) {
    setMotion(SEARCH_TURN, 0, 0);
    return;
  }
  if (correction !== 0) {
    steerToward(correction, BANDS[sourceBand], goal);
    return;
  }
  setMotion(0, 1, BANDS[sourceBand]);
}

function follow(inputs: Float32Array, goal: GoalKind): void {
  const samples = bandSignals(inputs, goal);
  const sourceBand = strongestBand(samples);
  const strongestDirection = samples[sourceBand];
  const strongestSignal = Math.max(strongestDirection, goalValue(inputs, goal, "center"));
  if (strongestSignal < signalFloor(goal)) {
    handleMissingSignal(inputs, goal);
    return;
  }
  if (handleDirectFoodSample(inputs, goal)) return;
  followDetectedSignal(inputs, goal, sourceBand, strongestDirection);
}

function colonySignal(inputs: Float32Array): number {
  return Math.max(
    inputs[COLONY_CHANNELS.center],
    inputs[COLONY_CHANNELS.left],
    inputs[COLONY_CHANNELS.right],
    inputs[COLONY_CHANNELS.down],
    inputs[COLONY_CHANNELS.up],
    inputs[COLONY_CHANNELS.downLeft],
    inputs[COLONY_CHANNELS.downRight],
    inputs[COLONY_CHANNELS.upLeft],
    inputs[COLONY_CHANNELS.upRight]
  );
}

function insideNest(inputs: Float32Array): boolean {
  return inputs[Input.DEPTH] > 0 && colonySignal(inputs) >= COLONY_ODOR.insideThreshold;
}

function handleFoodContact(inputs: Float32Array, inside: boolean): boolean {
  if (inputs[Input.CONTACT_FOOD] === 0) return false;
  setMotion(0, 0, 0);
  if (inputs[Input.ENERGY] < HUNGRY) OUT[Output.EAT] = 1;
  else if (!inside) OUT[Output.DIG] = 1;
  return true;
}

function depositFood(inputs: Float32Array): void {
  const wallAhead = inputs[Input.FACING_SLOPE] > 0.5;
  const downIsAir = inputs[NEST_CHANNELS.down] >= CARRIER_FLOOR;
  setMotion(wallAhead ? SEARCH_TURN : 0, 0, wallAhead && downIsAir ? BANDS[0] : BANDS[1]);
  OUT[Output.DIG] = 1;
}

function carryFood(inputs: Float32Array, inside: boolean): void {
  if (inside && inputs[Input.DEPTH] > 0) {
    depositFood(inputs);
    return;
  }
  follow(inputs, "nest");
}

function seekFood(inputs: Float32Array, inside: boolean): void {
  if (handleFoodContact(inputs, inside)) return;
  if (inside) {
    if (inputs[Input.ENERGY] < HUNGRY) follow(inputs, "storedFood");
    else follow(inputs, "entranceTrail");
    return;
  }
  follow(inputs, "wildFood");
}

/**
 * Sensor-only reference worker. Its complete policy is cargo-first return,
 * hunger-driven cache use, and otherwise wild-food foraging. The artificial
 * mature nest supplies a standing entrance trail through the ordinary scent
 * interface; physical heading and phasic inputs provide persistence without
 * private controller state.
 */
export const colonyLoopOracle: SensorPolicy = {
  createState: () => null,
  act(inputs) {
    OUT.fill(0);
    const inside = insideNest(inputs);
    if (inputs[Input.CARRY_LOAD] > 0) carryFood(inputs, inside);
    else seekFood(inputs, inside);
    return OUT;
  },
};
