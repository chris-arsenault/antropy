import { type Ant, type World } from "../types";
import { adultBodies } from "../adultBody";
import { type Request } from "../colony/contract";
import { samePoint, stepFrom } from "../geometry";
import { localClimate } from "../climate/state";
import { availableSites, distance, type SiteObservation } from "./habitat";
import { JOB_KINDS } from "./state";
import { proposalReserved } from "./reservations";
import { observeSpace, SPACE_FEATURE_NAMES } from "./spaceObservation";

export const PRESSURE_FEATURE_NAMES = [
  "autonomous",
  "proposalKind",
  "siteTemperature",
  "siteMoisture",
  "siteSolid",
  "siteWork",
  "siteFloor",
  "siteOccupied",
  "siteFood",
  "siteDistance",
  "siteQueenDistance",
  "siteTraffic",
  "dumpDistance",
  "dumpBacked",
  "dumpTraffic",
  "dumpQueenDistance",
  "sameDump",
  "sourceTemperature",
  "sourceMoisture",
  "sourceDistance",
  "sourceFood",
  "sourceAge",
  "nurseryFree",
  "nurseryBrood",
  "storageFill",
  "siteReserved",
  "recentRelocation",
  "carryingBrood",
  "localBrood",
  "jobBroodPlaced",
  "jobAge",
  "localTemperature",
  "localMoisture",
  "sourceQueenDistance",
  "excavationEnabled",
  "knownSite",
  "knownCareNeed",
  "siteBacked",
  "siteSupportingBody",
  "siteBroodNeighbors",
  ...SPACE_FEATURE_NAMES,
] as const;

function sourceSite(
  world: World,
  request: Request,
  sites: SiteObservation[]
): SiteObservation | undefined {
  const kind = request.proposal?.kind,
    source = request.proposal?.source;
  if (kind === "brood") return sites.find((site) => site.brood === source);
  const point = world.knowledge.locations.get(kind === "move-cache" ? source! : -2);
  return point && sites.find((site) => samePoint(point, site));
}

function colonyCounts(
  world: World,
  sites: SiteObservation[],
  usable: (site: SiteObservation) => boolean
): number[] {
  const nursery = sites.filter((site) => queenDistance(world, site) <= 4);
  const caches = [...world.knowledge.locations.values()].filter((site) => site.kind === "cache");
  const planned = world.construction.jobs.filter(
    (job) =>
      job.kind === "cache" && job.cacheId === null && ["pending", "active"].includes(job.status)
  ).length;
  const fill =
    caches.reduce((total, site) => total + site.quantity, 0) /
    Math.max(1, (caches.length + planned) * world.config.cacheCapacity);
  return [
    nursery.filter(usable).length,
    nursery.filter((site) => site.brood !== null).length,
    fill,
  ];
}

function siteInputs(world: World, ant: Ant, site: SiteObservation | undefined): number[] {
  if (!site) return [24, 0.65, 0, 0, 0, 0, 0, 0, 0, 0];
  return [
    site.temperature,
    site.moisture,
    site.material,
    site.work,
    Number(site.supported),
    Number(site.occupied),
    site.food,
    distance(site, ant),
    queenDistance(world, site),
    site.traffic,
  ];
}

function dumpInputs(
  world: World,
  site: SiteObservation | undefined,
  dump: SiteObservation | undefined
): number[] {
  if (!site || !dump) return [0, 0, 0, 0, 0];
  return [
    distance(site, dump),
    Number(dump.backed),
    dump.traffic,
    queenDistance(world, dump),
    Number(site.id === dump.id),
  ];
}

function sourceInputs(
  world: World,
  site: SiteObservation | undefined,
  source: SiteObservation | undefined
): number[] {
  if (!source || !site) return [24, 0.65, 0, 0, world.config.knowledgeDuration];
  return [
    source.temperature,
    source.moisture,
    distance(source, site),
    source.food,
    world.tick - source.tick,
  ];
}

