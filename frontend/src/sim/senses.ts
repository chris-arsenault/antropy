import { type Ant } from "./ant";
import { antsNear, type AntIndex } from "./antIndex";
import { eggCarryCapacity } from "./capacity";
import { type SimConfig } from "./config";
import { Input, INPUT_COUNT } from "./controller/contract";
import { getVoxelSafe, inBounds, voxelIndex, type VoxelGrid } from "./grid";
import { sampleMaterialScent, type MaterialScentField } from "./materialScent";
import { Material, isSolid } from "./materials";
import { headingToDirection } from "./movement";
import { sampleScent, scentResponse, type ScentField } from "./scent";
import { mandibleTargetBand } from "./targeting";
import { ENERGY } from "./tunables";

export interface SenseContext {
  grid: VoxelGrid;
  surfaceMap: Int16Array;
  pheromoneA: ScentField;
  pheromoneB: ScentField;
  foodScent: ScentField;
  nestScent: ScentField;
  colonyScent: ScentField;
  materialColonyScent: MaterialScentField;
  config: SimConfig;
  colonies: readonly { id: number; x: number; y: number; z: number }[];
  antIndex: AntIndex;
  eggIndex: Map<number, unknown>;
  /** Local heat multiplier at an ant's position (weather.ts). */
  climate: (ant: Ant) => number;
}

interface StereoPositions {
  readonly leftX: number;
  readonly leftZ: number;
  readonly rightX: number;
  readonly rightZ: number;
}

const PHEROMONE_A_PAIR = [Input.PHEROMONE_A_LEFT, Input.PHEROMONE_A_RIGHT] as const;
const PHEROMONE_B_PAIR = [Input.PHEROMONE_B_LEFT, Input.PHEROMONE_B_RIGHT] as const;
const FOOD_SCENT_PAIR = [Input.FOOD_SCENT_LEFT, Input.FOOD_SCENT_RIGHT] as const;
const NEST_SCENT_PAIR = [Input.NEST_SCENT_LEFT, Input.NEST_SCENT_RIGHT] as const;

interface ScentInputs {
  readonly level: readonly [number, number];
  readonly center: number;
  readonly down: number;
  readonly up: number;
  readonly downStereo: readonly [number, number];
  readonly upStereo: readonly [number, number];
  readonly change: readonly [number, number, number, number];
  readonly centerChange: number;
  readonly downStereoChange: readonly [number, number];
  readonly upStereoChange: readonly [number, number];
}

