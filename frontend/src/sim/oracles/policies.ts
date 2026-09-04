import { SEX_MALE, type Ant } from "../ant";
import { Input, Output, OUTPUT_COUNT } from "../controller/contract";
import { type World } from "../world";

/**
 * Appendix B §B.4 oracle ladder (ADR-0009): scripted cheat-agents driving
 * the real body. Rung 1 reads the world; rung 2 reads only the shipped
 * sensor vector; rung 4 degrades any policy with noise and lag.
 */
export type OraclePolicy = (world: World, ant: Ant, inputs: Float32Array) => Float32Array;

// Single-threaded output scratch, consumed immediately by stepAnt.
const OUT = new Float32Array(OUTPUT_COUNT);

export function steer(turn: number, forward: number): Float32Array {
  OUT.fill(0);
  OUT[Output.TURN] = Math.max(-1, Math.min(1, turn));
  OUT[Output.FORWARD] = forward;
  return OUT;
}

export function turnToward(ant: Ant, x: number, z: number): number {
  let relative = Math.atan2(z - ant.z, x - ant.x) - ant.heading;
  relative = ((relative + Math.PI) % (2 * Math.PI)) - Math.PI;
  if (relative < -Math.PI) {
    relative += 2 * Math.PI;
  }
  return (relative / Math.PI) * 3;
}

function nearestFood(world: World, ant: Ant): { x: number; z: number } | null {
  let best: { x: number; z: number } | null = null;
  let bestDist = Infinity;
  for (const index of world.foodSources) {
    const x = index % world.grid.sizeX;
    const z = Math.floor(index / world.grid.sizeX) % world.grid.sizeZ;
    const d = Math.max(Math.abs(x - ant.x), Math.abs(z - ant.z));
    if (d < bestDist) {
      bestDist = d;
      best = { x, z };
    }
  }
  return best;
}

const SATED = 0.85;
const HUNGRY = 0.6;

/**
 * Rung 1 — omniscient: beeline to the nearest food, eat when hungry, carry
 * when sated, beeline home and unload. Answers "is the world generous
 * enough for any behavior?"
 */
function unloadAtNest(ant: Ant, inputs: Float32Array, outputs: Float32Array): Float32Array {
  // Unload at the nest; trophallaxis handles the energy surplus.
  if (ant.spoilLoads > 0 && inputs[Input.NEST_SCENT_LEFT] + inputs[Input.NEST_SCENT_RIGHT] > 0.1) {
    outputs[Output.DIG] = 1;
  }
  return outputs;
}

function isHomeward(ant: Ant): boolean {
  return ant.spoilLoads > 0 || ant.energy > SATED;
}

/** Script-level brood care, mirroring the backbone instinct: never eat
 * where an egg (and no food) is in contact. */
export function guardBrood(inputs: Float32Array, outputs: Float32Array): Float32Array {
  if (
    outputs[Output.EAT] > 0 &&
    inputs[Input.CONTACT_EGG] > 0 &&
    inputs[Input.CONTACT_FOOD] === 0
  ) {
    outputs[Output.EAT] = 0;
  }
  return outputs;
}

export function omniscientOracle(world: World, ant: Ant, inputs: Float32Array): Float32Array {
  if (ant.sex === SEX_MALE) {
    return steer(0.2, 0.5);
  }
  if (isHomeward(ant)) {
    const colony = world.colonies.find((c) => c.id === ant.lineageId);
    if (colony) {
      return unloadAtNest(ant, inputs, steer(turnToward(ant, colony.x, colony.z), 1));
    }
  }
  const food = nearestFood(world, ant);
  if (food === null) {
    return steer(0.3, 0.6);
  }
  const outputs = steer(turnToward(ant, food.x, food.z), 1);
  if (ant.energy < SATED) {
    outputs[Output.EAT] = 1;
  } else if (inputs[Input.CONTACT_FOOD] > 0) {
    outputs[Output.DIG] = 1; // pick up for transport
  }
  return guardBrood(inputs, outputs);
}

