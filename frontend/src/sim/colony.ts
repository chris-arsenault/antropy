import { SEX_FEMALE, SEX_MALE, surfaceSpawnY, type Ant } from "./ant";
import { type Genome } from "./controller/contract";
import { addEgg, findEggSpot, type Egg } from "./eggs";
import { killAnt } from "./energy";
import { getVoxel } from "./grid";
import { Material } from "./materials";
import { COLONY, QUEEN } from "./tunables";
import { mutateVoxel, spawnAnt, type World } from "./world";

export interface Sperm {
  genome: Genome;
  patrilineId: number;
}

/**
 * A colony is deliberately lightweight (design spec §7.2): a scripted queen
 * (egg factory), home position, stored sperm, and bookkeeping. The queen is
 * not a walking ant. The stockpile is the queen's larder: deliveries fill
 * it, upkeep and eggs drain it, and exhaustion starves her.
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
  nextPatrilineId: number;
  lastEggTick: number;
  lastQueenEggTick: number;
  nextEggId: number;
  /** Tick the stockpile hit empty, or -1 while provisioned (queen reserves). */
  starvingSince: number;
}

function carveIfSoft(world: World, x: number, y: number, z: number): void {
  if (getVoxel(world.grid, x, y, z) !== Material.ROCK) {
    mutateVoxel(world, x, y, z, Material.AIR);
  }
}

