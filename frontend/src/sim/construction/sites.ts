import { occupied } from "../contact";
import { cellIndex, getCell, inBounds, setCell } from "../grid";
import { type Point, samePoint } from "../geometry";
import { Material } from "../materials";
import { looseCellOpen } from "../support";
import { type World } from "../types";
import { JOB_KINDS, type JobKind, type ConstructionJob } from "./state";
import { removeWorkLandmarks } from "./history";
import { adultBodies } from "../adultBody";

export function supportedSite(world: World, point: Point): boolean {
  return (
    getCell(world.grid, point.x, point.y) === Material.AIR &&
    !looseCellOpen(world.grid, point.x, point.y - 1) &&
    !occupied(world, point)
  );
}

export function cacheAt(world: World, point: Point): number | null {
  for (const [id, cache] of world.caches) if (samePoint(cache, point)) return id;
  return null;
}

export function addCache(world: World, point: Point): number | null {
  if (!supportedSite(world, point)) return null;
  const id = world.construction.nextId--;
  world.caches.set(id, { x: point.x, y: point.y, capacity: world.config.cacheCapacity });
  setCell(world.grid, point.x, point.y, Material.CACHE);
  world.knowledge.locations.set(id, {
    x: point.x,
    y: point.y,
    id,
    kind: "cache",
    backed: world.grid.backing[cellIndex(world.grid, point.x, point.y)] !== 0,
    quantity: 0,
    observedAt: null,
  });
  return id;
}

export function retireCache(world: World, id: number): boolean {
  const cache = world.caches.get(id);
  if (!cache || (world.food.get(cellIndex(world.grid, cache.x, cache.y)) ?? 0) > 0) return false;
  setCell(world.grid, cache.x, cache.y, Material.AIR);
  world.caches.delete(id);
  world.knowledge.locations.delete(id);
  return true;
}

function validPoint(world: World, point: Point): boolean {
  return (
    Number.isInteger(point.x) && Number.isInteger(point.y) && inBounds(world.grid, point.x, point.y)
  );
}

/** Records work intent only; a worker must execute the physical actions. */
export function requestConstruction(
  world: World,
  kind: JobKind,
  point: Point,
  dump: Point,
  source: number | null = null,
  origin: ConstructionJob["origin"] = "manual"
): ConstructionJob {
  if (!JOB_KINDS.includes(kind) || !validPoint(world, point) || !validPoint(world, dump))
    throw new Error("Choose work and disposal cells inside the world");
  if (
    kind === "move-cache" &&
    (!world.caches.has(source!) || samePoint(world.caches.get(source!)!, point))
  )
    throw new Error("Choose an existing source cache and a different destination");
  const job: ConstructionJob = {
    origin,
    createdAt: world.tick,
    finishedAt: null,
    x: point.x,
    y: point.y,
    dump: { x: dump.x, y: dump.y },
    id: world.construction.nextId--,
    kind,
    source,
    owner: null,
    status: "pending",
    cacheId: null,
    spoilPending: false,
    recovery: null,
  };
  world.construction.jobs.push(job);
  for (const [id, site] of [
    [job.id, point],
    [world.construction.nextId--, dump],
  ] as const)
    world.knowledge.locations.set(id, {
      x: site.x,
      y: site.y,
      id,
      kind: "work",
      backed: false,
      quantity: 0,
      observedAt: null,
    });
  world.construction.interventions += Number(origin === "manual");
  return job;
}

export function cancelConstruction(world: World, id: number): void {
  const job = world.construction.jobs.find((entry) => entry.id === id);
  if (!job || ["done", "canceled"].includes(job.status)) return;
  job.status = "canceled";
  job.finishedAt = world.tick;
  removeWorkLandmarks(world, job);
  const ant = adultBodies(world).find((entry) => entry.id === job.owner);
  if (ant) {
    ant.job = null;
    ant.decision.route = null;
  }
  job.owner = null;
  world.construction.interventions++;
}
