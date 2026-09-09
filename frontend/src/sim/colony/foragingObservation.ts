import { reachableCells } from "../contact";
import { distance } from "../construction/habitat";
import { samePoint } from "../geometry";
import { deterministicJitter } from "../random";
import { type World, type Ant } from "../types";
import { type KnownLocation } from "./contract";

export const FORAGING_FEATURE_NAMES = [
  "routeFoodQuantity",
  "targetAffinity",
  "targetCrowding",
] as const;

export function observeForaging(world: World, ant: Ant) {
  const visible = Array.from({ length: 8 }, (_, h) => reachableCells(world, ant, h)).flat();
  const neighbors = world.ants.filter(
    (other) =>
      other !== ant && other.cargo === 0 && visible.some((point) => samePoint(point, other))
  );
  const route = world.knowledge.locations.get(ant.decision.route?.destination ?? 0);
  return (target: KnownLocation | undefined) => [
    route?.kind === "food" ? route.quantity : 0,
    target ? deterministicJitter(world.seed, target.id, ant.id) : 0,
    target ? neighbors.filter((other) => distance(other, target) <= 2).length : 0,
  ];
}
