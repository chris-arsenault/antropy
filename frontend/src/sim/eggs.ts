import { SEX_FEMALE } from "./ant";
import { foundFromQueenEgg } from "./colony";
import { type Genome } from "./controller/contract";
import { getVoxel, voxelIndex } from "./grid";
import { Material } from "./materials";
import { COLONY } from "./tunables";
import { spawnAnt, type World } from "./world";

/**
 * An egg is a physical world object (design spec §7.3): it sits in an air
 * voxel, ticks an incubation timer, carries its genome from lay time, and is
 * edible by any ant.
 */
export interface Egg {
  id: number;
  x: number;
  y: number;
  z: number;
  genome: Genome;
  /** Maternal energy transferred at lay time; the hatchling's start energy. */
  energy: number;
  incubationRemaining: number;
  /** SEX_FEMALE (fertilized) or SEX_MALE (unfertilized, haploid). */
  sex: number;
  /** 1 for a queen-destined egg (founds on hatch), else 0. */
  queenDestined: number;
  lineageId: number;
  patrilineId: number;
  motherId: number;
  fatherId: number;
}

export function eggKey(world: World, egg: Egg): number {
  return voxelIndex(world.grid, egg.x, egg.y, egg.z);
}

export function addEgg(world: World, egg: Egg): void {
  world.eggs.push(egg);
  world.eggIndex.set(eggKey(world, egg), egg);
}

export function removeEgg(world: World, egg: Egg): void {
  world.eggs = world.eggs.filter((e) => e.id !== egg.id);
  world.eggIndex.delete(eggKey(world, egg));
}

/** First egg-free air voxel within the radius at (·, y, ·), or null. */
export function findEggSpot(
  world: World,
  cx: number,
  cy: number,
  cz: number,
  radius = 1
): { x: number; y: number; z: number } | null {
  for (let dz = -radius; dz <= radius; dz++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const x = cx + dx;
      const z = cz + dz;
      const key = voxelIndex(world.grid, x, cy, z);
      if (getVoxel(world.grid, x, cy, z) === Material.AIR && !world.eggIndex.has(key)) {
        return { x, y: cy, z };
      }
    }
  }
  return null;
}

function hatch(world: World, egg: Egg): void {
  removeEgg(world, egg);
  if (egg.queenDestined === 1) {
    foundFromQueenEgg(world, egg);
    return;
  }
  const traits = world.controller.physical(egg.genome);
  const ant = spawnAnt(world, {
    x: egg.x,
    y: egg.y,
    z: egg.z,
    heading: world.rng.next() * Math.PI * 2,
    energy: egg.energy,
    sex: egg.sex ?? SEX_FEMALE,
    lineageId: egg.lineageId,
    patrilineId: egg.patrilineId,
    motherId: egg.motherId,
    fatherId: egg.fatherId,
    genome: egg.genome,
    controllerState: world.controller.createState(),
    traits,
  });
  // Hatchlings are juveniles growing toward the genetic target (spec §7.3).
  ant.bodyScale = traits.bodyScale * COLONY.juvenileFraction;
}

/** Advance incubation; hatch ripe eggs in insertion order. */
export function stepEggs(world: World): void {
  const ripe: Egg[] = [];
  for (const egg of world.eggs) {
    egg.incubationRemaining -= 1;
    if (egg.incubationRemaining <= 0) {
      ripe.push(egg);
    }
  }
  for (const egg of ripe) {
    hatch(world, egg);
  }
}
