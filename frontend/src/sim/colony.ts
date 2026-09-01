import { surfaceSpawnY } from "./ant";
import { type Genome } from "./controller/contract";
import { addEgg } from "./eggs";
import { getVoxel, voxelIndex } from "./grid";
import { Material } from "./materials";
import { COLONY } from "./tunables";
import { mutateVoxel, spawnAnt, type World } from "./world";

export interface Sperm {
  genome: Genome;
  patrilineId: number;
}

/**
 * A colony is deliberately lightweight (design spec §7.2): a scripted queen
 * (egg factory), home position, stored sperm, and bookkeeping. The queen is
 * not a walking ant.
 */
export interface Colony {
  id: number;
  x: number;
  y: number;
  z: number;
  queenGenome: Genome;
  queenAge: number;
  queenLifespanTicks: number;
  sperm: Sperm[];
  stockpile: number;
  /** Food-delivery credit per patriline — the merit signal (spec §7.1). */
  patrilineDeliveries: Map<number, number>;
  successions: number;
  nextPatrilineId: number;
  lastEggTick: number;
  nextEggId: number;
}

function carveChamber(world: World, cx: number, cy: number, cz: number): void {
  for (let dy = 0; dy <= 1; dy++) {
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (getVoxel(world.grid, cx + dx, cy + dy, cz + dz) !== Material.ROCK) {
          mutateVoxel(world, cx + dx, cy + dy, cz + dz, Material.AIR);
        }
      }
    }
  }
}

function makeOffspring(world: World, colony: Colony, spermIndex: number): Genome {
  const controller = world.controller;
  const father = colony.sperm[spermIndex];
  const recombined = controller.recombine(colony.queenGenome, father.genome, world.rng);
  if (recombined === null) {
    throw new Error(`controller ${controller.id} cannot recombine — colonies need sexual genetics`);
  }
  const sigma = controller.physical(recombined).mutationSigma;
  return controller.mutate(recombined, sigma, world.rng);
}

/**
 * Found the single MVP colony: independent wide-prior draws for the queen
 * and each stored sperm (spec §10), a scripted chamber below the surface,
 * and the first brood fast-forwarded to adult workers.
 */
export function foundColony(world: World): Colony {
  const x = Math.floor(world.grid.sizeX / 2);
  const z = Math.floor(world.grid.sizeZ / 2);
  const surfaceY = surfaceSpawnY(world.grid, x, z);
  if (surfaceY === null) {
    throw new Error("no surface for colony founding");
  }
  const y = Math.max(3, surfaceY - COLONY.chamberDepth);
  carveChamber(world, x, y, z);

  const sperm: Sperm[] = [];
  for (let i = 0; i < COLONY.spermCount; i++) {
    sperm.push({ genome: world.controller.seed(world.rng), patrilineId: i + 1 });
  }
  const colony: Colony = {
    id: world.colonies.length + 1,
    x,
    y,
    z,
    queenGenome: world.controller.seed(world.rng),
    queenAge: 0,
    queenLifespanTicks: COLONY.queenLifespanTicks,
    sperm,
    stockpile: COLONY.foundingStockpile,
    patrilineDeliveries: new Map(),
    successions: 0,
    nextPatrilineId: COLONY.spermCount + 1,
    lastEggTick: 0,
    nextEggId: 1,
  };
  world.colonies.push(colony);

  for (let i = 0; i < COLONY.initialWorkers; i++) {
    const spermIndex = Math.floor(world.rng.next() * sperm.length);
    const genome = makeOffspring(world, colony, spermIndex);
    const spawnY = surfaceSpawnY(world.grid, x, z);
    if (spawnY === null) {
      continue;
    }
    spawnAnt(world, {
      x,
      y: spawnY,
      z,
      heading: world.rng.next() * Math.PI * 2,
      energy: 1,
      lineageId: colony.id,
      patrilineId: sperm[spermIndex].patrilineId,
      motherId: 0,
      fatherId: sperm[spermIndex].patrilineId,
      genome,
      controllerState: world.controller.createState(),
      traits: world.controller.physical(genome),
    });
  }
  return colony;
}

