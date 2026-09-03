import { describe, expect, it } from "vitest";
import { type Ant } from "./ant";
import {
  LADDER_STEP10C_CONFIG,
  LADDER_STEP10D_CONFIG,
  LADDER_STEP10D_PRIME_CONFIG,
  type SimConfig,
} from "./config";
import { OUTPUT_COUNT } from "./controller/contract";
import { rnnController } from "./controller/rnn";
import { addEgg, STAGE_EGG, stepEggs, type Egg } from "./eggs";
import { Material } from "./materials";
import { COLONY } from "./tunables";
import { createWorld, mutateVoxel, spawnAnt, stepWorld, type World } from "./world";

const SITE = { x: 96, z: 96 } as const;
const MIDDAY_TICK = 2_500;

function addTestEgg(world: World, y: number): Egg {
  const egg: Egg = {
    id: world.nextEggId++,
    ...SITE,
    y,
    carrierId: null,
    genome: rnnController.seed(world.rng),
    energy: 0.2,
    incubationRemaining: 100_000,
    stage: STAGE_EGG,
    fedProgress: 0,
    hungerTicks: 0,
    sex: 0,
    queenDestined: 0,
    lineageId: 0,
    patrilineId: 0,
    motherId: 0,
    fatherId: 0,
  };
  addEgg(world, egg);
  return egg;
}

function broodArena(config: SimConfig, seed: number, depth: number) {
  const world = createWorld(seed, rnnController, config);
  world.tick = MIDDAY_TICK;
  const surface = world.surfaceMap[SITE.z * world.grid.sizeX + SITE.x];
  const y = surface - depth;
  mutateVoxel(world, SITE.x, y, SITE.z, Material.AIR);
  return { world, egg: addTestEgg(world, y), y };
}

function spawnIdleAnt(world: World, y: number): Ant {
  const genome = rnnController.seed(world.rng);
  const ant = spawnAnt(world, {
    ...SITE,
    y,
    heading: 0,
    energy: 1,
    lineageId: 0,
    patrilineId: 0,
    motherId: 0,
    fatherId: 0,
    genome,
    controllerState: rnnController.createState(),
    traits: rnnController.physical(genome),
  });
  const idle = new Float32Array(OUTPUT_COUNT);
  world.policyOverride = () => idle;
  return ant;
}

describe("Appendix D exposure ladder", () => {
  it("step 10d-prime admits microclimate before exposure and measures adult cost", () => {
    const base = broodArena(LADDER_STEP10C_CONFIG, 10_302, 6);
    const admitted = broodArena(LADDER_STEP10D_PRIME_CONFIG, 10_302, 6);
    const baseAnt = spawnIdleAnt(base.world, base.y);
    const admittedAnt = spawnIdleAnt(admitted.world, admitted.y);

    for (let tick = 0; tick < 100; tick++) {
      stepWorld(base.world);
      stepWorld(admitted.world);
    }

    expect(admitted.world.config.microclimate).toBe(true);
    expect(admitted.world.config.eggExposure).toBe(false);
    expect(admittedAnt.energy).toBeLessThan(baseAnt.energy);
  });

  it("step 10d measures live exposure without asserting a target shape", () => {
    const { world, egg } = broodArena(LADDER_STEP10D_CONFIG, 10_301, 8);

    expect(world.config.microclimate).toBe(true);
    expect(world.config.eggExposure).toBe(true);
    for (let tick = 0; tick < COLONY.incubationTicks; tick++) {
      stepEggs(world);
    }

    expect(world.eggs).toContain(egg);
    expect(world.eggsPerished / world.eggsLaid).toBe(0);
  });
});
