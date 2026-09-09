import { validateGeneration } from "./generationValidation";
import { makeTerrain, placeTerrainFood } from "./terrainGeneration";
import { layoutSpecs } from "./nestLayouts";
import { isWalkable } from "./terrain";
import { type SimConfig } from "./config";
import { cellIndex, createGrid, pointAt, setCell, type Grid } from "./grid";
import { DIRECTIONS, samePoint, type Point } from "./geometry";
import { Material } from "./materials";
import { type RandomState } from "./random";
import { type Cache, type Chamber, type Junction, type Nest, type Passage } from "./types";
import { supportedPlacement } from "./support";

export interface BuiltEnvironment {
  readonly grid: Grid;
  readonly nest: Nest;
  readonly cache: Cache;
  readonly foodSources: Set<number>;
}

function rasterLine(from: Point, to: Point): Point[] {
  const points: Point[] = [];
  const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
  for (let step = 0; step <= steps; step++) {
    const fraction = steps === 0 ? 0 : step / steps;
    const point = {
      x: Math.round(from.x + (to.x - from.x) * fraction),
      y: Math.round(from.y + (to.y - from.y) * fraction),
    };
    if (!points.some((existing) => samePoint(existing, point))) points.push(point);
  }
  return points;
}

function carveDisk(grid: Grid, center: Point, radius: Point): void {
  for (let dy = -radius.y; dy <= radius.y; dy++) {
    for (let dx = -radius.x; dx <= radius.x; dx++) {
      const distance = (dx * dx) / (radius.x * radius.x) + (dy * dy) / (radius.y * radius.y);
      if (distance <= 1) setCell(grid, center.x + dx, center.y + dy, Material.AIR);
    }
  }
}

function passagePoints(from: Point, to: Point, index: number): Point[] {
  const bend = index % 2 === 0 ? 1 : -1;
  return [
    from,
    {
      x: Math.round((from.x + to.x) / 2) + bend * (3 + (index % 4)),
      y: Math.round((from.y + to.y) / 2) + bend * (index % 3),
    },
    to,
  ];
}

function carvePassage(grid: Grid, points: readonly Point[]): void {
  for (let index = 1; index < points.length; index++) {
    for (const point of rasterLine(points[index - 1], points[index])) {
      carveDisk(grid, point, { x: 1, y: 1 });
    }
  }
}

function cacheStart(grid: Grid, cache: Point): Point {
  const point = DIRECTIONS.map((d) => ({ x: cache.x + d.x, y: cache.y + d.y })).find((p) =>
    isWalkable(grid, p.x, p.y)
  );
  if (!point) throw new Error("cache has no accessible founder position");
  return point;
}

function makeNest(grid: Grid, surface: Int16Array, config: SimConfig): Omit<Nest, "primaryRoute"> {
  const centerX = Math.floor(config.width / 2);
  const datum = surface[centerX];
  const entrance = { x: centerX, y: datum + 1 };
  const {
    chambers: chamberSpecs,
    junctions: junctionSpecs,
    passages: passageSpecs,
  } = layoutSpecs(config.environment.nestShape, config.nestSeed);
  const chambers: Chamber[] = chamberSpecs.map((spec) => ({
    id: spec.id,
    role: spec.role,
    center: { x: centerX + spec.dx, y: datum - spec.depth },
    radius: { x: spec.rx, y: spec.ry },
  }));
  const junctions: Junction[] = junctionSpecs.map((spec) => ({
    id: spec.id,
    point: { x: centerX + spec.dx, y: datum - spec.depth },
  }));
  const nodes = new Map<string, Point>([["entrance", entrance]]);
  for (const chamber of chambers) nodes.set(chamber.id, chamber.center);
  for (const junction of junctions) nodes.set(junction.id, junction.point);
  const passages: Passage[] = passageSpecs.map(([from, to], index) => ({
    from,
    to,
    points: passagePoints(nodes.get(from) as Point, nodes.get(to) as Point, index),
  }));
  for (const chamber of chambers) carveDisk(grid, chamber.center, chamber.radius);
  for (const passage of passages) carvePassage(grid, passage.points);
  const place = (point: Point) =>
    config.environment.gravity ? supportedPlacement(grid, point) : point;
  const home = place(nodes.get("queen-chamber") as Point);
  const cache = place(nodes.get("lower-west-food") as Point);
  return {
    entrance,
    home,
    start: cacheStart(grid, cache),
    chambers,
    junctions,
    passages,
  };
}

function enqueueRouteNeighbors(
  grid: Grid,
  current: number,
  parent: Int32Array,
  queue: Int32Array,
  write: number
): number {
  const point = pointAt(grid, current);
  let nextWrite = write;
  for (const direction of DIRECTIONS) {
    const x = point.x + direction.x;
    const y = point.y + direction.y;
    if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) continue;
    if (!isWalkable(grid, x, y)) continue;
    const next = cellIndex(grid, x, y);
    if (parent[next] !== -1) continue;
    parent[next] = current;
    queue[nextWrite++] = next;
  }
  return nextWrite;
}

function reconstructRoute(grid: Grid, parent: Int32Array, start: number, goal: number): Point[] {
  if (parent[goal] === -1) throw new Error("authored nest route is disconnected");
  const reversed: Point[] = [];
  for (let cursor = goal; cursor !== start; cursor = parent[cursor]) {
    reversed.push(pointAt(grid, cursor));
  }
  reversed.push(pointAt(grid, start));
  return reversed.reverse();
}

function traceRoute(grid: Grid, from: Point, to: Point): Point[] {
  const start = cellIndex(grid, from.x, from.y);
  const goal = cellIndex(grid, to.x, to.y);
  const parent = new Int32Array(grid.cells.length).fill(-1);
  const queue = new Int32Array(grid.cells.length);
  parent[start] = start;
  queue[0] = start;
  let read = 0;
  let write = 1;
  while (read < write && parent[goal] === -1) {
    const current = queue[read++];
    write = enqueueRouteNeighbors(grid, current, parent, queue, write);
  }
  return reconstructRoute(grid, parent, start, goal);
}

export function buildEnvironment(config: SimConfig, random: RandomState): BuiltEnvironment {
  validateGeneration(config);
  const grid = createGrid(config.width, config.height, config.environment.support);
  const surface = makeTerrain(grid, config, random.value);
  const partialNest = makeNest(grid, surface, config);
  const primaryRoute = traceRoute(grid, partialNest.start, partialNest.entrance);
  const nest: Nest = { ...partialNest, primaryRoute };
  const cacheChamber = nest.chambers.find((chamber) => chamber.id === "lower-west-food");
  if (!cacheChamber) throw new Error("authored nest is missing its food chamber");
  const cache: Cache = {
    ...(config.environment.gravity
      ? supportedPlacement(grid, cacheChamber.center)
      : cacheChamber.center),
    capacity: config.cacheCapacity,
  };
  setCell(grid, cache.x, cache.y, Material.CACHE);
  const foodSources = placeTerrainFood(grid, surface, nest.entrance, config, random);
  return { grid, nest, cache, foodSources };
}
