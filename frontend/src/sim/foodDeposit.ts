import { type Ant } from "./ant";
import { creditNetEnergyMerit } from "./energy";
import { voxelIndex } from "./grid";
import { setMaterialScent } from "./materialScent";
import { ENERGY } from "./tunables";
import { type World } from "./world";

function isOwnedUndergroundLarder(
  world: World,
  ant: Ant,
  x: number,
  y: number,
  z: number
): boolean {
  const surface = world.surfaceMap[z * world.grid.sizeX + x];
  return y <= surface && ant.lineageId !== 0 && ant.carriedColonyScentOwner === ant.lineageId;
}

/** Record a physical food deposit and resolve its one-time external merit provenance. */
export function recordFoodDeposit(
  world: World,
  ant: Ant,
  x: number,
  y: number,
  z: number,
  uncreditedExternal: boolean
): void {
  const index = voxelIndex(world.grid, x, y, z);
  world.storedFood.add(index);
  if (world.config.contactFoodOdor && ant.carriedColonyScentOwner !== 0) {
    setMaterialScent(
      world.materialColonyScent,
      index,
      ant.carriedColonyScent,
      ant.carriedColonyScentOwner
    );
  }
  if (uncreditedExternal) {
    if (isOwnedUndergroundLarder(world, ant, x, y, z)) {
      creditNetEnergyMerit(world, ant, ENERGY.foodEnergy);
    } else {
      world.uncreditedExternalFood.add(index);
    }
  }
  world.metrics.foodDeposited += 1;
}