function eggSpot(world: World, colony: Colony): { x: number; y: number; z: number } | null {
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = colony.x + dx;
      const z = colony.z + dz;
      const key = voxelIndex(world.grid, x, colony.y, z);
      if (getVoxel(world.grid, x, colony.y, z) === Material.AIR && !world.eggIndex.has(key)) {
        return { x, y: colony.y, z };
      }
    }
  }
  return null;
}

function layEgg(world: World, colony: Colony): void {
  const controller = world.controller;
  const spot = eggSpot(world, colony);
  if (spot === null) {
    return;
  }
  const spermIndex = Math.floor(world.rng.next() * colony.sperm.length);
  const genome = makeOffspring(world, colony, spermIndex);
  const endowment = controller.physical(colony.queenGenome).eggEndowment;
  colony.stockpile -= endowment + COLONY.eggLayCost;
  colony.lastEggTick = world.tick;
  addEgg(world, {
    id: colony.id * 1_000_000 + colony.nextEggId++,
    x: spot.x,
    y: spot.y,
    z: spot.z,
    genome,
    energy: endowment,
    incubationRemaining: COLONY.incubationTicks,
    lineageId: colony.id,
    patrilineId: colony.sperm[spermIndex].patrilineId,
    motherId: 0,
    fatherId: colony.sperm[spermIndex].patrilineId,
  });
}

/** Delivery-weighted sperm pick — the merit signal selecting the father line. */
function topPatrilineSperm(colony: Colony): Sperm {
  let best = colony.sperm[0];
  let bestScore = -1;
  for (const sperm of colony.sperm) {
    const score = colony.patrilineDeliveries.get(sperm.patrilineId) ?? 0;
    if (score > bestScore) {
      best = sperm;
      bestScore = score;
    }
  }
  return best;
}

/**
 * In-place merit-weighted royal succession (design spec §7.1 channel 3): the
 * successor queen recombines the queen line with the top-delivering
 * patriline, then re-mates from the colony gene pool so worker success
 * enters both the queen line and the sperm stock.
 */
function succeed(world: World, colony: Colony): void {
  const controller = world.controller;
  const meritSperm = topPatrilineSperm(colony);
  const recombined = controller.recombine(colony.queenGenome, meritSperm.genome, world.rng);
  if (recombined === null) {
    throw new Error(`controller ${controller.id} cannot recombine — succession impossible`);
  }
  const sigma = controller.physical(recombined).mutationSigma;
  colony.queenGenome = controller.mutate(recombined, sigma, world.rng);

  const newSperm: Sperm[] = [];
  for (let i = 0; i < COLONY.spermCount; i++) {
    const spermIndex = Math.floor(world.rng.next() * colony.sperm.length);
    newSperm.push({
      genome: makeOffspring(world, colony, spermIndex),
      patrilineId: colony.nextPatrilineId++,
    });
  }
  colony.sperm = newSperm;
  colony.patrilineDeliveries = new Map();
  colony.queenAge = 0;
  colony.successions += 1;
}

/** One tick of scripted queen behavior: age, lay when provisioned, succeed. */
export function stepColonies(world: World): void {
  for (const colony of world.colonies) {
    colony.queenAge += 1;
    if (colony.queenAge >= colony.queenLifespanTicks) {
      succeed(world, colony);
      continue;
    }
    const endowment = world.controller.physical(colony.queenGenome).eggEndowment;
    const canAfford = colony.stockpile >= endowment + COLONY.eggLayCost;
    const intervalOk = world.tick - colony.lastEggTick >= COLONY.eggIntervalMin;
    if (canAfford && intervalOk) {
      layEgg(world, colony);
    }
  }
}

/** Credit a physical food delivery: full value to the stockpile + merit. */
export function creditDelivery(
  world: World,
  lineageId: number,
  patrilineId: number,
  amount: number
): void {
  const colony = world.colonies.find((c) => c.id === lineageId);
  if (!colony) {
    return;
  }
  colony.stockpile += amount;
  colony.patrilineDeliveries.set(
    patrilineId,
    (colony.patrilineDeliveries.get(patrilineId) ?? 0) + 1
  );
}
