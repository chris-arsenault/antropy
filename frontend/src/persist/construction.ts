import { type World, type Cache } from "../sim/types";
import { type ConstructionState, JOB_KINDS } from "../sim/construction/state";
import { diggable } from "../sim/construction/excavation";
import { type Checkpoint2D } from "./checkpoint";
import { type Material } from "../sim/materials";
import { MATERIALS } from "../sim/materials";
import { adultBodies } from "../sim/adultBody";

export type ConstructionCheckpoint = Omit<ConstructionState, "excavation" | "loose"> & {
  excavation: [number, number][];
  loose: [number, Material[]][];
  caches: [number, Cache][];
};
export function constructionCheckpoint(world: World): ConstructionCheckpoint {
  return structuredClone({
    ...world.construction,
    excavation: [...world.construction.excavation],
    loose: [...world.construction.loose],
    caches: [...world.caches],
  });
}
export function restoreConstruction(world: World, record: ConstructionCheckpoint): void {
  const { caches, excavation, loose, ...rest } = structuredClone(record);
  world.construction = { ...rest, excavation: new Map(excavation), loose: new Map(loose) };
  world.caches = new Map(
    caches.map(([id, cache]) => [id, id === -3 ? Object.assign(world.cache, cache) : cache])
  );
}

function position(c: Checkpoint2D, p: { x: number; y: number }): boolean {
  return (
    !!p &&
    Number.isSafeInteger(p.x) &&
    Number.isSafeInteger(p.y) &&
    p.x >= 0 &&
    p.y >= 0 &&
    p.x < c.config.width &&
    p.y < c.config.height
  );
}
function validIndex(c: Checkpoint2D, index: number): boolean {
  return Number.isSafeInteger(index) && index >= 0 && index < c.grid.length;
}

function validateCaches(c: Checkpoint2D): void {
  const ids = new Set<number>(),
    cells = new Set<number>();
  for (const [id, cache] of c.construction.caches) {
    const index = cache.y * c.config.width + cache.x;
    if (
      !Number.isSafeInteger(id) ||
      ids.has(id) ||
      cells.has(index) ||
      !position(c, cache) ||
      cache.capacity !== c.config.cacheCapacity ||
      c.grid[index] !== 4 ||
      !cacheLandmark(c, id, cache)
    )
      throw new Error("invalid checkpoint cache");
    ids.add(id);
    cells.add(index);
  }
}

function cacheLandmark(c: Checkpoint2D, id: number, cache: Cache): boolean {
  const location = c.knowledge.locations.find((entry) => entry.id === id);
  return location?.kind === "cache" && location.x === cache.x && location.y === cache.y;
}

function validateJobs(c: Checkpoint2D): void {
  const ids = new Set<number>();
  for (const job of c.construction.jobs) {
    if (
      !Number.isSafeInteger(job.id) ||
      ids.has(job.id) ||
      !JOB_KINDS.includes(job.kind) ||
      !position(c, job) ||
      !position(c, job.dump) ||
      !["pending", "active", "done", "canceled"].includes(job.status)
    )
      throw new Error("invalid checkpoint construction request");
    validateOwner(c, job);
    ids.add(job.id);
  }
  if (
    [...ids, ...c.construction.caches.map(([id]) => id)].some((id) => id <= c.construction.nextId)
  )
    throw new Error("invalid checkpoint construction identity");
}

function validateOwner(c: Checkpoint2D, job: ConstructionState["jobs"][number]): void {
  validateJobClock(c, job);
  if (
    typeof job.spoilPending !== "boolean" ||
    ![job.source, job.cacheId, job.recovery].every((id) => id === null || Number.isSafeInteger(id))
  )
    throw new Error("invalid checkpoint construction reference");
  const owner = adultBodies(c).find((ant) => ant.id === job.owner);
  if (
    (job.status === "active") !== (job.owner !== null) ||
    (job.owner !== null && owner?.job !== job.id)
  )
    throw new Error("invalid checkpoint work owner");
}

