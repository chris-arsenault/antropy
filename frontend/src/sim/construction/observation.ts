import { type Ant, type World } from "../types";
import { type Request, WAIT } from "../colony/contract";
import { cellIndex, getCell } from "../grid";
import { samePoint, stepFrom } from "../geometry";
import { cacheAt, supportedSite } from "./sites";
import { canDepositSpoil, diggable } from "./excavation";
import { JOB_KINDS, type ConstructionJob } from "./state";
import { type Point } from "../geometry";
import { broodLandmark } from "./brood";

function sourceIdentity(job: ConstructionJob): number | null {
  if (job.kind === "queen") return -2;
  if (job.kind === "brood") return broodLandmark(job.source!);
  return job.kind === "dig" ? job.recovery : job.source;
}

function routeRole(job: ConstructionJob | undefined, id: number | null | undefined): number {
  if (!job || id === null || id === undefined) return 0;
  if (id === job.id) return 1;
  if (id === job.id - 1) return 2;
  const sourceId = sourceIdentity(job);
  return id === sourceId ? 3 : 0;
}

function localInputs(world: World, ant: Ant, point: Point): number[] {
  return [
    Number(world.queen.carrier === ant.id),
    Number(ant.spoil !== null),
    Number(diggable(getCell(world.grid, point.x, point.y))),
    Number(canDepositSpoil(world, point)),
    Number(supportedSite(world, point)),
    Number(world.queen.alive && world.queen.carrier === null && samePoint(world.queen, point)),
  ];
}

function jobInputs(world: World, job: ConstructionJob | undefined, point: Point): number[] {
  if (!job) return [0, 0, 0, 0, 0, 0];
  const source = world.knowledge.locations.get(sourceIdentity(job)!);
  const atSource = !!source && samePoint(source, point);
  return [
    Number(samePoint(job, point)),
    Number(samePoint(job.dump, point)),
    Number(atSource),
    Number(cacheAt(world, job) !== null),
    Number(!!source),
    Number(atSource && (world.food.get(cellIndex(world.grid, point.x, point.y)) ?? 0) === 0),
  ];
}

function completionInputs(world: World, job: ConstructionJob | undefined): number[] {
  if (!job) return [0, 0];
  return [
    Number(getCell(world.grid, job.x, job.y) === 0 && !job.spoilPending),
    Number(world.queen.carrier === null && samePoint(world.queen, job)),
  ];
}

export const WORK_FEATURE_NAMES = [
  "workKind",
  "workOwner",
  "workAvailable",
  "workSite",
  "workDump",
  "workSource",
  "siteExists",
  "sourceExists",
  "sourceLocalEmpty",
  "carryingQueen",
  "spoil",
  "diggable",
  "spoilSite",
  "supportedSite",
  "localQueen",
  "jobCleared",
  "jobQueenPlaced",
  "localLoose",
  "routeRole",
  "targetRole",
] as const;

export function constructionRequests(world: World): Request[] {
  const claims = world.construction.jobs
    .filter((job) => job.status === "pending")
    .map((job) => ({ ...WAIT, kind: "claim" as const, destination: job.id }));
  const local = Array.from({ length: 8 }, (_, heading) =>
    (
      [
        "dig",
        "deposit-spoil",
        "recover-spoil",
        "attach-queen",
        "release-queen",
        "create-cache",
        "retire-cache",
        "attach-brood",
        "release-brood",
      ] as const
    ).map((kind) => ({ ...WAIT, kind, heading }))
  ).flat();
  return [...claims, ...local, { ...WAIT, kind: "finish" }, { ...WAIT, kind: "abandon" }];
}

export function observeWork(world: World, ant: Ant): (request: Request) => number[] {
  const job = world.construction.jobs.find((entry) => entry.id === ant.job);
  const contacts = Array.from({ length: 8 }, (_, heading) => {
    const point = stepFrom(ant, heading),
      index = cellIndex(world.grid, point.x, point.y);
    return [
      ...jobInputs(world, job, point),
      ...localInputs(world, ant, point),
      ...completionInputs(world, job),
      world.construction.loose.get(index)?.length ?? 0,
    ];
  });
  const pending = new Set(
    world.construction.jobs.filter((entry) => entry.status === "pending").map((entry) => entry.id)
  );
  const role = routeRole(job, ant.decision.route?.destination);
  return (request) => [
    job ? JOB_KINDS.indexOf(job.kind) + 1 : 0,
    Number(!!job),
    Number(ant.job === null && pending.has(request.destination!)),
    ...contacts[request.heading],
    role,
    routeRole(job, request.destination),
  ];
}
