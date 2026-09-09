import { type Ant, type World } from "../types";
import { type Point, samePoint } from "../geometry";
import { type ActionResult } from "../colony/contract";
import { supportedSite } from "./sites";
import { cellIndex } from "../grid";
import { updateLandmark } from "../colony/knowledge";
import { adultBodies } from "../adultBody";

export const broodLandmark = (id: number): number => -100_000_000 - id;

export function attachBrood(world: World, ant: Ant, point: Point): ActionResult {
  if (ant.brood !== null || ant.cargo > 0 || ant.spoil !== null || world.queen.carrier === ant.id)
    return "full";
  const brood = world.brood.find((body) => samePoint(body, point));
  if (!brood) return "out-of-reach";
  if (adultBodies(world).some((worker) => worker.brood === brood.id)) return "full";
  ant.brood = brood.id;
  followBrood(world, ant);
  return "success";
}

export function followBrood(world: World, ant: Ant): void {
  const brood = world.brood.find((body) => body.id === ant.brood);
  if (!brood) return;
  brood.x = ant.x;
  brood.y = ant.y;
  updateLandmark(world, broodLandmark(brood.id), brood);
}

export function releaseBrood(world: World, ant: Ant, point: Point): ActionResult {
  const brood = world.brood.find((body) => body.id === ant.brood);
  if (!brood) return "empty";
  if (!supportedSite(world, point) || world.food.has(cellIndex(world.grid, point.x, point.y)))
    return "blocked";
  brood.x = point.x;
  brood.y = point.y;
  ant.brood = null;
  updateLandmark(world, broodLandmark(brood.id), brood);
  return "success";
}
