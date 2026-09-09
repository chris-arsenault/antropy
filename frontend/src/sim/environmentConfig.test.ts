import { describe, expect, it } from "vitest";
import { FORAGER_CONFIG, terrainConfig, type SimConfig } from "./config";
import { BASELINE_ENVIRONMENT } from "./environmentConfig";
import { buildEnvironment } from "./nest";
import { createRandomState } from "./random";
import { Material } from "./materials";
import { createWorld, stepWorld } from "./world";
import { type World } from "./types";

const SMALL: SimConfig = { ...FORAGER_CONFIG, width: 512, foodCount: 12 };

function build(config: SimConfig) {
  return buildEnvironment(config, createRandomState(101));
}

function materialCells(cells: Uint8Array, material: Material): number[] {
  const indices: number[] = [];
  cells.forEach((value, index) => {
    if (value === material) indices.push(index);
  });
  return indices;
}

function expectStateEqual(actual: World, expected: World): void {
  expect(actual.tick).toBe(expected.tick);
  expect(actual.ants).toEqual(expected.ants);
  expect(actual.economy).toEqual(expected.economy);
  expect(actual.food).toEqual(expected.food);
  for (const key of ["foodOdor", "nestOdor", "pheromoneA", "pheromoneB", "freshAir"] as const)
    expect(actual[key].values).toEqual(expected[key].values);
}

describe("independent environment configuration", () => {
  it("changes nest shape without moving the surface, food or world dimensions", () => {
    const original = build(SMALL);
    const changed = build({
      ...SMALL,
      environment: { ...SMALL.environment, nestShape: "compact" },
    });
    expect(changed.grid.width).toBe(original.grid.width);
    expect(changed.grid.height).toBe(original.grid.height);
    expect(changed.nest.chambers).toHaveLength(6);
    expect(original.nest.chambers).toHaveLength(8);
    const exposed = (_value: number, index: number) =>
      original.grid.backing[index] === Material.AIR;
    expect(changed.grid.cells.filter(exposed)).toEqual(original.grid.cells.filter(exposed));
    expect(changed.grid.backing).toEqual(original.grid.backing);
    expect(changed.foodSources).toEqual(original.foodSources);
  });

  it("changes soil pockets without changing wood geometry or food placement", () => {
    const config = { ...terrainConfig("tiered", SMALL), height: 256, surfaceBase: 160 };
    const pockets = build(config);
    const homogeneous = build({
      ...config,
      environment: { ...config.environment, soilPockets: false },
    });
    expect(pockets.grid.cells).toContain(Material.CLAY);
    expect(homogeneous.grid.cells).not.toContain(Material.CLAY);
    const wood = materialCells(pockets.grid.cells, Material.WOOD);
    expect(wood.length).toBeGreaterThan(0);
    expect(materialCells(homogeneous.grid.cells, Material.WOOD)).toEqual(wood);
    expect(pockets.foodSources).toEqual(homogeneous.foodSources);
  });

  it.each([
    { support: "column" as const },
    { odorTransport: "supported" as const },
    { chemicalSensing: "supported" as const },
  ])("changes physical rules without regenerating different geometry: %j", (change) => {
    const original = build(SMALL);
    const changed = build({ ...SMALL, environment: { ...SMALL.environment, ...change } });
    expect(changed.grid.cells).toEqual(original.grid.cells);
    expect(changed.grid.backing).toEqual(original.grid.backing);
    expect(changed.nest).toEqual(original.nest);
    expect(changed.foodSources).toEqual(original.foodSources);
  });
});

describe("per-world configuration isolation", () => {
  it("snapshots and freezes each world's nested configuration", () => {
    const config = structuredClone(SMALL);
    const world = createWorld(101, "programmed", config, false);
    expect(world.config).not.toBe(config);
    expect(world.config.environment).not.toBe(config.environment);
    expect(world.config.chemistry.odor).not.toBe(config.chemistry.odor);
    expect(Object.isFrozen(world.config)).toBe(true);
    expect(Object.isFrozen(world.config.environment)).toBe(true);
    expect(Object.isFrozen(world.config.chemistry.odor)).toBe(true);
    Object.assign(config.environment, { support: "column" });
    Object.assign(config.chemistry.odor, { diffusion: 0.1 });
    expect(world.config.environment.support).toBe(SMALL.environment.support);
    expect(world.config.chemistry.odor.diffusion).toBe(SMALL.chemistry.odor.diffusion);
  });

  it("interleaves differently configured worlds without changing either trajectory", () => {
    const left = { ...SMALL, chemistryInterval: 1 };
    const right: SimConfig = {
      ...left,
      environment: BASELINE_ENVIRONMENT,
      chemistry: {
        ...left.chemistry,
        odor: { ...left.chemistry.odor, diffusion: 0.1, evaporation: 0.9 },
      },
    };
    const separate = [left, right].map((config) => createWorld(101, "programmed", config, false));
    const interleaved = [left, right].map((config) =>
      createWorld(101, "programmed", config, false)
    );
    for (const world of separate) for (let tick = 0; tick < 10; tick++) stepWorld(world);
    for (let tick = 0; tick < 10; tick++) for (const world of interleaved) stepWorld(world);
    expectStateEqual(interleaved[0], separate[0]);
    expectStateEqual(interleaved[1], separate[1]);
    expect(separate[0].foodOdor.values).not.toEqual(separate[1].foodOdor.values);
  });
});
