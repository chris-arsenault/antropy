import { stepFrom, samePoint, type Point } from "./geometry";
import { getCell } from "./grid";
import { Material } from "./materials";
import { type Ant, type World } from "./types";

/** Two-cell antenna/feeding reach, occluded by the first solid cell. */
export function reachableCells(world: World, point: Point, heading: number): Point[] {
  const first = stepFrom(point, heading);
  if (getCell(world.grid, first.x, first.y) !== Material.AIR) return [first];
  return [first, stepFrom(first, heading)];
}

export function hungryRecipient(world: World, point: Point) {
  if (
    world.queen.alive &&
    samePoint(world.queen, point) &&
    world.queen.energy < world.config.queenEnergy - 0.5
  )
    return world.queen;
  return world.brood.find(
    (brood) =>
      samePoint(brood, point) &&
      brood.stage === "larva" &&
      brood.energy + brood.investment <
        world.config.broodInvestment + world.config.workerEggCost - 0.1
  );
}

export function occupied(world: World, point: Point, except?: Ant): boolean {
  return (
    world.ants.some((ant) => ant !== except && samePoint(ant, point)) ||
    (world.config.mortalityEnabled &&
      world.queen.alive &&
      world.queen !== except &&
      world.queen.carrier !== except?.id &&
      samePoint(world.queen, point)) ||
    world.brood.some((brood) => brood.id !== except?.brood && samePoint(brood, point))
  );
}
