import { type Ant } from "../ant";
import { spoilCapacity } from "../actions";
import { Output } from "../controller/contract";
import { getVoxelSafe, voxelIndex } from "../grid";
import { Material } from "../materials";
import { sampleScent } from "../scent";
import { type World } from "../world";
import { steer, turnToward, type OraclePolicy } from "./policies";

/**
 * Scripted builder (Phase 2 base case, spec §13): known-behavior ants that
 * excavate a real vertical shaft with the real dig mechanics and store
 * food at the bottom. Not evolved, not a controller — a hand state machine
 * answering "does an ant dig a shaft and store food in this world at all?"
 *
 * Geometry: a shaft at a FIXED column (the ant's spawn column). The ant
 * digs the voxel straight below and steps into it; when its crop of spoil
 * is full it climbs the shaft, walks a few tiles off, and drops the spoil;
 * once the shaft is deep enough it forages surface food and carries it
 * back down to the floor.
 */
interface BuilderState {
  col: { x: number; z: number };
  surfaceY: number;
  deepestY: number;
  phase: "dig" | "haul" | "forage" | "store";
}

const state = new Map<number, BuilderState>();

export function resetBuilderState(): void {
  state.clear();
}

function ensureState(ant: Ant, column?: { x: number; z: number }): BuilderState {
  let s = state.get(ant.id);
  if (!s) {
    s = {
      col: column ?? { x: ant.x, z: ant.z },
      surfaceY: ant.y,
      deepestY: ant.y,
      phase: "dig",
    };
    state.set(ant.id, s);
  }
  s.deepestY = Math.min(s.deepestY, ant.y);
  return s;
}

function localSurface(world: World, x: number, z: number): number {
  return world.surfaceMap[z * world.grid.sizeX + x];
}

function atColumn(ant: Ant, s: BuilderState): boolean {
  return ant.x === s.col.x && ant.z === s.col.z;
}

function nearestFood(world: World, ant: Ant): { x: number; z: number } | null {
  let best: { x: number; z: number } | null = null;
  let bestDist = Infinity;
  for (const index of world.foodSources) {
    const x = index % world.grid.sizeX;
    const z = Math.floor(index / world.grid.sizeX) % world.grid.sizeZ;
    const y = Math.floor(index / (world.grid.sizeX * world.grid.sizeZ));
    if (y < localSurface(world, x, z)) {
      continue; // already-stored food underground is not a forage target
    }
    const d = Math.max(Math.abs(x - ant.x), Math.abs(z - ant.z));
    if (d < bestDist) {
      bestDist = d;
      best = { x, z };
    }
  }
  return best;
}

// Lateral dig directions, in a fixed order for determinism.
const LATERALS = [
  { dx: 1, dz: 0, heading: 0 },
  { dx: 0, dz: 1, heading: Math.PI / 2 },
  { dx: -1, dz: 0, heading: Math.PI },
  { dx: 0, dz: -1, heading: -Math.PI / 2 },
] as const;

/**
 * Rule 1 (amplify): the strongest-marked face wins. A face's mark is the
 * channel-A concentration in the open voxel on its near side — for a
 * lateral face that is the existing tunnel in that direction, if any.
 * Solo, every lateral neighbour is solid and unmarked, so the score is
 * zero everywhere and the dig-down bias carries: amplification cannot
 * break single-ant shaft sinking. With company, an ant extends toward
 * where work is already happening.
 */
function bestMarkedLateral(world: World, ant: Ant): (typeof LATERALS)[number] | null {
  let best: (typeof LATERALS)[number] | null = null;
  let bestMark = 0;
  for (const lateral of LATERALS) {
    const nx = ant.x + lateral.dx;
    const nz = ant.z + lateral.dz;
    if (getVoxelSafe(world.grid, nx, ant.y, nz) !== Material.AIR) {
      continue; // no open tunnel that way: nothing marked to amplify
    }
    const mark = sampleScent(
      world.pheromoneA,
      voxelIndex(world.grid, nx, ant.y, nz),
      ant.lineageId
    );
    if (mark > bestMark) {
      bestMark = mark;
      best = lateral;
    }
  }
  return best;
}

