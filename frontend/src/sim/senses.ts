import { type Ant } from "./ant";
import { antsNear, type AntIndex } from "./antIndex";
import { Input, INPUT_COUNT } from "./controller/contract";
import { getVoxelSafe, voxelIndex, type VoxelGrid } from "./grid";
import { Material, isSolid } from "./materials";
import { headingToDirection } from "./movement";
import { sampleScent, type ScentField } from "./scent";
import { ENERGY } from "./tunables";

export interface SenseContext {
  grid: VoxelGrid;
  pheromoneA: ScentField;
  pheromoneB: ScentField;
  foodScent: ScentField;
  antIndex: AntIndex;
}

/** Antenna sample positions: one voxel ahead-left and ahead-right. */
function antennaPositions(ant: Ant): {
  left: [number, number, number];
  right: [number, number, number];
} {
  const leftDir = headingToDirection(ant.heading + Math.PI / 4);
  const rightDir = headingToDirection(ant.heading - Math.PI / 4);
  return {
    left: [ant.x + leftDir.dx, ant.y, ant.z + leftDir.dz],
    right: [ant.x + rightDir.dx, ant.y, ant.z + rightDir.dz],
  };
}

function scentAt(
  ctx: SenseContext,
  field: ScentField,
  pos: [number, number, number],
  gain: number
): number {
  const [x, y, z] = pos;
  if (
    x < 0 ||
    x >= ctx.grid.sizeX ||
    y < 0 ||
    y >= ctx.grid.sizeY ||
    z < 0 ||
    z >= ctx.grid.sizeZ
  ) {
    return 0;
  }
  return Math.min(1, sampleScent(field, voxelIndex(ctx.grid, x, y, z)) * gain);
}

function localSolidity(grid: VoxelGrid, ant: Ant): number {
  let solid = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (isSolid(getVoxelSafe(grid, ant.x + dx, ant.y + dy, ant.z + dz))) {
          solid += 1;
        }
      }
    }
  }
  return solid / 26;
}

function facingSlope(grid: VoxelGrid, ant: Ant): number {
  const { dx, dz } = headingToDirection(ant.heading);
  const aheadUp = isSolid(getVoxelSafe(grid, ant.x + dx, ant.y, ant.z + dz)) ? 1 : 0;
  const aheadDown = isSolid(getVoxelSafe(grid, ant.x + dx, ant.y - 1, ant.z + dz)) ? 0 : -1;
  return aheadUp !== 0 ? aheadUp : aheadDown;
}

function contactFlags(ctx: SenseContext, ant: Ant, inputs: Float32Array): void {
  const { dx, dz } = headingToDirection(ant.heading);
  const faced = getVoxelSafe(ctx.grid, ant.x + dx, ant.y, ant.z + dz);
  const below = getVoxelSafe(ctx.grid, ant.x, ant.y - 1, ant.z);
  inputs[Input.CONTACT_FOOD] = faced === Material.FOOD || below === Material.FOOD ? 1 : 0;
  inputs[Input.CONTACT_EGG] = 0; // Eggs arrive in M6.
  const near = antsNear(ctx.antIndex, ctx.grid, ant.x, ant.y, ant.z, 1);
  inputs[Input.CONTACT_ANT] = near.some((other) => other.id !== ant.id) ? 1 : 0;
  inputs[Input.CROWDING] = Math.min(1, (near.length - 1) / 8);
}

/** Build the ~20-input sensory vector (design spec §4). */
export function sense(ctx: SenseContext, ant: Ant, inputs: Float32Array): Float32Array {
  const { left, right } = antennaPositions(ant);
  const gain = ant.traits.sensorGain;
  inputs[Input.PHEROMONE_A_LEFT] = scentAt(ctx, ctx.pheromoneA, left, gain);
  inputs[Input.PHEROMONE_A_RIGHT] = scentAt(ctx, ctx.pheromoneA, right, gain);
  inputs[Input.PHEROMONE_B_LEFT] = scentAt(ctx, ctx.pheromoneB, left, gain);
  inputs[Input.PHEROMONE_B_RIGHT] = scentAt(ctx, ctx.pheromoneB, right, gain);
  inputs[Input.FOOD_SCENT_LEFT] = scentAt(ctx, ctx.foodScent, left, gain);
  inputs[Input.FOOD_SCENT_RIGHT] = scentAt(ctx, ctx.foodScent, right, gain);
  inputs[Input.ENERGY] = Math.max(0, Math.min(1, ant.energy / (ENERGY.max * ant.traits.storage)));
  inputs[Input.AGE_FRACTION] = Math.min(1, ant.age / ENERGY.ageCap);
  inputs[Input.CARRY_LOAD] = ant.carryLoad;
  inputs[Input.CARRIED_MATERIAL] = ant.carrying === null ? 0 : ant.carrying / 8;
  inputs[Input.BODY_SCALE] = Math.min(1, ant.bodyScale / 2);
  inputs[Input.DEPTH] = 1 - ant.y / ctx.grid.sizeY;
  inputs[Input.FACING_SLOPE] = facingSlope(ctx.grid, ant);
  inputs[Input.LOCAL_SOLIDITY] = localSolidity(ctx.grid, ant);
  contactFlags(ctx, ant, inputs);
  inputs[Input.FALLING] = ant.falling ? 1 : 0;
  inputs[Input.BIAS] = 1;
  return inputs;
}

export function createInputBuffer(): Float32Array {
  return new Float32Array(INPUT_COUNT);
}
