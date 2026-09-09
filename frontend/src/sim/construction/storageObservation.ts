import { type World, type Ant } from "../types";
import { type Request } from "../colony/contract";
import { stepFrom } from "../geometry";
import { cellIndex } from "../grid";
import { cacheAt } from "./sites";

export const STORAGE_FEATURE_NAMES = [
  "localCache",
  "localRetiring",
  "cacheSpace",
  "targetRetiring",
  "knownStorageSpace",
  "targetStorageSpace",
] as const;
export function observeStorage(world: World, ant: Ant): (request: Request) => number[] {
  const retiring = new Set(
    world.construction.jobs
      .filter((job) => job.kind === "move-cache" && ["pending", "active"].includes(job.status))
      .map((job) => job.source)
  );
  const space = Number(
    [...world.knowledge.locations.values()].some(
      (site) =>
        site.kind === "cache" &&
        site.quantity < world.config.cacheCapacity &&
        !retiring.has(site.id)
    )
  );
  const contacts = Array.from({ length: 8 }, (_, heading) => {
    const point = stepFrom(ant, heading),
      id = cacheAt(world, point);
    return [
      Number(id !== null),
      Number(id !== null && retiring.has(id)),
      Math.max(
        0,
        world.config.cacheCapacity - (world.food.get(cellIndex(world.grid, point.x, point.y)) ?? 0)
      ),
    ];
  });
  return (request) => [
    ...contacts[request.heading],
    Number(retiring.has(request.destination)),
    space,
    Number(
      (world.knowledge.locations.get(request.destination!)?.quantity ?? 0) <
        world.config.cacheCapacity
    ),
  ];
}
