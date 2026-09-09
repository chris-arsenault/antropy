import { type Ant, type World } from "../types";
import { type Request, type ActionResult } from "../colony/contract";
import { samePoint, stepFrom } from "../geometry";
import { cellIndex, getCell } from "../grid";
import { Material } from "../materials";
import { spend } from "../resources";
import { dig, depositSpoil, recoverSpoil } from "./excavation";
import { attachQueen, releaseQueen } from "./transport";
import { addCache, cacheAt, retireCache } from "./sites";
import { attachBrood, releaseBrood } from "./brood";
import { resolveProposal, abandonWork } from "./proposals";
import { removeWorkLandmarks } from "./history";

export const CONSTRUCTION_REQUESTS = [
  "claim",
  "finish",
  "dig",
  "deposit-spoil",
  "recover-spoil",
  "attach-queen",
  "release-queen",
  "create-cache",
  "retire-cache",
  "attach-brood",
  "release-brood",
  "propose",
  "abandon",
];

function claim(world: World, ant: Ant, request: Request): ActionResult {
  const job = world.construction.jobs.find((entry) => entry.id === request.destination);
  if (!job || job.status !== "pending" || ant.job !== null) return "blocked";
  if (ant.brood !== null) return "full";
  if (ant.cargo > 0 || ant.spoil !== null || world.queen.carrier === ant.id) return "full";
  job.owner = ant.id;
  job.status = "active";
  ant.job = job.id;
  ant.decision.route = null;
  return "success";
}

function finish(world: World, ant: Ant): ActionResult {
  const job = world.construction.jobs.find((entry) => entry.id === ant.job);
  if (
    !job ||
    ant.cargo > 0 ||
    ant.spoil !== null ||
    ant.brood !== null ||
    world.queen.carrier === ant.id
  )
    return "blocked";
  const complete = workComplete(world, job);
  if (!complete) return "blocked";
  job.status = "done";
  job.finishedAt = world.tick;
  world.construction.completed[job.kind]++;
  removeWorkLandmarks(world, job);
  job.owner = null;
  ant.job = null;
  ant.decision.route = null;
  return "success";
}

function workComplete(world: World, job: World["construction"]["jobs"][number]): boolean {
  return {
    dig: getCell(world.grid, job.x, job.y) === Material.AIR && !job.spoilPending,
    queen: world.queen.alive && samePoint(world.queen, job) && world.queen.carrier === null,
    cache: cacheAt(world, job) !== null,
    "move-cache": cacheAt(world, job) !== null && !world.caches.has(job.source!),
    brood: world.brood.some((brood) => brood.id === job.source && samePoint(brood, job)),
  }[job.kind];
}

function cacheAction(world: World, ant: Ant, request: Request): ActionResult {
  const target = stepFrom(ant, request.heading);
  if (request.kind === "retire-cache") {
    const id = cacheAt(world, target);
    return id !== null && retireCache(world, id) ? "success" : "blocked";
  }
  const id = addCache(world, target);
  if (id === null) return "blocked";
  const job = world.construction.jobs.find((entry) => entry.id === ant.job);
  if (job && samePoint(job, target)) job.cacheId = id;
  return "success";
}

export function resolveConstruction(world: World, ant: Ant, request: Request): ActionResult {
  if (ant.energy < world.config.constructionCost) return "empty";
  spend(world, ant, world.config.constructionCost);
  const point = stepFrom(ant, request.heading);
  if (request.kind === "propose") return resolveProposal(world, ant, request);
  if (request.kind === "abandon") return abandonWork(world, ant);
  return physicalWork(world, ant, request, point);
}

function physicalWork(
  world: World,
  ant: Ant,
  request: Request,
  point: { x: number; y: number }
): ActionResult {
  if (request.kind === "attach-brood") return attachBrood(world, ant, point);
  if (request.kind === "release-brood") return releaseBrood(world, ant, point);
  switch (request.kind) {
    case "claim":
      return claim(world, ant, request);
    case "finish":
      return finish(world, ant);
    case "dig":
      return dig(world, ant, point);
    case "deposit-spoil":
      return depositSpoil(world, ant, point);
    case "recover-spoil":
      return recoverSpoil(world, ant, point);
    case "attach-queen":
      return attachQueen(world, ant, point);
    case "release-queen":
      return releaseQueen(world, ant, point);
    default:
      return cacheAction(world, ant, request);
  }
}

export function sourceQuantity(world: World, source: number | null): number {
  const cache = world.caches.get(source!);
  return cache ? (world.food.get(cellIndex(world.grid, cache.x, cache.y)) ?? 0) : 0;
}
