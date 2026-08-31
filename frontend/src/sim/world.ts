import { createAnt, surfaceSpawnY, type Ant, type AntSpawn } from "./ant";
import { buildAntIndex } from "./antIndex";
import { tryDig, tryEat, depositPheromones } from "./actions";
import { affectedChunkKeys } from "./chunks";
import { braitenbergController } from "./controller/braitenberg";
import { type Controller } from "./controller/contract";
import { applyBasalDrain, applyStepCost, checkDeath, reapDead } from "./energy";
import { stepFoodGovernor } from "./foodSpawner";
import { getVoxel, setVoxel, voxelIndex, type VoxelGrid } from "./grid";
import { applyMotor } from "./locomotion";
import { Material, type MaterialId } from "./materials";
import { decodeOutputs } from "./motors";
import { createRng, type Rng, type RngState } from "./rng";
import { createScentField, emitFoodScent, stepScentField, type ScentField } from "./scent";
import { createInputBuffer, sense, type SenseContext } from "./senses";
import { generateTerrain } from "./terrain";
import { FOOD_GOVERNOR, SCENT } from "./tunables";

export interface World {
  readonly seed: number;
  tick: number;
  rng: Rng;
  grid: VoxelGrid;
  ants: Ant[];
  nextAntId: number;
  pheromoneA: ScentField;
  pheromoneB: ScentField;
  foodScent: ScentField;
  /** Voxel indices currently holding FOOD, maintained by mutateVoxel. */
  foodSources: Set<number>;
  /** FOOD voxels the governor sustains; a slow oscillation in Release 2. */
  foodTarget: number;
  /** The behavioral controller for every ant (design spec §2.3). */
  controller: Controller;
  /**
   * Change feed for the renderer: chunk keys whose voxels changed since the
   * last drain. Transient — rebuilt, never checkpointed.
   */
  dirtyChunks: Set<number>;
}

export interface WorldSnapshot {
  seed: number;
  tick: number;
  rngState: RngState;
}

export function createWorld(seed: number, controller: Controller = braitenbergController): World {
  const grid = generateTerrain(seed);
  return {
    seed,
    tick: 0,
    rng: createRng(seed),
    grid,
    ants: [],
    nextAntId: 1,
    pheromoneA: createScentField(grid),
    pheromoneB: createScentField(grid),
    foodScent: createScentField(grid),
    foodSources: new Set(),
    foodTarget: FOOD_GOVERNOR.targetCount,
    controller,
    dirtyChunks: new Set(),
  };
}

export function spawnAnt(world: World, spawn: AntSpawn): Ant {
  const ant = createAnt(world.nextAntId, spawn);
  world.nextAntId += 1;
  world.ants.push(ant);
  return ant;
}

/** Spawn surface foragers with founder genomes from the world's controller. */
export function populateForagers(world: World, count: number): void {
  for (let i = 0; i < count; i++) {
    const x = 8 + Math.floor(world.rng.next() * (world.grid.sizeX - 16));
    const z = 8 + Math.floor(world.rng.next() * (world.grid.sizeZ - 16));
    const y = surfaceSpawnY(world.grid, x, z);
    if (y === null) {
      continue;
    }
    spawnAnt(world, {
      x,
      y,
      z,
      heading: world.rng.next() * Math.PI * 2,
      energy: 1,
      lineageId: 0,
      patrilineId: 0,
      motherId: 0,
      fatherId: 0,
      genome: world.controller.seed(world.rng),
      controllerState: world.controller.createState(),
    });
  }
}

function stepScents(world: World): void {
  emitFoodScent(world.grid, world.foodScent, world.foodSources);
  stepScentField(world.grid, world.pheromoneA);
  stepScentField(world.grid, world.pheromoneB);
  stepScentField(world.grid, world.foodScent);
}

function stepAnt(world: World, ctx: SenseContext, inputs: Float32Array, ant: Ant): void {
  ant.age += 1;
  sense(ctx, ant, inputs);
  const { outputs, thinkCost } = world.controller.act(ant.genome, inputs, ant.controllerState);
  const actions = decodeOutputs(outputs);

  applyMotor(world.grid, ant, actions.motor);
  if (actions.eat) {
    tryEat(world, ant);
  }
  if (actions.dig) {
    tryDig(world, ant);
  }
  depositPheromones(world, ant, actions.pheromoneA, actions.pheromoneB);

  applyBasalDrain(ant, thinkCost);
  applyStepCost(ant);
  checkDeath(world, ant);
}

/**
 * Advance the world by exactly one fixed timestep. System order is fixed and
 * load-bearing for determinism: scents, food governor, then ants in array
 * order, then reaping.
 */
export function stepWorld(world: World): void {
  world.tick += 1;
  if (world.tick % SCENT.stepInterval === 0) {
    stepScents(world);
  }
  if (world.tick % FOOD_GOVERNOR.interval === 0) {
    stepFoodGovernor(world);
  }

  const ctx: SenseContext = {
    grid: world.grid,
    pheromoneA: world.pheromoneA,
    pheromoneB: world.pheromoneB,
    foodScent: world.foodScent,
    antIndex: buildAntIndex(world.grid, world.ants),
  };
  const inputs = createInputBuffer();
  for (const ant of world.ants) {
    if (ant.alive) {
      stepAnt(world, ctx, inputs, ant);
    }
  }
  reapDead(world);
}

/** The canonical voxel mutation path: writes the grid and feeds the renderer. */
export function mutateVoxel(
  world: World,
  x: number,
  y: number,
  z: number,
  material: MaterialId
): void {
  const index = voxelIndex(world.grid, x, y, z);
  const previous = getVoxel(world.grid, x, y, z);
  setVoxel(world.grid, x, y, z, material);
  if (previous === Material.FOOD) {
    world.foodSources.delete(index);
  }
  if (material === Material.FOOD) {
    world.foodSources.add(index);
  }
  for (const key of affectedChunkKeys(x, y, z)) {
    world.dirtyChunks.add(key);
  }
}

export function snapshotWorld(world: World): WorldSnapshot {
  return {
    seed: world.seed,
    tick: world.tick,
    rngState: world.rng.getState(),
  };
}
