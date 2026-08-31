import { type ControllerState, type Genome, type PhysicalTraits } from "./controller/contract";
import { getVoxel, type VoxelGrid } from "./grid";
import { Material } from "./materials";
import { hasSupport } from "./movement";

/**
 * Per-ant record. Lineage and delivery bookkeeping live here from day one
 * (design spec §11.4) even though reproduction lands in M6.
 */
export interface Ant {
  id: number;
  x: number;
  y: number;
  z: number;
  prevX: number;
  prevY: number;
  prevZ: number;
  /** Continuous heading in radians; quantized to 8 directions when stepping. */
  heading: number;
  /** Accumulated forward thrust; a step fires when it reaches 1. */
  moveCharge: number;
  falling: boolean;
  energy: number;
  age: number;
  bodyScale: number;
  /** Carried material id, or null when unburdened. */
  carrying: number | null;
  carryLoad: number;
  alive: boolean;
  lineageId: number;
  patrilineId: number;
  motherId: number;
  fatherId: number;
  deliveries: number;
  /** Opaque behavioral genome — only the controller reads it (spec §2.3). */
  genome: Genome;
  /** Opaque recurrent controller state — the ant's only memory. */
  controllerState: ControllerState;
  /** Expressed physical traits, fixed at spawn (spec §3.2). */
  traits: PhysicalTraits;
}

export interface AntSpawn {
  x: number;
  y: number;
  z: number;
  heading: number;
  energy: number;
  lineageId: number;
  patrilineId: number;
  motherId: number;
  fatherId: number;
  genome: Genome;
  controllerState: ControllerState;
  traits: PhysicalTraits;
}

export function createAnt(id: number, spawn: AntSpawn): Ant {
  return {
    id,
    x: spawn.x,
    y: spawn.y,
    z: spawn.z,
    prevX: spawn.x,
    prevY: spawn.y,
    prevZ: spawn.z,
    heading: spawn.heading,
    moveCharge: 0,
    falling: false,
    energy: spawn.energy,
    age: 0,
    bodyScale: spawn.traits.bodyScale,
    carrying: null,
    carryLoad: 0,
    alive: true,
    lineageId: spawn.lineageId,
    patrilineId: spawn.patrilineId,
    motherId: spawn.motherId,
    fatherId: spawn.fatherId,
    deliveries: 0,
    genome: spawn.genome,
    controllerState: spawn.controllerState,
    traits: spawn.traits,
  };
}

/**
 * Lowest air voxel with support at or above the terrain surface of a column,
 * used for placing ants on the ground.
 */
export function surfaceSpawnY(grid: VoxelGrid, x: number, z: number): number | null {
  for (let y = grid.sizeY - 1; y > 0; y--) {
    const here = getVoxel(grid, x, y, z);
    const below = getVoxel(grid, x, y - 1, z);
    if (here === Material.AIR && below !== Material.AIR && hasSupport(grid, x, y, z)) {
      return y;
    }
  }
  return null;
}
