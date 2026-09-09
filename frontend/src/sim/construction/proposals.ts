import { type Ant, type World } from "../types";
import { type Request, WAIT, type ActionResult } from "../colony/contract";
import { type SiteObservation, availableSites, distance } from "./habitat";
import { requestConstruction } from "./sites";
import { JOB_KINDS } from "./state";
import { removeWorkLandmarks } from "./history";
import { proposalReserved } from "./reservations";

/** Bounded enumeration by distance and rotating memory order, without a suitability ranking. */
function sampleSites(world: World, ant: Ant, sites: SiteObservation[]): SiteObservation[] {
  const queen = world.knowledge.locations.get(-2)!;
  const near = [...sites].sort((a, b) => distance(a, ant) - distance(b, ant)).slice(0, 8);
  const nursery = [...sites].sort((a, b) => distance(a, queen) - distance(b, queen)).slice(0, 8);
  const start = (Math.floor(world.tick / 32) * 13 + ant.id * 7) % Math.max(1, sites.length);
  const sampled = Array.from(
    { length: Math.min(8, sites.length) },
    (_, i) => sites[(start + i) % sites.length]
  );
  return [...new Map([...near, ...nursery, ...sampled].map((site) => [site.id, site])).values()];
}

export function proposalRequests(world: World, ant: Ant): Request[] {
  if (!world.config.environment.autonomousConstruction || ant.job !== null) return [];
  if (carrying(world, ant)) return [];
  const sites = availableSites(world),
    sampled = sampleSites(world, ant, sites);
  const dumps = sites.filter((s) => s.supported && s.material === 0 && !s.occupied && s.food === 0);
  const offset = (Math.floor(world.tick / 16) * 3 + ant.id * 7) % Math.max(1, dumps.length);
  const disposal = dumps.slice(offset, offset + 2).concat(dumps.slice(0, 2));
  const sources = [...world.caches.keys()];
  const brood = sites.filter((site) => site.brood !== null);
  return sampled.flatMap((site) => {
    const request = (
      kind: (typeof JOB_KINDS)[number],
      dump: number,
      source: number | null
    ): Request => ({
      ...WAIT,
      kind: "propose",
      destination: site.id,
      proposal: { kind, dump, source },
    });
    return [
      ...disposal.map((dump) => request("dig", dump.id, null)),
      request("queen", site.id, null),
      request("cache", site.id, null),
      ...sources.map((source) => request("move-cache", site.id, source)),
      ...brood.slice(0, 4).map((source) => request("brood", site.id, source.brood)),
    ];
  });
}

export function resolveProposal(world: World, ant: Ant, request: Request): ActionResult {
  const proposal = request.proposal,
    site = world.habitat.sites.get(request.destination!);
  if (!world.config.environment.autonomousConstruction || !proposal || !site || ant.job !== null)
    return "blocked";
  const dump = world.habitat.sites.get(proposal.dump);
  if (!dump || world.tick - site.tick > world.config.knowledgeDuration)
    return "unknown-destination";
  if (carrying(world, ant)) return "full";
  if (proposalReserved(world, proposal, site, dump)) return "blocked";
  const job = requestConstruction(world, proposal.kind, site, dump, proposal.source, "controller");
  job.owner = ant.id;
  job.status = "active";
  ant.job = job.id;
  ant.decision.route = null;
  return "success";
}

export function abandonWork(world: World, ant: Ant): ActionResult {
  const job = world.construction.jobs.find((entry) => entry.id === ant.job);
  if (!job) return "empty";
  job.status = "canceled";
  job.finishedAt = world.tick;
  removeWorkLandmarks(world, job);
  job.owner = null;
  ant.job = null;
  ant.decision.route = null;
  return "success";
}

function carrying(world: World, ant: Ant): boolean {
  return (
    ant.cargo > 0 || ant.spoil !== null || ant.brood !== null || world.queen.carrier === ant.id
  );
}
