import { appendFileSync, mkdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { foundColony, type Colony } from "./colony";
import { LADDER_STEP10D_CONFIG } from "./config";
import { rnnController } from "./controller/rnn";
import { addEgg, findEggSpot, STAGE_EGG, type Egg } from "./eggs";
import { classifyNest } from "./nestMetrics";
import { premarkDigSite } from "./oracles/digSite";
import {
  makeThermalBroodCarrier,
  makeThermalBuilder,
  type ThermalBuilderOptions,
} from "./oracles/thermalBuilder";
import { COLONY, EGG_EXPOSURE } from "./tunables";
import { createWorld, stepWorld, type World } from "./world";

const HARSH_MIDDAY_TICK = 30_500;
const CONSTRUCTION_TICKS = 1_200;
const COHORT_SIZE = 6;
const COHORT_MOTHER_ID = -10_500;
const POLICY: ThermalBuilderOptions = {
  safeTemperature: (EGG_EXPOSURE.safeMultiplier - 1) / 9,
  overflowCrowding: 0.25,
  workSignal: 0.5,
  signalRole: "completed-work",
  inhibitionSignal: 0.1,
};

interface CohortTrace {
  pickedUp: Set<number>;
  delivered: Set<number>;
  carriers: Map<number, number | null>;
}

function foundedWorld(
  seed: number,
  constructionPolicy: ThermalBuilderOptions | null
): { world: World; colony: Colony } {
  const world = createWorld(seed, rnnController, {
    ...LADDER_STEP10D_CONFIG,
    reproduction: false,
    motorJitter: true,
  });
  world.tick = HARSH_MIDDAY_TICK - CONSTRUCTION_TICKS;
  world.foodBase = 0;
  world.foodTarget = 0;
  const colony = foundColony(world);
  if (constructionPolicy !== null) {
    const mouthY = world.surfaceMap[colony.z * world.grid.sizeX + colony.x] + 1;
    premarkDigSite(world, colony.x, mouthY, colony.z, colony.id);
  }
  world.policyOverride = makeThermalBuilder(constructionPolicy ?? POLICY);
  return { world, colony };
}

function addCohort(world: World, colony: Colony): number[] {
  const ids: number[] = [];
  for (let index = 0; index < COHORT_SIZE; index++) {
    const spot = findEggSpot(world, colony.x, colony.y, colony.z);
    if (!spot) {
      throw new Error(`founding chamber has room for only ${index} cohort eggs`);
    }
    const egg: Egg = {
      id: world.nextEggId++,
      ...spot,
      carrierId: null,
      genome: colony.queenGenome,
      energy: 0.3,
      incubationRemaining: COLONY.incubationTicks,
      stage: STAGE_EGG,
      fedProgress: 0,
      hungerTicks: 0,
      sex: 0,
      queenDestined: 0,
      lineageId: colony.id,
      patrilineId: 1,
      motherId: COHORT_MOTHER_ID,
      fatherId: 1,
    };
    addEgg(world, egg);
    ids.push(egg.id);
  }
  return ids;
}

function traceCohort(world: World, ids: ReadonlySet<number>, trace: CohortTrace): void {
  for (const egg of world.eggs) {
    if (!ids.has(egg.id)) {
      continue;
    }
    const previous = trace.carriers.get(egg.id) ?? null;
    if (egg.carrierId !== null) {
      trace.pickedUp.add(egg.id);
    } else if (previous !== null) {
      trace.delivered.add(egg.id);
    }
    trace.carriers.set(egg.id, egg.carrierId);
  }
}

function cohortSurvivors(world: World): number {
  const eggs = world.eggs.filter((egg) => egg.motherId === COHORT_MOTHER_ID).length;
  const hatched = world.ants.filter((ant) => ant.alive && ant.motherId === COHORT_MOTHER_ID).length;
  return eggs + hatched;
}

function runArm(seed: number, constructionPolicy: ThermalBuilderOptions | null) {
  const { world, colony } = foundedWorld(seed, constructionPolicy);
  for (let tick = 0; tick < CONSTRUCTION_TICKS; tick++) {
    stepWorld(world);
  }
  const ids = new Set(addCohort(world, colony));
  const trace: CohortTrace = {
    pickedUp: new Set(),
    delivered: new Set(),
    carriers: new Map([...ids].map((id) => [id, null])),
  };
  world.policyOverride = makeThermalBroodCarrier(POLICY.safeTemperature);
  for (let tick = 0; tick < COLONY.incubationTicks; tick++) {
    stepWorld(world);
    traceCohort(world, ids, trace);
  }
  return {
    survival: cohortSurvivors(world) / COHORT_SIZE,
    pickedUp: trace.pickedUp.size,
    delivered: trace.delivered.size,
    workersAlive: world.ants.filter((ant) => ant.motherId !== COHORT_MOTHER_ID).length,
    workerEnergy: world.ants
      .filter((ant) => ant.motherId !== COHORT_MOTHER_ID)
      .reduce((sum, ant) => sum + ant.energy, 0),
    cavities: world.cavities.size,
    morphology: classifyNest(world),
  };
}

describe("paired brood construction ledger", () => {
  it.each([10_401, 10_402, 10_403])("measures a fixed live cohort in founded world %i", (seed) => {
    const control = runArm(seed, null);
    const completedWork = runArm(seed, POLICY);

    mkdirSync("test-results", { recursive: true });
    appendFileSync(
      "test-results/founded-brood-ledger.txt",
      JSON.stringify({
        seed,
        cohortSize: COHORT_SIZE,
        constructionTicks: CONSTRUCTION_TICKS,
        observationTicks: COLONY.incubationTicks,
        treatment: completedWork,
        control,
      }) + "\n"
    );

    expect(control.pickedUp).toBeGreaterThan(0);
    expect(completedWork.pickedUp).toBeGreaterThan(0);
    expect(completedWork.delivered).toBeGreaterThan(0);
    expect(completedWork.survival).toBeGreaterThan(control.survival);
  });
});
