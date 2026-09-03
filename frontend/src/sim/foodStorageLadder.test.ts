import { mkdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { surfaceSpawnY } from "./ant";
import { LADDER_STEP10D_CONFIG, LADDER_STEP11B_CONFIG, LADDER_STEP2_CONFIG } from "./config";
import { OUTPUT_COUNT } from "./controller/contract";
import {
  diggerSeedVector,
  functionalSeedVector,
  rnnController,
  setRuntimeSeedBase,
} from "./controller/rnn";
import { getVoxelSafe, voxelIndex } from "./grid";
import { Material } from "./materials";
import { premarkDigSite } from "./oracles/digSite";
import { makeFoodCarrier, type FoodPosition } from "./oracles/food";
import { cacheAccess, type CacheAccess } from "./oracles/nestRoute";
import { createRng } from "./rng";
import { RAIN } from "./tunables";
import { createWorld, mutateVoxel, spawnAnt, stepWorld, type World } from "./world";

const SITE = { x: 96, z: 96 } as const;
const CREW_SIZE = 8;
const STORAGE_COHORT = 12;
const LATERALS = [
  { dx: 1, dz: 0 },
  { dx: 0, dz: 1 },
  { dx: -1, dz: 0 },
  { dx: 0, dz: -1 },
] as const;

function spawnWorker(
  world: World,
  x: number,
  y: number,
  z: number,
  heading = 0,
  genome = rnnController.seed(world.rng)
) {
  return spawnAnt(world, {
    x,
    y,
    z,
    heading,
    energy: 1,
    lineageId: 0,
    patrilineId: 0,
    motherId: 0,
    fatherId: 0,
    genome,
    controllerState: rnnController.createState(),
    traits: rnnController.physical(genome),
  });
}

function functionalFounder(seed: number) {
  setRuntimeSeedBase(functionalSeedVector());
  try {
    return rnnController.seed(createRng(seed));
  } finally {
    setRuntimeSeedBase(null);
  }
}

function constructNest(
  world: World,
  seedVector = diggerSeedVector(),
  builderSeedBase = 6_100
): { access: CacheAccess; ticks: number } {
  const surfaceY = surfaceSpawnY(world.grid, SITE.x, SITE.z) as number;
  setRuntimeSeedBase(seedVector);
  try {
    for (let index = 0; index < CREW_SIZE; index++) {
      spawnWorker(
        world,
        SITE.x,
        surfaceY,
        SITE.z,
        (index % 4) * (Math.PI / 2),
        rnnController.seed(createRng(builderSeedBase + index))
      );
    }
  } finally {
    setRuntimeSeedBase(null);
  }
  premarkDigSite(world, SITE.x, surfaceY, SITE.z, 0);
  let firstDeath = "none";
  for (let tick = 1; tick <= 3_000; tick++) {
    stepWorld(world);
    const access = cacheAccess(world);
    if (firstDeath === "none" && world.ants.length < CREW_SIZE) {
      firstDeath = `tick:${tick},access:${String(access !== null)},loads:${world.ants.map((ant) => ant.spoilLoads).join(",")}`;
      if (access !== null) {
        return { access, ticks: tick };
      }
    }
  }
  throw new Error(
    `oracle crew did not complete an accessible dug nest: ` +
      `access=${String(cacheAccess(world) !== null)} ` +
      `ants=${world.ants.length}/${CREW_SIZE} loads=${world.ants.map((ant) => ant.spoilLoads).join(",")} ` +
      `firstDeath=${firstDeath}`
  );
}

function accessibleSurfaceSource(
  world: World,
  mouth: FoodPosition
): { source: FoodPosition; approach: FoodPosition } {
  for (const { dx, dz } of LATERALS) {
    const x = mouth.x + dx;
    const z = mouth.z + dz;
    const surface = world.surfaceMap[z * world.grid.sizeX + x];
    if (mouth.y > surface && getVoxelSafe(world.grid, x, mouth.y, z) === Material.AIR) {
      return {
        source: { x, y: mouth.y, z },
        approach: mouth,
      };
    }
  }
  const entrance = { x: mouth.x, y: mouth.y - 1, z: mouth.z };
  const entranceSurface = world.surfaceMap[entrance.z * world.grid.sizeX + entrance.x];
  if (
    entrance.y === entranceSurface &&
    getVoxelSafe(world.grid, entrance.x, entrance.y, entrance.z) === Material.AIR
  ) {
    return { source: entrance, approach: mouth };
  }
  throw new Error("no adjacent surface cells available for the transport assay");
}

function decodeFood(world: World): FoodPosition[] {
  const slab = world.grid.sizeX * world.grid.sizeZ;
  return [...world.foodSources].map((index) => ({
    x: index % world.grid.sizeX,
    y: Math.floor(index / slab),
    z: Math.floor(index / world.grid.sizeX) % world.grid.sizeZ,
  }));
}

const CACHE_OFFSETS = Array.from({ length: STORAGE_COHORT }, (_, index) => ({
  dx: (index % 4) - 2,
  dz: Math.floor(index / 4) - 1,
}));

function storageWorld(seed: number, underground: boolean): { world: World; food: FoodPosition[] } {
  const world = createWorld(seed, rnnController, LADDER_STEP11B_CONFIG);
  world.foodBase = 0;
  world.foodTarget = 0;
  const minimumSurface = Math.min(
    ...CACHE_OFFSETS.map(({ dx, dz }) =>
      Number(world.surfaceMap[(SITE.z + dz) * world.grid.sizeX + SITE.x + dx])
    )
  );
  const cacheY = minimumSurface - 3;
  const food = CACHE_OFFSETS.map(({ dx, dz }) => {
    const x = SITE.x + dx;
    const z = SITE.z + dz;
    const y = underground ? cacheY : (surfaceSpawnY(world.grid, x, z) as number);
    if (underground) {
      mutateVoxel(world, x, y, z, Material.AIR);
    }
    mutateVoxel(world, x, y, z, Material.FOOD);
    return { x, y, z };
  });
  if (underground) {
    const mouthY = surfaceSpawnY(world.grid, SITE.x, SITE.z) as number;
    for (let y = mouthY - 1; y > cacheY; y--) {
      mutateVoxel(world, SITE.x, y, SITE.z, Material.AIR);
    }
  }
  return { world, food };
}

function runOneStorm(world: World): void {
  world.rainRemaining = RAIN.durationTicks;
  for (let tick = 0; tick < RAIN.durationTicks; tick++) {
    stepWorld(world);
  }
  expect(world.rainRemaining).toBe(0);
}

function retained(world: World, food: readonly FoodPosition[]): number {
  return food.filter(({ x, y, z }) => getVoxelSafe(world.grid, x, y, z) === Material.FOOD).length;
}

function adjacentToCarrier(
  carrier: { x: number; y: number; z: number },
  food: FoodPosition
): boolean {
  return (
    Math.max(
      Math.abs(carrier.x - food.x),
      Math.abs(carrier.y - food.y),
      Math.abs(carrier.z - food.z)
    ) <= 1
  );
}

function runFunctionalFood(seedBase: number) {
  const world = createWorld(9_900, rnnController, {
    ...LADDER_STEP2_CONFIG,
    motorJitter: true,
  });
  world.foodBase = 0;
  world.foodTarget = 0;
  const { access, ticks: constructionTicks } = constructNest(world, functionalSeedVector(), 6_100);
  world.config = { ...LADDER_STEP11B_CONFIG, reproduction: false, motorJitter: true };
  world.ants = [];
  const { source, approach } = accessibleSurfaceSource(world, access.mouth);
  const existingFood = new Set(world.foodSources);
  mutateVoxel(world, source.x, source.y, source.z, Material.FOOD);
  const crew = Array.from({ length: CREW_SIZE }, (_, index) =>
    spawnWorker(
      world,
      approach.x,
      approach.y,
      approach.z,
      (index * Math.PI) / 4,
      functionalFounder(seedBase + index)
    )
  );
  const wasLoaded = new Set<number>();
  const lastLoadedPosition = new Map<number, FoodPosition>();
  let pickedUp = false;
  let deposited: FoodPosition | null = null;
  let transportTicks = 0;
  for (let tick = 0; tick < 1_000 && deposited === null; tick++) {
    stepWorld(world);
    transportTicks = tick + 1;
    for (const ant of crew) {
      if (ant.carrying === Material.FOOD) {
        pickedUp = true;
        wasLoaded.add(ant.id);
        lastLoadedPosition.set(ant.id, { x: ant.x, y: ant.y, z: ant.z });
      }
    }
    const newFood = decodeFood(world).filter(
      (food) =>
        !existingFood.has(voxelIndex(world.grid, food.x, food.y, food.z)) &&
        !(food.x === source.x && food.y === source.y && food.z === source.z)
    );
    deposited =
      newFood.find((food) =>
        [...wasLoaded].some((id) => {
          const ant = crew.find((candidate) => candidate.id === id);
          const position = ant?.carrying === Material.FOOD ? null : lastLoadedPosition.get(id);
          return position ? adjacentToCarrier(position, food) : false;
        })
      ) ?? null;
  }

  const storageDepth =
    deposited === null
      ? null
      : world.surfaceMap[deposited.z * world.grid.sizeX + deposited.x] - deposited.y;
  let retention = 0;
  if (deposited !== null) {
    world.ants = [];
    runOneStorm(world);
    retention = retained(world, [deposited]);
  }
  return {
    seedBase,
    constructionTicks,
    transportTicks,
    pickedUp,
    deposited,
    storageDepth,
    retention,
  };
}

describe("Appendix D food-storage ladder", () => {
  it("step 11a: the oracle carries surface food into an ant-dug nest", { timeout: 60_000 }, () => {
    const world = createWorld(9_900, rnnController, LADDER_STEP2_CONFIG);
    world.foodBase = 0;
    world.foodTarget = 0;
    const { access, ticks: constructionTicks } = constructNest(world);
    world.config = { ...LADDER_STEP10D_CONFIG };
    const { source, approach } = accessibleSurfaceSource(world, access.mouth);
    mutateVoxel(world, source.x, source.y, source.z, Material.FOOD);
    const carrier = spawnWorker(world, approach.x, approach.y, approach.z);
    const foodCarrier = makeFoodCarrier({
      source,
      destination: access.destination,
      unloadedWaypoints: [],
      loadedWaypoints: [access.mouth, ...access.path],
    });
    const idle = new Float32Array(OUTPUT_COUNT);
    world.policyOverride = (policyWorld, ant, inputs) =>
      ant.id === carrier.id ? foodCarrier(policyWorld, ant, inputs) : idle;

    let pickedUp = false;
    let deliveredAt = -1;
    for (let tick = 1; tick <= 1_000; tick++) {
      stepWorld(world);
      pickedUp ||= carrier.carrying === Material.FOOD;
      if (pickedUp && carrier.carrying === null) {
        deliveredAt = tick;
        break;
      }
    }

    const localSurface =
      world.surfaceMap[access.destination.z * world.grid.sizeX + access.destination.x];
    mkdirSync("test-results", { recursive: true });
    writeFileSync(
      "test-results/food-transport.txt",
      JSON.stringify({
        constructionTicks,
        source,
        destination: access.destination,
        deliveredAt,
        food: decodeFood(world),
      }) + "\n"
    );
    expect(pickedUp).toBe(true);
    expect(deliveredAt).toBeGreaterThan(0);
    expect(
      getVoxelSafe(world.grid, access.destination.x, access.destination.y, access.destination.z)
    ).toBe(Material.FOOD);
    expect(access.destination.y).toBeLessThan(localSurface);
  });

  it("steps 11b-11c: one storm rewards underground rather than surface storage", () => {
    const underground = storageWorld(10_501, true);
    const surface = storageWorld(10_501, false);
    runOneStorm(underground.world);
    runOneStorm(surface.world);
    const undergroundRetained = retained(underground.world, underground.food);
    const surfaceRetained = retained(surface.world, surface.food);

    mkdirSync("test-results", { recursive: true });
    writeFileSync(
      "test-results/storage-ledger.txt",
      JSON.stringify({
        seed: 10_501,
        stormTicks: RAIN.durationTicks,
        cohort: STORAGE_COHORT,
        undergroundRetained,
        surfaceRetained,
      }) + "\n"
    );
    expect(undergroundRetained, "underground food does not wash").toBe(STORAGE_COHORT);
    expect(undergroundRetained, "nest storage retains more of the equal cohort").toBeGreaterThan(
      surfaceRetained
    );
  });
});

describe("Appendix D seeded storage summit", () => {
  it("step 12: noisy RNN crews store food and earn the oracle retention", () => {
    const cases = [12_100, 12_200, 12_300].map(runFunctionalFood);
    mkdirSync("test-results", { recursive: true });
    writeFileSync("test-results/functional-storage-ledger.txt", JSON.stringify({ cases }) + "\n");

    for (const result of cases) {
      expect(result.pickedUp, JSON.stringify(result)).toBe(true);
      expect(result.deposited, JSON.stringify(result)).not.toBeNull();
      expect(result.retention, JSON.stringify(result)).toBe(1);
    }
  });
});
