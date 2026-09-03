import { appendFileSync, mkdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { foundColony } from "./colony";
import { LADDER_STEP10D_CONFIG } from "./config";
import { OUTPUT_COUNT } from "./controller/contract";
import { rnnController } from "./controller/rnn";
import { classifyNest } from "./nestMetrics";
import { bestCavityCohortSurvival } from "./oracles/broodLedger";
import {
  DEFAULT_THERMAL_BUILDER_OPTIONS,
  makeThermalBuilder,
  type ThermalBuilderOptions,
} from "./oracles/thermalBuilder";
import { premarkDigSite } from "./oracles/digSite";
import { EGG_EXPOSURE } from "./tunables";
import { microclimateMultiplier } from "./weather";
import { createWorld, stepWorld, type World } from "./world";

const HARSH_MIDDAY_TICK = 30_500;
const CONSTRUCTION_TICKS = 1_200;
const OBSERVATION_TICKS = 600;
const COHORT_SIZE = 3;

function foundedWorld(seed: number): World {
  const world = createWorld(seed, rnnController, {
    ...LADDER_STEP10D_CONFIG,
    mortality: false,
    reproduction: false,
    motorJitter: true,
  });
  world.tick = HARSH_MIDDAY_TICK - CONSTRUCTION_TICKS;
  world.foodBase = 0;
  world.foodTarget = 0;
  const colony = foundColony(world);
  const mouthY = world.surfaceMap[colony.z * world.grid.sizeX + colony.x] + 1;
  premarkDigSite(world, colony.x, mouthY, colony.z, colony.id);
  return world;
}

function foundedPair(seed: number): { control: World; treatment: World } {
  return { control: foundedWorld(seed), treatment: foundedWorld(seed) };
}

function safeCavityCount(world: World, tick: number): number {
  const previousTick = world.tick;
  world.tick = tick;
  let safe = 0;
  for (const index of world.cavities) {
    const x = index % world.grid.sizeX;
    const yz = Math.floor(index / world.grid.sizeX);
    const position = { x, y: Math.floor(yz / world.grid.sizeZ), z: yz % world.grid.sizeZ };
    safe += microclimateMultiplier(world, position) <= EGG_EXPOSURE.safeMultiplier ? 1 : 0;
  }
  world.tick = previousTick;
  return safe;
}

function totalWorkerEnergy(world: World): number {
  return world.ants.reduce((sum, ant) => sum + ant.energy, 0);
}

interface ConstructionCase {
  seed: number;
  label: string;
  overflowCrowding: number;
  signalRole: ThermalBuilderOptions["signalRole"];
  inhibitionSignal: number;
}

const CONSTRUCTION_CASES: ConstructionCase[] = [10_401, 10_402, 10_403].flatMap((seed) => [
  {
    seed,
    label: "template-only",
    overflowCrowding: Number.POSITIVE_INFINITY,
    signalRole: "completed-work",
    inhibitionSignal: Number.POSITIVE_INFINITY,
  },
  {
    seed,
    label: "template-plus-crowding",
    overflowCrowding: 0.25,
    signalRole: "completed-work",
    inhibitionSignal: Number.POSITIVE_INFINITY,
  },
  {
    seed,
    label: "template-plus-completed-work-inhibition",
    overflowCrowding: 0.25,
    signalRole: "completed-work",
    inhibitionSignal: 0.1,
  },
  {
    seed,
    label: "template-plus-return-traffic-allocation",
    overflowCrowding: 0.25,
    signalRole: "return-traffic",
    inhibitionSignal: 0.1,
  },
]);

function measureConstruction(options: ConstructionCase): void {
  const { control, treatment } = foundedPair(options.seed);
  treatment.policyOverride = makeThermalBuilder({
    ...DEFAULT_THERMAL_BUILDER_OPTIONS,
    overflowCrowding: options.overflowCrowding,
    signalRole: options.signalRole,
    inhibitionSignal: options.inhibitionSignal,
  });
  const idle = new Float32Array(OUTPUT_COUNT);
  control.policyOverride = () => idle;

  for (let tick = 0; tick < CONSTRUCTION_TICKS; tick++) {
    stepWorld(control);
    stepWorld(treatment);
  }

  const controlSafe = safeCavityCount(control, HARSH_MIDDAY_TICK);
  const treatmentSafe = safeCavityCount(treatment, HARSH_MIDDAY_TICK);
  const controlSurvival = bestCavityCohortSurvival(
    control,
    COHORT_SIZE,
    HARSH_MIDDAY_TICK,
    OBSERVATION_TICKS
  );
  const treatmentSurvival = bestCavityCohortSurvival(
    treatment,
    COHORT_SIZE,
    HARSH_MIDDAY_TICK,
    OBSERVATION_TICKS
  );
  const morphology = classifyNest(treatment);
  mkdirSync("test-results", { recursive: true });
  appendFileSync(
    "test-results/thermal-construction.txt",
    JSON.stringify({
      seed: options.seed,
      label: options.label,
      addedCavities: treatment.cavities.size - control.cavities.size,
      controlSafe,
      treatmentSafe,
      controlSurvival,
      treatmentSurvival,
      workerEnergyDelta: totalWorkerEnergy(treatment) - totalWorkerEnergy(control),
      morphology,
    }) + "\n"
  );

  expect(treatment.cavities.size).toBeGreaterThan(control.cavities.size);
  expect(treatmentSurvival).toBeGreaterThanOrEqual(controlSurvival);
}

describe("local thermal construction oracle", () => {
  it.each(CONSTRUCTION_CASES)(
    "$label measures construction opportunity from founded world $seed",
    measureConstruction
  );
});