function reservationInputs(
  world: World,
  request: Request,
  site: SiteObservation | undefined
): number[] {
  const recent = world.construction.jobs.some(
    (entry) =>
      entry.kind === request.proposal?.kind &&
      entry.source === request.proposal?.source &&
      (["queen", "brood", "move-cache"].includes(entry.kind) ||
        (!!site && distance(entry, site) < 3)) &&
      entry.finishedAt !== null &&
      world.tick - entry.finishedAt < 512
  );
  const dump = world.habitat.sites.get(request.proposal?.dump ?? 0);
  const reserved =
    request.proposal && site && dump && proposalReserved(world, request.proposal, site, dump);
  return [Number(!!reserved), Number(recent)];
}

function bodyInputs(world: World, ant: Ant, request: Request): number[] {
  const job = world.construction.jobs.find((entry) => entry.id === ant.job);
  const body = world.brood.find((brood) => samePoint(brood, stepFrom(ant, request.heading)));
  const placed =
    job?.kind === "brood" &&
    ant.brood === null &&
    world.brood.some((brood) => brood.id === job.source && samePoint(brood, job));
  return [
    Number(ant.brood !== null),
    Number(!!body && !adultBodies(world).some((worker) => worker.brood === body.id)),
    Number(placed),
    job ? world.tick - job.createdAt : 0,
  ];
}

export function observePressures(world: World, ant: Ant): (request: Request) => number[] {
  const sites = availableSites(world),
    space = observeSpace(world, sites),
    counts = colonyCounts(world, sites, space.nursery);
  const local = localClimate(world, ant);
  const sources = new Map<string, SiteObservation | undefined>();
  const need = knownCareNeed(world);
  const supporting = new Set(
    sites
      .filter((site) => site.queen || site.brood !== null)
      .map((site) => site.id + world.grid.width)
  );
  const bodies = Array.from({ length: 8 }, (_, heading) =>
    bodyInputs(world, ant, { kind: "wait", heading, destination: null, task: null, proposal: null })
  );
  return (request) => {
    const key = `${request.proposal?.kind}:${request.proposal?.source}`;
    if (!sources.has(key)) sources.set(key, sourceSite(world, request, sites));
    return [
      ...pressureInputs(world, ant, request, sources.get(key), counts, local, bodies, need),
      Number(supporting.has(request.destination!)),
      broodNeighbors(world, request, sites),
      ...space.inputs(world.habitat.sites.get(request.destination!)),
    ];
  };
}

/** Aggregation uses sightings of bodies, never remote ant intentions or a room assignment. */
function broodNeighbors(world: World, request: Request, sites: SiteObservation[]): number {
  const target = world.habitat.sites.get(request.destination!);
  if (!target || request.proposal?.kind !== "brood") return 0;
  return sites.filter(
    (site) =>
      site.brood !== null &&
      site.brood !== request.proposal?.source &&
      Math.abs(site.y - target.y) <= 1 &&
      distance(site, target) <= 3
  ).length;
}

function pressureInputs(
  world: World,
  ant: Ant,
  request: Request,
  source: SiteObservation | undefined,
  counts: number[],
  local: { temperature: number; moisture: number },
  bodies: number[][],
  need: number
): number[] {
  const site = world.habitat.sites.get(request.destination!);
  const dump = world.habitat.sites.get(request.proposal?.dump ?? 0);
  return [
    Number(world.config.environment.autonomousConstruction),
    request.proposal ? JOB_KINDS.indexOf(request.proposal.kind) + 1 : 0,
    ...siteInputs(world, ant, site),
    ...dumpInputs(world, site, dump),
    ...sourceInputs(world, site, source),
    ...counts,
    ...reservationInputs(world, request, site),
    ...bodies[request.heading],
    local.temperature,
    local.moisture,
    source ? queenDistance(world, source) : 0,
    Number(world.config.environment.excavation),
    Number(!!site),
    need,
    Number(site?.backed ?? false),
  ];
}

function knownCareNeed(world: World): number {
  let need = 0;
  for (const location of world.knowledge.locations.values())
    if (
      ["queen", "care"].includes(location.kind) &&
      location.observedAt !== null &&
      world.tick - location.observedAt < 512
    )
      need += location.quantity;
  return need;
}

function queenDistance(world: World, site: SiteObservation): number {
  const queen = world.knowledge.locations.get(-2);
  return queen ? distance(site, queen) : world.grid.width + world.grid.height;
}