const PHEROMONE_A_INPUTS: ScentInputs = {
  level: PHEROMONE_A_PAIR,
  center: Input.PHEROMONE_A_CENTER,
  down: Input.PHEROMONE_A_DOWN,
  up: Input.PHEROMONE_A_UP,
  downStereo: [Input.PHEROMONE_A_DOWN_LEFT, Input.PHEROMONE_A_DOWN_RIGHT],
  upStereo: [Input.PHEROMONE_A_UP_LEFT, Input.PHEROMONE_A_UP_RIGHT],
  change: [
    Input.PHEROMONE_A_LEFT_CHANGE,
    Input.PHEROMONE_A_RIGHT_CHANGE,
    Input.PHEROMONE_A_DOWN_CHANGE,
    Input.PHEROMONE_A_UP_CHANGE,
  ],
  centerChange: Input.PHEROMONE_A_CENTER_CHANGE,
  downStereoChange: [Input.PHEROMONE_A_DOWN_LEFT_CHANGE, Input.PHEROMONE_A_DOWN_RIGHT_CHANGE],
  upStereoChange: [Input.PHEROMONE_A_UP_LEFT_CHANGE, Input.PHEROMONE_A_UP_RIGHT_CHANGE],
};
const PHEROMONE_B_INPUTS: ScentInputs = {
  level: PHEROMONE_B_PAIR,
  center: Input.PHEROMONE_B_CENTER,
  down: Input.PHEROMONE_B_DOWN,
  up: Input.PHEROMONE_B_UP,
  downStereo: [Input.PHEROMONE_B_DOWN_LEFT, Input.PHEROMONE_B_DOWN_RIGHT],
  upStereo: [Input.PHEROMONE_B_UP_LEFT, Input.PHEROMONE_B_UP_RIGHT],
  change: [
    Input.PHEROMONE_B_LEFT_CHANGE,
    Input.PHEROMONE_B_RIGHT_CHANGE,
    Input.PHEROMONE_B_DOWN_CHANGE,
    Input.PHEROMONE_B_UP_CHANGE,
  ],
  centerChange: Input.PHEROMONE_B_CENTER_CHANGE,
  downStereoChange: [Input.PHEROMONE_B_DOWN_LEFT_CHANGE, Input.PHEROMONE_B_DOWN_RIGHT_CHANGE],
  upStereoChange: [Input.PHEROMONE_B_UP_LEFT_CHANGE, Input.PHEROMONE_B_UP_RIGHT_CHANGE],
};
const FOOD_SCENT_INPUTS: ScentInputs = {
  level: FOOD_SCENT_PAIR,
  center: Input.FOOD_SCENT_CENTER,
  down: Input.FOOD_SCENT_DOWN,
  up: Input.FOOD_SCENT_UP,
  downStereo: [Input.FOOD_SCENT_DOWN_LEFT, Input.FOOD_SCENT_DOWN_RIGHT],
  upStereo: [Input.FOOD_SCENT_UP_LEFT, Input.FOOD_SCENT_UP_RIGHT],
  change: [
    Input.FOOD_SCENT_LEFT_CHANGE,
    Input.FOOD_SCENT_RIGHT_CHANGE,
    Input.FOOD_SCENT_DOWN_CHANGE,
    Input.FOOD_SCENT_UP_CHANGE,
  ],
  centerChange: Input.FOOD_SCENT_CENTER_CHANGE,
  downStereoChange: [Input.FOOD_SCENT_DOWN_LEFT_CHANGE, Input.FOOD_SCENT_DOWN_RIGHT_CHANGE],
  upStereoChange: [Input.FOOD_SCENT_UP_LEFT_CHANGE, Input.FOOD_SCENT_UP_RIGHT_CHANGE],
};
const NEST_SCENT_INPUTS: ScentInputs = {
  level: NEST_SCENT_PAIR,
  center: Input.NEST_SCENT_CENTER,
  down: Input.NEST_SCENT_DOWN,
  up: Input.NEST_SCENT_UP,
  downStereo: [Input.NEST_SCENT_DOWN_LEFT, Input.NEST_SCENT_DOWN_RIGHT],
  upStereo: [Input.NEST_SCENT_UP_LEFT, Input.NEST_SCENT_UP_RIGHT],
  change: [
    Input.NEST_SCENT_LEFT_CHANGE,
    Input.NEST_SCENT_RIGHT_CHANGE,
    Input.NEST_SCENT_DOWN_CHANGE,
    Input.NEST_SCENT_UP_CHANGE,
  ],
  centerChange: Input.NEST_SCENT_CENTER_CHANGE,
  downStereoChange: [Input.NEST_SCENT_DOWN_LEFT_CHANGE, Input.NEST_SCENT_DOWN_RIGHT_CHANGE],
  upStereoChange: [Input.NEST_SCENT_UP_LEFT_CHANGE, Input.NEST_SCENT_UP_RIGHT_CHANGE],
};
const COLONY_SCENT_INPUTS: ScentInputs = {
  level: [Input.COLONY_SCENT_LEFT, Input.COLONY_SCENT_RIGHT],
  center: Input.COLONY_SCENT_CENTER,
  down: Input.COLONY_SCENT_DOWN,
  up: Input.COLONY_SCENT_UP,
  downStereo: [Input.COLONY_SCENT_DOWN_LEFT, Input.COLONY_SCENT_DOWN_RIGHT],
  upStereo: [Input.COLONY_SCENT_UP_LEFT, Input.COLONY_SCENT_UP_RIGHT],
  change: [
    Input.COLONY_SCENT_LEFT_CHANGE,
    Input.COLONY_SCENT_RIGHT_CHANGE,
    Input.COLONY_SCENT_DOWN_CHANGE,
    Input.COLONY_SCENT_UP_CHANGE,
  ],
  centerChange: Input.COLONY_SCENT_CENTER_CHANGE,
  downStereoChange: [Input.COLONY_SCENT_DOWN_LEFT_CHANGE, Input.COLONY_SCENT_DOWN_RIGHT_CHANGE],
  upStereoChange: [Input.COLONY_SCENT_UP_LEFT_CHANGE, Input.COLONY_SCENT_UP_RIGHT_CHANGE],
};

