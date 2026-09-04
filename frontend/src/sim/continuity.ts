import { type Genome } from "./controller/contract";
import { foundColonyFromPool } from "./colony";
import { CONTINUITY } from "./tunables";
import { type World } from "./world";

/**
 * Automatic continue (R3, W by fiat): the world is never left dead. When
 * every colony is gone or the population falls below the floor, a new
 * colony is force-founded from the survivor genome pool — living ants
 * and unhatched brood carry their genetics across the continuation — and
 * the continuation counter increments. Deterministic: draws come from
 * world.rng in the fixed step order. Requires a sexual controller
 * (recombine); reference-controller worlds set world.autoContinue false.
 */
function survivorPool(world: World): Genome[] {
  const pool: Genome[] = [];
  for (const ant of world.ants) {
    if (ant.alive) {
      pool.push(ant.genome);
    }
  }
  for (const egg of world.eggs) {
    pool.push(egg.genome);
  }
  return pool;
}

export function stepAutoContinue(world: World): void {
  if (!world.config.autoContinue || !world.config.colonyFounding) {
    return;
  }
  if (world.tick - world.lastContinueTick < CONTINUITY.cooldownTicks) {
    return;
  }
  const populationOk = world.colonies.length > 0 && world.ants.length >= CONTINUITY.minPopulation;
  if (populationOk) {
    return;
  }
  const pool = survivorPool(world);
  foundColonyFromPool(world, pool);
  world.continuations += 1;
  world.lastContinueTick = world.tick;
}