/** Home by climbing the nest-scent plume (stereo difference); circle
 * gently when outside it — the plume radius is gated to cover the forage
 * range (ladder rung 2 certifies this end to end). */
function plumeTurn(inputs: Float32Array): number {
  const nestLeft = inputs[Input.NEST_SCENT_LEFT];
  const nestRight = inputs[Input.NEST_SCENT_RIGHT];
  if (nestLeft + nestRight < 0.01) {
    return 0.4;
  }
  return 6 * (nestLeft - nestRight);
}

// Per-ant wander phase for the sensor-limited oracle (diagnostic state).
const wanderPhase = new Map<number, number>();

function sensorForage(inputs: Float32Array, phase: number, energy: number): Float32Array {
  const left = inputs[Input.FOOD_SCENT_LEFT];
  const right = inputs[Input.FOOD_SCENT_RIGHT];
  const blind = left + right < 0.01;
  const nestLeft = inputs[Input.NEST_SCENT_LEFT];
  const nestRight = inputs[Input.NEST_SCENT_RIGHT];
  const nestVisible = nestLeft + nestRight >= 0.01;
  const blindTurn = nestVisible ? 6 * (nestRight - nestLeft) : 0.5 * Math.sin(phase);
  const outputs = steer(blind ? blindTurn : 6 * (left - right), blind ? 0.7 : 1);
  outputs[Output.VERTICAL_BIAS] = inputs[Input.FACING_SLOPE] > 0.5 ? 0.7 : 0;
  if (antShouldEat(inputs, energy)) outputs[Output.EAT] = 1;
  if (antShouldCarry(inputs, energy)) outputs[Output.DIG] = 1;
  return guardBrood(inputs, outputs);
}

function antShouldEat(inputs: Float32Array, energy: number): boolean {
  return energy < HUNGRY || inputs[Input.CONTACT_FOOD] > 0;
}

function antShouldCarry(inputs: Float32Array, energy: number): boolean {
  return energy > SATED && inputs[Input.CONTACT_FOOD] > 0;
}

/**
 * Rung 2 — sensor-limited: the same strategy through the shipped sensors
 * only (food-scent stereo, home angle, nest scent, contacts). Answers "is
 * the sensory interface sufficient?" — if this starves, no controller can
 * succeed.
 */
export function sensorOracle(_world: World, ant: Ant, inputs: Float32Array): Float32Array {
  if (ant.sex === SEX_MALE) {
    return steer(0.2, 0.5);
  }
  const phase = (wanderPhase.get(ant.id) ?? 0) + 0.05;
  wanderPhase.set(ant.id, phase);

  if (isHomeward(ant)) {
    const outputs = steer(plumeTurn(inputs), 1);
    outputs[Output.VERTICAL_BIAS] = inputs[Input.FACING_SLOPE] > 0.5 ? -0.7 : 0;
    return unloadAtNest(ant, inputs, outputs);
  }
  return sensorForage(inputs, phase, ant.energy);
}

/**
 * Rung 4 — degradation wrapper: sensor noise and actuation lag measure the
 * margin the world leaves for the sloppy behavior early evolution produces.
 */
export function degraded(policy: OraclePolicy, noiseSigma: number, lagTicks: number): OraclePolicy {
  const buffers = new Map<number, Float32Array[]>();
  return (world, ant, inputs) => {
    for (let i = 0; i < inputs.length; i++) {
      // Deterministic noise from the world stream (diagnostic runs only).
      inputs[i] += (world.rng.next() - 0.5) * 2 * noiseSigma;
    }
    const fresh = Float32Array.from(policy(world, ant, inputs));
    const queue = buffers.get(ant.id) ?? [];
    queue.push(fresh);
    buffers.set(ant.id, queue);
    if (queue.length > lagTicks) {
      return queue.shift() as Float32Array;
    }
    return fresh;
  };
}

/** Reset diagnostic per-ant state between harness runs. */
export function resetOracleState(): void {
  wanderPhase.clear();
}