/** Founding chamber plus the entrance shaft the queen digs (spec §7.2). */
function carveChamber(world: World, cx: number, cy: number, cz: number, surfaceY: number): void {
  for (let dy = 0; dy <= 1; dy++) {
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        carveIfSoft(world, cx + dx, cy + dy, cz + dz);
      }
    }
  }
  for (let y = cy + 2; y <= surfaceY; y++) {
    carveIfSoft(world, cx, y, cz);
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

/** Delivery-weighted sperm pick — the merit signal selecting the father line. */
function meritSperm(colony: Colony): Sperm {
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

/** Colony ids double as scent owner tags (Uint8), so they cycle in 1..250. */
function nextColonyId(world: World): number {
  const id = ((world.nextColonyId - 1) % 250) + 1;
  world.nextColonyId += 1;
  return id;
}

function createColonyAt(
  world: World,
  x: number,
  z: number,
  queenGenome: Genome,
  sperm: Sperm[]
): Colony | null {
  const surfaceY = surfaceSpawnY(world.grid, x, z);
  if (surfaceY === null) {
    return null;
  }
  const y = Math.max(3, surfaceY - COLONY.chamberDepth);
  carveChamber(world, x, y, z, surfaceY);
  const colony: Colony = {
    id: nextColonyId(world),
    x,
    y,
    z,
    queenGenome,
    queenAge: 0,
    queenLifespanTicks: COLONY.queenLifespanTicks,
    sperm,
    stockpile: COLONY.foundingStockpile,
    patrilineDeliveries: new Map(),
    nextPatrilineId: sperm.length + 1,
    lastEggTick: 0,
    lastQueenEggTick: 0,
    nextEggId: 1,
    starvingSince: -1,
  };
  world.colonies.push(colony);
  return colony;
}

/**
 * The t=0 bootstrap colony (spec §10 curriculum): independent wide-prior
 * draws for queen and sperm, and a fast-forwarded adult first brood. All
 * later colonies are founded raw through foundFromQueenEgg.
 */
export function foundColony(world: World): Colony {
  const x = Math.floor(world.grid.sizeX / 2);
  const z = Math.floor(world.grid.sizeZ / 2);
  const sperm: Sperm[] = [];
  for (let i = 0; i < COLONY.spermCount; i++) {
    sperm.push({ genome: world.controller.seed(world.rng), patrilineId: i + 1 });
  }
  const colony = createColonyAt(world, x, z, world.controller.seed(world.rng), sperm);
  if (!colony) {
    throw new Error("no surface for colony founding");
  }
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

function layColonyEgg(
  world: World,
  colony: Colony,
  genome: Genome,
  endowment: number,
  queenDestined: number,
  patrilineId: number
): boolean {
  const spot = findEggSpot(world, colony.x, colony.y, colony.z, queenDestined === 1 ? 2 : 1);
  if (spot === null) {
    return false;
  }
  colony.stockpile -= endowment + COLONY.eggLayCost;
  addEgg(world, {
    id: colony.id * 1_000_000 + colony.nextEggId++,
    x: spot.x,
    y: spot.y,
    z: spot.z,
    genome,
    energy: endowment,
    incubationRemaining: COLONY.incubationTicks,
    sex: SEX_FEMALE,
    queenDestined,
    lineageId: colony.id,
    patrilineId,
    motherId: 0,
    fatherId: patrilineId,
  });
  return true;
}

function layWorkerEgg(world: World, colony: Colony): void {
  const spermIndex = Math.floor(world.rng.next() * colony.sperm.length);
  const genome = makeOffspring(world, colony, spermIndex);
  const endowment = world.controller.physical(colony.queenGenome).eggEndowment;
  if (layColonyEgg(world, colony, genome, endowment, 0, colony.sperm[spermIndex].patrilineId)) {
    colony.lastEggTick = world.tick;
  }
}

/**
 * A queen-destined egg: merit weighting applies at egg creation (spec §7.1
 * channel 3) — the father line is the top-delivering patriline.
 */
function layQueenEgg(world: World, colony: Colony): void {
  const father = meritSperm(colony);
  const controller = world.controller;
  const recombined = controller.recombine(colony.queenGenome, father.genome, world.rng);
  if (recombined === null) {
    throw new Error(`controller ${controller.id} cannot recombine — queen eggs impossible`);
  }
  const genome = controller.mutate(
    recombined,
    controller.physical(recombined).mutationSigma,
    world.rng
  );
  if (layColonyEgg(world, colony, genome, QUEEN.eggEndowment, 1, father.patrilineId)) {
    colony.lastQueenEggTick = world.tick;
  }
}

/** Living males available for nuptial mating (ADR-0007). */
function livingMales(world: World): Ant[] {
  return world.ants.filter((ant) => ant.alive && ant.sex === SEX_MALE);
}

/**
 * A hatched winged queen (ADR-0007): fly to a random distant site, mate with
 * up to spermCount living males (each dies), and found claustrally. With no
 * males the founding fails.
 */
export function foundFromQueenEgg(world: World, egg: Egg): void {
  const males = livingMales(world);
  if (males.length === 0) {
    world.foundingFailures += 1;
    return;
  }
  const sperm: Sperm[] = [];
  const pool = males.slice();
  const matings = Math.min(COLONY.spermCount, pool.length);
  for (let i = 0; i < matings; i++) {
    const pick = Math.floor(world.rng.next() * pool.length);
    const male = pool.splice(pick, 1)[0];
    sperm.push({ genome: male.genome, patrilineId: i + 1 });
    killAnt(world, male);
  }
  const x =
    QUEEN.flightMargin + Math.floor(world.rng.next() * (world.grid.sizeX - 2 * QUEEN.flightMargin));
  const z =
    QUEEN.flightMargin + Math.floor(world.rng.next() * (world.grid.sizeZ - 2 * QUEEN.flightMargin));
  const colony = createColonyAt(world, x, z, egg.genome, sperm);
  if (colony) {
    world.foundings += 1;
  } else {
    world.foundingFailures += 1;
  }
}

function collapseColony(world: World, colony: Colony): void {
  world.colonies = world.colonies.filter((c) => c.id !== colony.id);
  world.collapses += 1;
}

/** Upkeep and the starvation clock; true when the queen has died. */
function queenDies(world: World, colony: Colony): boolean {
  colony.queenAge += 1;
  colony.stockpile -= QUEEN.upkeepPerTick;
  if (colony.stockpile <= 0) {
    colony.stockpile = 0;
    if (colony.starvingSince < 0) {
      colony.starvingSince = world.tick;
    }
  } else {
    colony.starvingSince = -1;
  }
  const starved =
    colony.starvingSince >= 0 && world.tick - colony.starvingSince > QUEEN.starvationGraceTicks;
  return colony.queenAge >= colony.queenLifespanTicks || starved;
}

function layEggs(world: World, colony: Colony): void {
  const queenEggReady =
    colony.stockpile >= QUEEN.eggThreshold &&
    world.tick - colony.lastQueenEggTick >= QUEEN.eggIntervalMin;
  if (queenEggReady) {
    layQueenEgg(world, colony);
    return;
  }
  const endowment = world.controller.physical(colony.queenGenome).eggEndowment;
  const canAfford = colony.stockpile >= endowment + COLONY.eggLayCost + 1.0;
  if (canAfford && world.tick - colony.lastEggTick >= COLONY.eggIntervalMin) {
    layWorkerEgg(world, colony);
  }
}

/**
 * One tick of scripted queen behavior per colony: upkeep from the stockpile,
 * death by age or starvation (colony collapse, spec §9.1), then queen or
 * worker egg laying as provisioning allows.
 */
export function stepColonies(world: World): void {
  for (const colony of world.colonies.slice()) {
    if (queenDies(world, colony)) {
      collapseColony(world, colony);
      continue;
    }
    layEggs(world, colony);
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
