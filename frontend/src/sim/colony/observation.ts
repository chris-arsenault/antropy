import { senseColony } from "../colonySensors";
import { INPUT_NAMES } from "../controller/contract";
import { cellIndex } from "../grid";
import { deterministicJitter } from "../random";
import { foodAt } from "../resources";
import { isInterior } from "../terrain";
import { type Ant, type World } from "../types";
import { observeStorage, STORAGE_FEATURE_NAMES } from "../construction/storageObservation";
import { constructionRequests, observeWork, WORK_FEATURE_NAMES } from "../construction/observation";
import { observePressures, PRESSURE_FEATURE_NAMES } from "../construction/pressureObservation";
import { proposalRequests } from "../construction/proposals";
import { observeForaging, FORAGING_FEATURE_NAMES } from "./foragingObservation";
import { observeCollective, COLLECTIVE_FEATURE_NAMES } from "../construction/collectiveObservation";
import { focusLocation } from "../construction/collective";
import { observeChamber, CHAMBER_FEATURE_NAMES } from "../construction/chamberObservation";
import {
  observeReproduction,
  REPRODUCTIVE_FEATURE_NAMES,
  observedSiteLocation,
  observedSiteLocations,
} from "./reproductiveObservation";
import {
  LOCATION_KINDS,
  REQUESTS,
  RESULTS,
  type KnownLocation,
  type Request,
  WAIT,
} from "./contract";

export const FEATURE_NAMES = [
  "action",
  "energy",
  "cargo",
  "task",
  "inside",
  "open",
  "food",
  "edible",
  "recipient",
  "queenContact",
  "targetKind",
  "targetQuantity",
  "targetDistance",
  "routeReady",
  "routeRemaining",
  "routeKind",
  "sameTarget",
  "lastResult",
  "noise",
  "targetAge",
  "anyRecipient",
  "foodHere",
  "targetBacked",
  "targetFailed",
  ...WORK_FEATURE_NAMES,
  ...STORAGE_FEATURE_NAMES,
  ...PRESSURE_FEATURE_NAMES,
  ...FORAGING_FEATURE_NAMES,
  ...COLLECTIVE_FEATURE_NAMES,
  ...REPRODUCTIVE_FEATURE_NAMES,
  ...CHAMBER_FEATURE_NAMES,
] as const;
export const F = Object.fromEntries(FEATURE_NAMES.map((name, i) => [name, i])) as Record<
  (typeof FEATURE_NAMES)[number],
  number
>;
export interface Candidate {
  readonly request: Request;
  readonly inputs: readonly number[];
}

export const OBSERVATION_NAMES = [
  ...FEATURE_NAMES,
  "body heading",
  "destination id",
  "destination x",
  "destination y",
  ...INPUT_NAMES.map((name) => `local ${name}`),
  ...Array.from({ length: 8 }, (_, i) => `fresh air relative ${i}`),
];

function requests(locations: readonly KnownLocation[]): Request[] {
  const direct = (["up", "down", "left", "right"] as const).map((kind, i) => ({
    ...WAIT,
    kind,
    heading: [2, 6, 4, 0][i],
  }));
  const route = (["forward", "backward", "discard"] as const).map((kind) => ({ ...WAIT, kind }));
  const contact = Array.from({ length: 8 }, (_, heading) =>
    (["pickup", "deposit", "eat", "feed"] as const).map((kind) => ({ ...WAIT, kind, heading }))
  ).flat();
  return [
    WAIT,
    ...direct,
    ...route,
    ...contact,
    { ...WAIT, kind: "pheromone" },
    { ...WAIT, kind: "pheromone-b" },
    ...Array.from({ length: 8 }, (_, heading) => ({ ...WAIT, kind: "lay-egg" as const, heading })),
    ...Array.from({ length: 8 }, (_, heading) => ({
      ...WAIT,
      kind: "remember-site" as const,
      heading,
    })),
    { ...WAIT, kind: "forget-site" },
    ...Array.from({ length: 8 }, (_, heading) => ({
      ...WAIT,
      kind: "drop-spoil" as const,
      heading,
    })),
    ...locations.map((location) => ({
      ...WAIT,
      kind: "acquire" as const,
      destination: location.id,
    })),
  ];
}

