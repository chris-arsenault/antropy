import { describe, expect, it } from "vitest";
import { foundColony } from "./colony";
import {
  FULL_CONFIG,
  MORTAL_NEST_CONFIG,
  NEST_CONFIG,
  PHASE2_CONFIG,
  REPLACEMENT_NEST_CONFIG,
  VARIATION_NEST_CONFIG,
  configPreset,
  type SimConfig,
} from "./config";
import { rnnController } from "./controller/rnn";
import { COLONY, QUEEN } from "./tunables";
import { createWorld, stepWorld } from "./world";

const APPENDIX_E_BOUNDARIES = [
  "terrainDigging",
  "workerReproduction",
  "colonyFounding",
  "geneticVariation",
] as const satisfies readonly (keyof SimConfig)[];

const APPENDIX_F_BOUNDARIES = [
  "materialColonyOdor",
  "contactFoodOdor",
] as const satisfies readonly (keyof SimConfig)[];

const AUTHORED_FIXTURE_BOUNDARIES = [
  "authoredNestTrail",
] as const satisfies readonly (keyof SimConfig)[];

function changedKeys(left: SimConfig, right: SimConfig): (keyof SimConfig)[] {
  return (Object.keys(left) as (keyof SimConfig)[]).filter((key) => left[key] !== right[key]);
}

describe("Appendix E configuration boundaries", () => {
  it("keeps each newly separated switch independent", () => {
    for (const key of [
      ...APPENDIX_E_BOUNDARIES,
      ...APPENDIX_F_BOUNDARIES,
      ...AUTHORED_FIXTURE_BOUNDARIES,
    ]) {
      const variant = { ...NEST_CONFIG, [key]: !NEST_CONFIG[key] };
      expect(changedKeys(NEST_CONFIG, variant)).toEqual([key]);
    }
  });

  it("defines the authored-nest baseline without later systems", () => {
    expect(NEST_CONFIG.terrainDigging).toBe(false);
    expect(NEST_CONFIG.workerReproduction).toBe(false);
    expect(NEST_CONFIG.colonyFounding).toBe(false);
    expect(NEST_CONFIG.geneticVariation).toBe(false);
    expect(NEST_CONFIG.mortality).toBe(false);
    expect(NEST_CONFIG.seasons).toBe(false);
    expect(NEST_CONFIG.nestDecay).toBe(false);
    expect(NEST_CONFIG.authoredNestTrail).toBe(true);
    expect(PHASE2_CONFIG.authoredNestTrail).toBe(false);
    expect(FULL_CONFIG.workerReproduction).toBe(true);
    expect(FULL_CONFIG.colonyFounding).toBe(true);
    expect(FULL_CONFIG.geneticVariation).toBe(true);
  });

  it("returns a fresh NEST config copy", () => {
    const first = configPreset("nest");
    first.workerReproduction = true;
    expect(configPreset("nest")).toEqual(NEST_CONFIG);
  });

  it("adds only mortality, then the two-part replacement pipeline", () => {
    expect(changedKeys(NEST_CONFIG, MORTAL_NEST_CONFIG)).toEqual(["mortality"]);
    expect(changedKeys(MORTAL_NEST_CONFIG, REPLACEMENT_NEST_CONFIG)).toEqual([
      "workerReproduction",
      "larvalRearing",
    ]);
    expect(configPreset("nest-replacement")).toEqual(REPLACEMENT_NEST_CONFIG);
  });

  it("admits standing variation as one axis after replacement", () => {
    expect(changedKeys(REPLACEMENT_NEST_CONFIG, VARIATION_NEST_CONFIG)).toEqual([
      "geneticVariation",
    ]);
    expect(configPreset("nest-variation")).toEqual(VARIATION_NEST_CONFIG);
  });

  it("keeps worker reproduction active while colony founding is disabled", () => {
    const world = createWorld(4011, rnnController, {
      ...FULL_CONFIG,
      colonyFounding: false,
      autoContinue: false,
    });
    const colony = foundColony(world);
    colony.stockpile = QUEEN.eggThreshold + 2;
    colony.lastQueenEggTick = -QUEEN.eggIntervalMin;
    colony.lastEggTick = -COLONY.eggIntervalMin;

    stepWorld(world);

    expect(world.eggs.some((egg) => egg.queenDestined === 1)).toBe(false);
    expect(world.eggs.some((egg) => egg.queenDestined === 0)).toBe(true);
  });
});