function stereoPositions(ant: Ant): StereoPositions {
  const left = headingToDirection(ant.heading + Math.PI / 4);
  const right = headingToDirection(ant.heading - Math.PI / 4);
  return {
    leftX: ant.x + left.dx,
    leftZ: ant.z + left.dz,
    rightX: ant.x + right.dx,
    rightZ: ant.z + right.dz,
  };
}

function scentAt(
  ctx: SenseContext,
  field: ScentField,
  x: number,
  y: number,
  z: number,
  gain: number,
  owner: number
): number {
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
  const index = voxelIndex(ctx.grid, x, y, z);
  let concentration = sampleScent(field, index, owner);
  if (ctx.grid.data[index] === Material.FOOD) {
    if (field === ctx.foodScent) return 1;
    if (field === ctx.colonyScent) {
      concentration = Math.max(
        concentration,
        sampleMaterialScent(ctx.materialColonyScent, index, owner)
      );
    }
  }
  return scentResponse(concentration, gain);
}

interface ScentSampling {
  readonly ctx: SenseContext;
  readonly field: ScentField;
  readonly gain: number;
  readonly owner: number;
}

function sampleInto(
  inputs: Float32Array,
  channel: number,
  sampling: ScentSampling,
  x: number,
  y: number,
  z: number
): void {
  inputs[channel] = scentAt(sampling.ctx, sampling.field, x, y, z, sampling.gain, sampling.owner);
}

function writeScentInputs(
  inputs: Float32Array,
  channels: ScentInputs,
  ctx: SenseContext,
  field: ScentField,
  ant: Ant,
  positions: StereoPositions,
  gain: number,
  owner: number
): void {
  const sampling = { ctx, field, gain, owner };
  sampleInto(inputs, channels.level[0], sampling, positions.leftX, ant.y, positions.leftZ);
  sampleInto(inputs, channels.level[1], sampling, positions.rightX, ant.y, positions.rightZ);
  sampleInto(inputs, channels.center, sampling, ant.x, ant.y, ant.z);
  sampleInto(inputs, channels.down, sampling, ant.x, ant.y - 1, ant.z);
  sampleInto(inputs, channels.up, sampling, ant.x, ant.y + 1, ant.z);
  sampleInto(inputs, channels.downStereo[0], sampling, positions.leftX, ant.y - 1, positions.leftZ);
  sampleInto(
    inputs,
    channels.downStereo[1],
    sampling,
    positions.rightX,
    ant.y - 1,
    positions.rightZ
  );
  sampleInto(inputs, channels.upStereo[0], sampling, positions.leftX, ant.y + 1, positions.leftZ);
  sampleInto(inputs, channels.upStereo[1], sampling, positions.rightX, ant.y + 1, positions.rightZ);
  writeScentChange(inputs, ant, channels.change[0], channels.level[0]);
  writeScentChange(inputs, ant, channels.change[1], channels.level[1]);
  writeScentChange(inputs, ant, channels.change[2], channels.down);
  writeScentChange(inputs, ant, channels.change[3], channels.up);
  writeScentChange(inputs, ant, channels.centerChange, channels.center);
  writeScentChange(inputs, ant, channels.downStereoChange[0], channels.downStereo[0]);
  writeScentChange(inputs, ant, channels.downStereoChange[1], channels.downStereo[1]);
  writeScentChange(inputs, ant, channels.upStereoChange[0], channels.upStereo[0]);
  writeScentChange(inputs, ant, channels.upStereoChange[1], channels.upStereo[1]);
}

