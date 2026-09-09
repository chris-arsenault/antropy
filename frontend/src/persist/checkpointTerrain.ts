import { MATERIALS } from "../sim/materials";
import { type World, type Nest, type Cache } from "../sim/types";
import { invalidateTerrain } from "../sim/terrain";
import { createGrid } from "../sim/grid";
import { type SimConfig } from "../sim/config";
import { validateConfig } from "../sim/configValidation";
import { type BuiltEnvironment } from "../sim/nest";

export interface TerrainCheckpoint {
  readonly backing: number[];
  readonly revision: number;
  readonly nest: Nest;
  readonly cache: Cache;
}

export function terrainCheckpoint(world: World): TerrainCheckpoint {
  return {
    backing: [...world.grid.backing],
    revision: world.grid.revision,
    nest: structuredClone(world.nest),
    cache: { ...world.cache },
  };
}

function validMaterials(values: number[], length: number): boolean {
  return (
    Array.isArray(values) &&
    values.length === length &&
    values.every(
      (value) => Number.isInteger(value) && Object.prototype.hasOwnProperty.call(MATERIALS, value)
    )
  );
}

function validateNest(world: Pick<World, "grid">, terrain: TerrainCheckpoint): void {
  if (!terrain.nest?.chambers?.length || !terrain.nest.passages?.length || !terrain.cache)
    throw new Error("missing checkpoint nest geometry");
  const points = [
    terrain.cache,
    terrain.nest.entrance,
    terrain.nest.home,
    terrain.nest.start,
    ...terrain.nest.primaryRoute,
    ...terrain.nest.chambers.map((room) => room.center),
    ...terrain.nest.junctions.map((junction) => junction.point),
    ...terrain.nest.passages.flatMap((passage) => passage.points),
  ];
  if (
    !points.every(
      (point) =>
        point &&
        Number.isInteger(point.x) &&
        Number.isInteger(point.y) &&
        point.x >= 0 &&
        point.y >= 0 &&
        point.x < world.grid.width &&
        point.y < world.grid.height
    )
  )
    throw new Error("invalid checkpoint nest position");
}

export function restoreTerrain(
  world: Pick<World, "grid" | "nest" | "cache">,
  cells: number[],
  terrain: TerrainCheckpoint
): void {
  const size = world.grid.cells.length;
  if (!terrain || !validMaterials(cells, size) || !validMaterials(terrain.backing, size))
    throw new Error("invalid checkpoint cell materials");
  if (!Number.isSafeInteger(terrain.revision) || terrain.revision < 0)
    throw new Error("invalid terrain revision");
  validateNest(world, terrain);
  world.grid.cells.set(cells);
  world.grid.backing.set(terrain.backing);
  world.grid.revision = terrain.revision;
  invalidateTerrain(world.grid);
  Object.assign(world.nest, structuredClone(terrain.nest));
  Object.assign(world.cache, terrain.cache);
}

export function checkpointEnvironment(
  config: SimConfig,
  cells: number[],
  terrain: TerrainCheckpoint
): BuiltEnvironment {
  validateConfig(config);
  if (
    !terrain ||
    !Number.isSafeInteger(config.width) ||
    !Number.isSafeInteger(config.height) ||
    config.width <= 0 ||
    config.height <= 0 ||
    cells.length !== config.width * config.height
  )
    throw new Error("invalid checkpoint grid dimensions");
  const environment = {
    grid: createGrid(config.width, config.height, config.environment.support),
    nest: structuredClone(terrain.nest),
    cache: { ...terrain.cache },
    foodSources: new Set<number>(),
  };
  restoreTerrain(environment, cells, terrain);
  return environment;
}
