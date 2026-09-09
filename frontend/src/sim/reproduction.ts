import { occupied } from "./contact";
import { type Point, stepFrom } from "./geometry";
import { isWalkable } from "./scent";
import { looseCellOpen } from "./support";
import { type Ant, type Queen, type World } from "./types";
import { carried, reproductive } from "./adultBody";
import { foodAt, spend } from "./resources";
import { type ActionResult } from "./colony/contract";

/** Egg synthesis slows as the queen's own delivered reserves fall. No stockpile census. */
export function layingPeriod(world: World, queen: Queen = world.queen): number {
  const reserve = queen.energy / world.config.queenEnergy;
  const nutrition = Math.max(0.1, Math.min(1, (reserve - 0.5) / 0.4));
  return Math.ceil(world.config.layingInterval / nutrition);
}

export function eggReady(world: World, ant: Ant): boolean {
  return (
    reproductive(ant) &&
    ant.alive &&
    world.config.reproductionEnabled &&
    ant.layingAge >= layingPeriod(world, ant) &&
    ant.energy >= world.config.workerEggCost + world.config.queenEnergy / 2
  );
}

/** Legality of this one local target. The resolver never searches for a substitute. */
export function layingSite(world: World, point: Point): boolean {
  return (
    isWalkable(world.grid, point.x, point.y) &&
    !occupied(world, point) &&
    foodAt(world, point.x, point.y) === 0 &&
    (!world.config.environment.gravity || !looseCellOpen(world.grid, point.x, point.y - 1))
  );
}

export function layEgg(world: World, ant: Ant, heading: number): ActionResult {
  if (!reproductive(ant) || !eggReady(world, ant)) return "empty";
  if (carried(world, ant) || ant.brood !== null || ant.spoil !== null) return "blocked";
  const point = stepFrom(ant, heading);
  if (!layingSite(world, point)) return "blocked";
  if (ant.energy < world.config.workerEggCost + world.config.mandibleCost) return "empty";
  spend(world, ant, world.config.mandibleCost);
  ant.energy -= world.config.workerEggCost;
  ant.layingAge = 0;
  world.brood.push({
    ...point,
    id: world.nextBroodId++,
    stage: "egg",
    age: 0,
    energy: world.config.workerEggCost,
    investment: 0,
  });
  world.metrics.workerEggs += 1;
  return "success";
}

/** Shared by physiology and diagnostics; never supplied to worker controllers. */
export function layingStatus(world: World): string {
  if (!world.queen.alive) return "Queen dead";
  if (!world.config.reproductionEnabled) return "Reproduction disabled";
  if (world.queen.carrier !== null) return "Queen in transport";
  if (world.queen.energy < world.config.workerEggCost + world.config.queenEnergy / 2)
    return "Waiting for queen feeding";
  if (world.queen.layingAge < layingPeriod(world)) return "Developing next egg";
  const free = Array.from({ length: 8 }, (_, heading) => stepFrom(world.queen, heading)).some(
    (point) => layingSite(world, point)
  );
  return free ? "Ready to choose a laying site" : "No adjacent laying space";
}

export function growthSnapshot(world: World) {
  const count = (stage: string) => world.brood.filter((body) => body.stage === stage).length;
  return {
    eggs: count("egg"),
    larvae: count("larva"),
    pupae: count("pupa"),
    eggsLaid: world.metrics.workerEggs,
    deaths: world.metrics.deaths,
    broodDeaths: world.economy.broodDeaths,
    laying: layingStatus(world),
    layingPeriod: layingPeriod(world),
    unfundedLarvae: world.brood.filter(
      (body) => body.stage === "larva" && body.investment < world.config.broodInvestment
    ).length,
  };
}