function writeScentChange(
  inputs: Float32Array,
  ant: Ant,
  changeChannel: number,
  magnitudeChannel: number
): void {
  inputs[changeChannel] = ant.sensoryHistoryReady
    ? inputs[magnitudeChannel] - ant.lastInputs[magnitudeChannel]
    : 0;
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

function eggAt(ctx: SenseContext, x: number, y: number, z: number): boolean {
  return inBounds(ctx.grid, x, y, z) && ctx.eggIndex.has(voxelIndex(ctx.grid, x, y, z));
}

function contactFlags(ctx: SenseContext, ant: Ant, inputs: Float32Array): void {
  const band = mandibleTargetBand(ant, ant.verticalAttention);
  let food = 0;
  let egg = 0;
  for (let index = 0; index < band.count; index++) {
    const target = band.targets[index];
    if (getVoxelSafe(ctx.grid, target.x, target.y, target.z) === Material.FOOD) food = 1;
    if (eggAt(ctx, target.x, target.y, target.z)) egg = 1;
  }
  inputs[Input.CONTACT_FOOD] = food;
  inputs[Input.CONTACT_EGG] = egg;
  const near = antsNear(ctx.antIndex, ctx.grid, ant.x, ant.y, ant.z, 1);
  inputs[Input.CONTACT_ANT] = near.some((other) => other.id !== ant.id) ? 1 : 0;
  inputs[Input.CROWDING] = Math.min(1, (near.length - 1) / 8);
}

/** Build the sensory vector, including all three scent-height bands. Allocation-free. */
export function sense(ctx: SenseContext, ant: Ant, inputs: Float32Array): Float32Array {
  const positions = stereoPositions(ant);
  const gain = ant.traits.sensorGain;
  const colony = ant.lineageId;
  writeScentInputs(inputs, PHEROMONE_A_INPUTS, ctx, ctx.pheromoneA, ant, positions, gain, colony);
  writeScentInputs(inputs, PHEROMONE_B_INPUTS, ctx, ctx.pheromoneB, ant, positions, gain, colony);
  writeScentInputs(inputs, FOOD_SCENT_INPUTS, ctx, ctx.foodScent, ant, positions, gain, 0);
  writeScentInputs(inputs, NEST_SCENT_INPUTS, ctx, ctx.nestScent, ant, positions, gain, colony);
  writeScentInputs(inputs, COLONY_SCENT_INPUTS, ctx, ctx.colonyScent, ant, positions, gain, colony);
  inputs[Input.ENERGY] = Math.max(0, Math.min(1, ant.energy / (ENERGY.max * ant.traits.storage)));
  inputs[Input.AGE_FRACTION] = Math.min(1, ant.age / ENERGY.ageCap);
  const eggCapacity = eggCarryCapacity(ant, ctx.config);
  inputs[Input.CARRY_LOAD] =
    ant.carriedEggIds.length > 0
      ? Math.min(1, ant.carriedEggIds.length / eggCapacity)
      : ant.carryLoad;
  inputs[Input.CARRIED_MATERIAL] = ant.carrying === null ? 0 : ant.carrying / 8;
  inputs[Input.BODY_SCALE] = Math.min(1, ant.bodyScale / 2);
  const surface = ctx.surfaceMap[ant.z * ctx.grid.sizeX + ant.x];
  inputs[Input.DEPTH] = Math.max(0, Math.min(1, (surface - ant.y) / ctx.grid.sizeY));
  inputs[Input.FACING_SLOPE] = facingSlope(ctx.grid, ant);
  inputs[Input.LOCAL_SOLIDITY] = localSolidity(ctx.grid, ant);
  contactFlags(ctx, ant, inputs);
  inputs[Input.FALLING] = ant.falling ? 1 : 0;
  inputs[Input.BIAS] = 1;
  // Multiplier 1 → 0; a harsh midday surface (~10) reads ~1.
  inputs[Input.TEMPERATURE] = Math.min(1, (ctx.climate(ant) - 1) / 9);
  ant.sensoryHistoryReady = true;
  return inputs;
}

export function createInputBuffer(): Float32Array {
  return new Float32Array(INPUT_COUNT);
}
