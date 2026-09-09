import { type Ant, type World } from "../types";
import { carried, reproductive } from "../adultBody";
import { eggReady, layingSite } from "../reproduction";
import { stepFrom } from "../geometry";
import { reachableCells } from "../contact";
import { localClimate } from "../climate/state";
import { type Request, type KnownLocation } from "./contract";
import { availableSites, distance, type SiteObservation } from "../construction/habitat";
import { chamberSites } from "../construction/chamberObservation";

export const REPRODUCTIVE_FEATURE_NAMES = [
  "fertile",
  "eggReady",
  "laySite",
  "bodyCarried",
  "bodyDiscomfort",
  "contactDiscomfort",
] as const;

function discomfort(world: World, point: { x: number; y: number }): number {
  const climate = localClimate(world, point);
  return (
    Math.max(0, 18 - climate.temperature, climate.temperature - 28) +
    8 * Math.max(0, 0.45 - climate.moisture)
  );
}

export function observeReproduction(world: World, ant: Ant) {
  const body = [Number(reproductive(ant)), Number(eggReady(world, ant))];
  const ownState = [Number(carried(world, ant)), discomfort(world, ant)];
  const contacts = Array.from({ length: 8 }, (_, heading) => {
    const point = stepFrom(ant, heading);
    return [
      Number(layingSite(world, point)),
      discomfort(world, reachableCells(world, ant, heading)[0]),
    ];
  });
  return (request: Request) => [
    ...body,
    contacts[request.heading][0],
    ...ownState,
    contacts[request.heading][1],
  ];
}

function location(site: SiteObservation): KnownLocation {
  return {
    id: site.id,
    x: site.x,
    y: site.y,
    backed: site.backed,
    observedAt: site.tick,
    kind: "site",
    quantity: 0,
  };
}

/** Bounded observations, ordered by proximity and time rotation, never selected for suitability. */
export function observedSiteLocations(world: World, ant: Ant): KnownLocation[] {
  const sites = availableSites(world);
  const near = sites.sort((a, b) => distance(a, ant) - distance(b, ant)).slice(0, 8);
  const offset = (world.tick * 4 + ant.id) % Math.max(1, sites.length);
  const rotating = Array.from(
    { length: Math.min(4, sites.length) },
    (_, i) => sites[(offset + i) % sites.length]
  );
  return [
    ...new Map(
      [...near, ...rotating, ...chamberSites(world, ant)].map((site) => [site.id, site])
    ).values(),
  ].map(location);
}

export function observedSiteLocation(world: World, id: number): KnownLocation | undefined {
  const site = world.habitat.sites.get(id);
  return site && world.tick - site.tick <= world.config.knowledgeDuration
    ? location(site)
    : undefined;
}