export function observeCandidates(world: World, ant: Ant): Candidate[] {
  const work = observeWork(world, ant);
  const storage = observeStorage(world, ant);
  const pressures = observePressures(world, ant);
  const foraging = observeForaging(world, ant);
  const collective = observeCollective(world, ant);
  const reproduction = observeReproduction(world, ant);
  const chamber = observeChamber(world, ant);
  const locations = [...world.knowledge.locations.values(), ...observedSiteLocations(world, ant)];
  const focus = focusLocation(ant);
  if (focus) locations.push(focus);
  const frame = senseColony(world, ant);
  const route = ant.decision.route;
  const routeTarget =
    route &&
    (world.knowledge.locations.get(route.destination) ??
      observedSiteLocation(world, route.destination));
  const ready = !!route && !route.offRoute && route.revision === world.grid.revision;
  const latest = ant.decision.history[ant.decision.history.length - 1];
  const routeKind = routeTarget ? LOCATION_KINDS.indexOf(routeTarget.kind) : -1;
  const remaining = route ? route.cells.length - 1 - route.cursor : 0;
  const lastResult = RESULTS.indexOf(latest?.result ?? "no-route");
  return [
    ...requests(locations),
    ...constructionRequests(world),
    ...proposalRequests(world, ant),
  ].map((request, i) => {
    const target =
      request.destination === focus?.id ? focus : knownTarget(world, request.destination!);
    const contact = frame.contacts[(request.heading - ant.heading + 8) % 8];
    const inputs = [
      REQUESTS.indexOf(request.kind),
      frame.hunger,
      frame.cargo,
      ant.task,
      Number(isInterior(world.grid, cellIndex(world.grid, ant.x, ant.y))),
      Number(contact.open),
      contact.food,
      Number(contact.edible),
      Number(contact.hungry),
      Number(frame.contacts.some((c) => c.queen)),
      target ? LOCATION_KINDS.indexOf(target.kind) : -1,
      target?.quantity ?? 0,
      target ? Math.abs(target.x - ant.x) + Math.abs(target.y - ant.y) : 0,
      Number(ready),
      remaining,
      routeKind,
      Number(!!route && request.destination === route.destination),
      lastResult,
      deterministicJitter(world.seed, Math.floor(world.tick / 64), ant.id * 101 + i),
      observationAge(target, world.tick),
      Number(frame.contacts.some((c) => c.hungry)),
      foodAt(world, ant.x, ant.y),
      Number(target?.backed ?? false),
      Number(recentlyFailed(ant, request.destination)),
      ...work(request),
      ...storage(request),
      ...pressures(request),
      ...foraging(target),
      ...collective(request),
      ...reproduction(request),
      ...chamber(request),
      ant.heading,
      ...destinationCoordinates(target),
      ...frame.navigation,
      ...frame.freshAir,
    ];
    return { request, inputs };
  });
}

function knownTarget(world: World, id: number): KnownLocation | undefined {
  return world.knowledge.locations.get(id) ?? observedSiteLocation(world, id);
}

function destinationCoordinates(target: KnownLocation | undefined): number[] {
  return target ? [target.id, target.x, target.y] : [0, 0, 0];
}

function recentlyFailed(ant: Ant, destination: number | null): boolean {
  return ant.decision.history.some(
    (entry) =>
      entry.request.kind === "acquire" &&
      entry.request.destination === destination &&
      entry.result === "unreachable"
  );
}

function observationAge(target: KnownLocation | undefined, tick: number): number {
  return target?.observedAt === null || !target ? 0 : tick - target.observedAt;
}