/**
 * Rule 2 (overflow): when the downward face is unavailable — already
 * open, or bottomed out on rock — a crowded digger turns sideways, so the
 * queue spills into branches off the shaft instead of stalling. Gating on
 * "face taken" is what lets the shaft form at all: without it every ant
 * funnels onto one voxel, is maximally crowded, and the crew scrapes a
 * shallow pit instead of sinking a nest.
 */
function shouldOverflow(world: World, ant: Ant, opts: BuilderOptions): boolean {
  if (opts.overflowCrowding === undefined) {
    return false;
  }
  const below = getVoxelSafe(world.grid, ant.x, ant.y - 1, ant.z);
  const faceTaken = below === Material.AIR || below === Material.ROCK;
  return faceTaken && crowding(world, ant) >= opts.overflowCrowding;
}

/** Sit on the shaft column and dig straight down, stepping into the hole. */
function digPhase(
  world: World,
  ant: Ant,
  s: BuilderState,
  opts: BuilderOptions
): Float32Array {
  const amplify = opts.amplify === true;
  if (!atColumn(ant, s)) {
    // Return to the column; drop down if a shaft voxel is beneath.
    const outputs = steer(turnToward(ant, s.col.x, s.col.z), 0.5);
    outputs[Output.VERTICAL_BIAS] = -1;
    return outputs;
  }
  if (shouldOverflow(world, ant, opts)) {
    const sideways = steer(0, 0.3);
    sideways[Output.DIG] = 1;
    if (amplify) {
      sideways[Output.PHEROMONE_A] = 1;
    }
    return withHeadingDig(sideways, ant, bestMarkedLateral(world, ant) ?? fanoutLateral(ant));
  }
  if (amplify) {
    const lateral = bestMarkedLateral(world, ant);
    if (lateral) {
      // Extend the marked face sideways (neutral bias digs the faced voxel).
      const marked = steer(0, 0.3);
      marked[Output.DIG] = 1;
      marked[Output.PHEROMONE_A] = 1;
      return withHeadingDig(marked, ant, lateral);
    }
  }
  const outputs = steer(0, 0.3); // no horizontal drive: stay on the column
  outputs[Output.VERTICAL_BIAS] = -1;
  outputs[Output.DIG] = 1;
  if (amplify) {
    outputs[Output.PHEROMONE_A] = 1; // mark the work site while digging
  }
  return outputs;
}

/** Point the ant along a lateral and dig the faced voxel. */
function withHeadingDig(
  outputs: Float32Array,
  ant: Ant,
  lateral: (typeof LATERALS)[number]
): Float32Array {
  let relative = lateral.heading - ant.heading;
  relative = ((relative + Math.PI) % (2 * Math.PI)) - Math.PI;
  if (relative < -Math.PI) {
    relative += 2 * Math.PI;
  }
  outputs[Output.TURN] = Math.max(-1, Math.min(1, (relative / Math.PI) * 3));
  outputs[Output.VERTICAL_BIAS] = 0; // neutral bias digs the faced voxel
  return outputs;
}

/** Climb the shaft, walk off the mouth, and drop the spoil load. */
function haulPhase(world: World, ant: Ant, s: BuilderState): Float32Array {
  const aboveGround = ant.y > localSurface(world, ant.x, ant.z);
  if (!aboveGround) {
    const outputs = steer(atColumn(ant, s) ? 0 : turnToward(ant, s.col.x, s.col.z), 0.4);
    outputs[Output.VERTICAL_BIAS] = 1; // climb the shaft
    return outputs;
  }
  const clear = Math.max(Math.abs(ant.x - s.col.x), Math.abs(ant.z - s.col.z)) >= 3;
  if (!clear) {
    return steer(turnToward(ant, s.col.x - 10, s.col.z), 1);
  }
  const outputs = steer(0.2, 0.15);
  outputs[Output.DIG] = 1; // at capacity → deposits spoil here
  return outputs;
}

