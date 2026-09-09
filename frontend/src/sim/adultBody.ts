import { type Ant, type Queen, type World } from "./types";

/** Both collections hold canonical bodies; worker counts intentionally exclude reproductives. */
export function adultBodies<T>(world: { readonly ants: readonly T[]; readonly queen: T }): T[] {
  return [...world.ants, world.queen];
}

export function reproductive(ant: Ant): ant is Queen {
  return ant.caste === "queen";
}

export function energyCapacity(world: World, ant: Ant): number {
  return reproductive(ant) ? world.config.queenEnergy : world.config.maxEnergy;
}

export function bodyWaterKey(ant: Ant): string {
  return reproductive(ant) ? "queen" : `ant:${ant.id}`;
}

export function canAct(world: World, ant: Ant): boolean {
  if (reproductive(ant)) return world.config.mortalityEnabled && ant.alive && ant.energy > 0;
  return !world.config.mortalityEnabled || ant.energy > 0;
}

export function carried(world: World, ant: Ant): boolean {
  return reproductive(ant) && world.queen.carrier !== null;
}
