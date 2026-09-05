import { describe, expect, it } from "vitest";
import { foundColony } from "./colony";
import { addEgg, STAGE_EGG, STAGE_LARVA, stepEggs } from "./eggs";
import { rnnController } from "./controller/rnn";
import { getVoxel } from "./grid";
import { Material } from "./materials";
import { COLONY, LARVA } from "./tunables";
import { createWorld, type World } from "./world";

function chamberLarva(world: World, lineageId: number) {
  const colony = world.colonies[0];
  const egg = {
    id: world.nextEggId++,
    x: colony.x + 1,
    y: colony.y,
    z: colony.z,
    genome: rnnController.seed(world.rng),
    energy: 1,
    incubationRemaining: 3,
    stage: STAGE_EGG,
    fedProgress: 0,
    hungerTicks: 0,
    sex: 0,
    queenDestined: 0,
    lineageId,
    patrilineId: 1,
    motherId: 1,
    fatherId: 1,
  };
  addEgg(world, egg);
  return { egg, colony };
}

describe("larval rearing (brood-as-capital, ADR-0011)", () => {
  it("incubates into a larva, draws stockpile feedings, and pupates", () => {
    const world = createWorld(7020);
    foundColony(world);
    world.ants = [];
    const { egg, colony } = chamberLarva(world, world.colonies[0].id);
    colony.stockpile = 5;

    for (let t = 0; t < 4; t++) {
      stepEggs(world);
    }
    expect(egg.stage).toBe(STAGE_LARVA);

    const stockBefore = colony.stockpile;
    const fedBefore = egg.fedProgress;
    const investedBefore = world.metrics.larvalEnergyInvested;
    stepEggs(world);
    expect(colony.stockpile).toBeCloseTo(stockBefore - LARVA.feedPerTick, 6);
    expect(egg.fedProgress).toBeCloseTo(fedBefore + LARVA.feedPerTick, 6);
    expect(world.metrics.larvalEnergyInvested - investedBefore).toBeCloseTo(LARVA.feedPerTick, 6);

    egg.fedProgress = LARVA.rearingCost;
    const burnedBefore = world.metrics.energyBurned;
    const capitalBefore = colony.stockpile + egg.energy + egg.fedProgress;
    stepEggs(world);
    expect(world.eggs.length).toBe(0);
    expect(world.ants.length).toBe(1);
    expect(world.metrics.workerBirths).toBe(1);
    expect(world.metrics.metamorphosisEnergyBurned).toBeCloseTo(LARVA.rearingCost, 6);
    expect(world.metrics.energyBurned - burnedBefore).toBeCloseTo(LARVA.rearingCost, 6);
    expect(capitalBefore - (colony.stockpile + world.ants[0].energy)).toBeCloseTo(
      world.metrics.energyBurned - burnedBefore,
      6
    );
  });

  it("starves past the grace window into FOOD when the crop is dry", () => {
    const world = createWorld(7021);
    foundColony(world);
    world.ants = [];
    const { egg, colony } = chamberLarva(world, world.colonies[0].id);
    colony.stockpile = COLONY.queenReserve; // nothing spare for brood
    egg.stage = STAGE_LARVA;

    for (let t = 0; t <= LARVA.starvationGraceTicks + 1 && world.eggs.length > 0; t++) {
      stepEggs(world);
    }
    expect(world.eggs.length).toBe(0);
    expect(world.eggsPerished).toBe(1);
    expect(getVoxel(world.grid, egg.x, egg.y, egg.z)).toBe(Material.FOOD);
  });
});
