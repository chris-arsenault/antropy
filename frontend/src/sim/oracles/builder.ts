import { type Ant } from "../ant";
import { spoilCapacity } from "../actions";
import { Output } from "../controller/contract";
import { Material } from "../materials";
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

function ensureState(ant: Ant): BuilderState {
  let s = state.get(ant.id);
  if (!s) {
    s = { col: { x: ant.x, z: ant.z }, surfaceY: ant.y, deepestY: ant.y, phase: "dig" };
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

/** Sit on the shaft column and dig straight down, stepping into the hole. */
function digPhase(ant: Ant, s: BuilderState): Float32Array {
  if (!atColumn(ant, s)) {
    // Return to the column; drop down if a shaft voxel is beneath.
    const outputs = steer(turnToward(ant, s.col.x, s.col.z), 0.5);
    outputs[Output.VERTICAL_BIAS] = -1;
    return outputs;
  }
  const outputs = steer(0, 0.3); // no horizontal drive: stay on the column
  outputs[Output.VERTICAL_BIAS] = -1;
  outputs[Output.DIG] = 1;
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
    const s = ensureState(ant);
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
        return digPhase(ant, s);
    }
  };
}