function validateJobClock(c: Checkpoint2D, job: ConstructionState["jobs"][number]): void {
  if (
    !["manual", "controller"].includes(job.origin) ||
    !Number.isSafeInteger(job.createdAt) ||
    job.createdAt < 0 ||
    job.createdAt > c.tick
  )
    throw new Error("invalid checkpoint work provenance");
  if (
    job.finishedAt !== null &&
    (!Number.isSafeInteger(job.finishedAt) ||
      job.finishedAt < job.createdAt ||
      job.finishedAt > c.tick)
  )
    throw new Error("invalid checkpoint work completion time");
  if (["done", "canceled"].includes(job.status) !== (job.finishedAt !== null))
    throw new Error("checkpoint work completion and status disagree");
}

function validateLoads(c: Checkpoint2D): void {
  for (const ant of adultBodies(c)) {
    validateBroodLoad(c, ant);
    if (ant.spoil !== null && (!diggable(ant.spoil) || ant.cargo > 0))
      throw new Error("invalid checkpoint spoil load");
    if (
      ant.job !== null &&
      !c.construction.jobs.some((job) => job.id === ant.job && job.owner === ant.id)
    )
      throw new Error("invalid checkpoint worker claim");
  }
  validateCarrier(c);
}

function validateCarrier(c: Checkpoint2D): void {
  const queen = c.queen;
  if (queen.carrier === null) return;
  const carrier = c.ants.find((ant) => ant.id === queen.carrier);
  if (
    !queen.alive ||
    !carrier ||
    carrier.x !== queen.x ||
    carrier.y !== queen.y ||
    carrier.cargo > 0 ||
    carrier.brood !== null ||
    [carrier.spoil, queen.brood, queen.spoil].some((load) => load !== null)
  )
    throw new Error("invalid checkpoint queen carrier");
}

function validateBroodLoad(c: Checkpoint2D, ant: Checkpoint2D["ants"][number]): void {
  if (ant.brood === null) return;
  const brood = c.brood.find((body) => body.id === ant.brood);
  if (
    !brood ||
    brood.x !== ant.x ||
    brood.y !== ant.y ||
    ant.cargo > 0 ||
    ant.spoil !== null ||
    c.queen.carrier === ant.id ||
    adultBodies(c).filter((worker) => worker.brood === ant.brood).length !== 1
  )
    throw new Error("invalid checkpoint brood carrier");
}

function validateMaterial(c: Checkpoint2D): void {
  const record = c.construction;
  if (
    [record.excavation, record.loose].some(
      (entries) => new Set(entries.map(([id]) => id)).size !== entries.length
    )
  )
    throw new Error("duplicate checkpoint material cell");
  validateExcavation(c);
  validateLoose(c);
  const loose = record.loose.reduce((sum, [, pile]) => sum + pile.length, 0);
  if (
    record.excavated - record.deposited !==
    loose + adultBodies(c).filter((ant) => ant.spoil !== null).length
  )
    throw new Error("checkpoint spoil ledger does not conserve material");
}

function validateExcavation(c: Checkpoint2D): void {
  for (const [index, work] of c.construction.excavation)
    if (
      !validIndex(c, index) ||
      !diggable(c.grid[index]) ||
      !Number.isFinite(work) ||
      work <= 0 ||
      work >= MATERIALS[c.grid[index] as Material].excavationWork
    )
      throw new Error("invalid checkpoint excavation");
}

function validateLoose(c: Checkpoint2D): void {
  for (const [index, pile] of c.construction.loose)
    if (!validIndex(c, index) || !Array.isArray(pile) || !pile.length || !pile.every(diggable))
      throw new Error("invalid checkpoint loose spoil");
}

export function validateConstruction(c: Checkpoint2D): void {
  const record = c.construction;
  if (
    !record ||
    !record.completed ||
    !JOB_KINDS.every(
      (kind) => Number.isSafeInteger(record.completed[kind]) && record.completed[kind] >= 0
    ) ||
    ![record.jobs, record.caches, record.excavation, record.loose].every(Array.isArray) ||
    !Number.isSafeInteger(record.nextId) ||
    record.nextId > -1000 ||
    ![
      record.initialNestArea,
      record.excavated,
      record.deposited,
      record.queenMoves,
      record.interventions,
    ].every((v) => Number.isSafeInteger(v) && v >= 0)
  )
    throw new Error("invalid checkpoint construction state");
  validateCaches(c);
  validateJobs(c);
  validateLoads(c);
  validateMaterial(c);
}
