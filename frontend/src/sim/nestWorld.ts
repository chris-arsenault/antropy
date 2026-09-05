import { placeBootstrapColony, type Colony } from "./colony";
import { NEST_CONFIG, type SimConfig } from "./config";
import { type Controller } from "./controller/contract";
import { rnnController } from "./controller/rnn";
import { primeAuthoredNestScent, primeAuthoredNestTrail } from "./nestScentCarrier";
import { exchangeMaterialScent, primeAuthoredMaterialScent } from "./materialScent";
import { stepScentField } from "./scent";
import { COLONY_ODOR } from "./tunables";
import { authorProgrammedNest, type ProgrammedNest } from "./programmedNest";
import { createWorld, type World } from "./world";

export interface AuthoredNestWorld {
  readonly world: World;
  readonly nest: ProgrammedNest;
  readonly colony: Colony;
}

/** Build the Appendix E control arm: terrain first, occupants second, no hidden carve. */
export function buildAuthoredNestWorld(
  seed: number,
  controller: Controller = rnnController,
  config: SimConfig = NEST_CONFIG
): AuthoredNestWorld {
  const world = createWorld(seed, controller, config);
  const nest = authorProgrammedNest(world);
  const colony = placeBootstrapColony(world, nest.queenHome, nest.workerStations, nest.entrance);
  primeAuthoredNestScent(world, colony);
  primeAuthoredNestTrail(world, colony, nest.workerStations);
  if (world.config.materialColonyOdor) {
    primeAuthoredMaterialScent(world.grid, world.cavities, world.materialColonyScent, colony.id);
    for (let pass = 0; pass < COLONY_ODOR.fixtureWarmupPasses; pass++) {
      stepScentField(world.grid, world.colonyScent);
      exchangeMaterialScent(world.grid, world.colonyScent, world.materialColonyScent);
    }
  }
  return { world, nest, colony };
}