/** Fetch the nearest surface food and pick it up. */
function foragePhase(world: World, ant: Ant, s: BuilderState): Float32Array {
  // Climb out first if still underground.
  if (ant.y < localSurface(world, ant.x, ant.z)) {
    const outputs = steer(turnToward(ant, s.col.x, s.col.z), 0.4);
    outputs[Output.VERTICAL_BIAS] = 1;
    return outputs;
  }
  const food = nearestFood(world, ant);
  if (!food) {
    return steer(0.3, 0.6);
  }
  const outputs = steer(turnToward(ant, food.x, food.z), 1);
  outputs[Output.DIG] = 1; // pick the food up on contact
  return outputs;
}

/** Carry food to the shaft mouth, descend, and drop it on the floor. */
function storePhase(world: World, ant: Ant, s: BuilderState): Float32Array {
  if (!atColumn(ant, s) && ant.y >= localSurface(world, ant.x, ant.z)) {
    return steer(turnToward(ant, s.col.x, s.col.z), 0.6);
  }
  if (ant.y > s.deepestY + 1) {
    const outputs = steer(atColumn(ant, s) ? 0 : turnToward(ant, s.col.x, s.col.z), 0.3);
    outputs[Output.VERTICAL_BIAS] = -1;
    return outputs;
  }
  const outputs = steer(0.2, 0.1);
  outputs[Output.DIG] = 1; // at the floor → deposit the food voxel
  return outputs;
}

export interface BuilderOptions {
  depth: number;
  /** Rule 1: mark channel A while digging and prefer the marked face. */
  amplify?: boolean;
  /**
   * Rule 2 (overflow): with this many neighbours or more at the working
   * face, dig sideways instead of down — the queue spills into new
   * lateral work instead of stalling behind one shaft head.
   */
  overflowCrowding?: number;
  /** Shared nest column; default is each ant's own spawn column. */
  column?: { x: number; z: number };
}

/** Living ants within one voxel of this one (its immediate work face). */
function crowding(world: World, ant: Ant): number {
  let near = 0;
  for (const other of world.ants) {
    if (!other.alive || other.id === ant.id) {
      continue;
    }
    const d = Math.max(
      Math.abs(other.x - ant.x),
      Math.abs(other.y - ant.y),
      Math.abs(other.z - ant.z)
    );
    if (d <= 1) {
      near += 1;
    }
  }
  return near;
}

/** A deterministic lateral per ant, so crowded diggers fan out. */
function fanoutLateral(ant: Ant): (typeof LATERALS)[number] {
  return LATERALS[ant.id % LATERALS.length];
}

/** The idle behavior once not hauling or carrying: dig until deep, forage after. */
function idlePhase(deepEnough: boolean): BuilderState["phase"] {
  return deepEnough ? "forage" : "dig";
}

function nextPhase(s: BuilderState, ant: Ant, full: boolean, deepEnough: boolean): BuilderState["phase"] {
  if (ant.carrying === Material.FOOD) {
    return "store";
  }
  if (full) {
    return "haul";
  }
  if (s.phase === "haul" && ant.spoilLoads > 0) {
    return "haul"; // keep hauling until the load is dropped
  }
  return idlePhase(deepEnough);
}

export function makeBuilder(opts: BuilderOptions): OraclePolicy {
  return (world, ant) => {
    const s = ensureState(ant, opts.column);
    const full = ant.spoilLoads >= spoilCapacity(ant, world.config);
    const deepEnough = s.surfaceY - s.deepestY >= opts.depth;
    s.phase = nextPhase(s, ant, full, deepEnough);

    switch (s.phase) {
      case "haul":
        return haulPhase(world, ant, s);
      case "forage":
        return foragePhase(world, ant, s);
      case "store":
        return storePhase(world, ant, s);
      default:
        return digPhase(world, ant, s, opts);
    }
  };
}
