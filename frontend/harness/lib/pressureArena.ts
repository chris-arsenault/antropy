import { constructionFixture } from "../../src/sim/construction/fixture";
import { FORAGER_CONFIG } from "../../src/sim/config";
import { Material } from "../../src/sim/materials";
import { setCell } from "../../src/sim/grid";
import { totalEnergy } from "../../src/sim/resources";
import { createClimate } from "../../src/sim/climate/state";
import { climateMesh, meshIndex } from "../../src/sim/climate/mesh";
import { type World } from "../../src/sim/types";

/** Authored pressure assay, with accounted founder reserves; not a self-sustaining ecosystem. */
export function pressureArena(
  driver: "colony-programmed" | "colony-lgp",
  seed: number,
  condition: string,
  excavation: boolean
) {
  const { world } = constructionFixture(driver, seed, {
    workerCount: 4,
    metabolism: 0.0005,
    queenMetabolism: 0.001,
    broodMetabolism: 0.0001,
    cacheCapacity: condition === "storage" ? 8 : 96,
    environment: {
      ...FORAGER_CONFIG.environment,
      autonomousConstruction: true,
      microclimate: true,
      climateEffects: true,
      foodSpoilage: true,
      excavation,
    },
    climate: {
      ...FORAGER_CONFIG.climate,
      cellSize: 1,
      temperatureAmplitude: 0,
      atmosphereMoisture: 0.65,
      initialMoisture: 0.65,
    },
  });
  world.ants.forEach((ant, index) => Object.assign(ant, { x: 23 + index * 6, y: 21, age: 0 }));
  populateArena(world, condition);
  world.climate = createClimate(world.grid, world.config);
  conditionClimate(world, condition);
  world.economy.initial = totalEnergy(world);
  return world;
}

function populateArena(world: World, condition: string): void {
  if (["crowded", "confined"].includes(condition)) {
    for (const x of [22, 24, 26, 27, 28])
      world.brood.push({
        id: world.nextBroodId++,
        x,
        y: 21,
        stage: "egg",
        age: 0,
        energy: 2,
        investment: 0,
      });
    for (const x of [21, 29]) setCell(world.grid, x, 21, Material.SOIL);
  }
  if (condition === "confined") confineArena(world);
  if (condition === "shelter") setCell(world.grid, 21, 21, Material.SOIL);
}

function confineArena(world: World): void {
  for (let x = 20; x < 44; x++)
    if ((x < 22 || x > 28) && x !== 40) setCell(world.grid, x, 21, Material.SOIL);
  Object.assign(world.ants[1], { x: 31, y: 22 });
  Object.assign(world.ants[2], { x: 35, y: 22 });
  Object.assign(world.ants[3], { x: 47, y: 21 });
}

function conditionClimate(world: World, condition: string): void {
  if (condition === "thermal") for (let x = 24; x <= 27; x++) heatCell(world, x, 21);
  if (condition === "shelter") heatArena(world);
  if (condition !== "damp-storage") return;
  const mesh = climateMesh(world.grid, world.config),
    index = meshIndex(mesh, 40, 21);
  const added = mesh.waterCapacity[index] - world.climate.water[index];
  world.climate.water[index] += added;
  world.climate.initialWater += added;
}

function heatCell(world: World, x: number, y: number): void {
  const mesh = climateMesh(world.grid, world.config),
    index = meshIndex(mesh, x, y);
  world.climate.temperature[index] = 40;
  world.climate.initialHeat += 16 * mesh.heatCapacity[index];
}

function heatArena(world: World): void {
  for (let y = 21; y < 29; y++)
    for (let x = 20; x < 56; x++)
      if (world.grid.cells[y * world.grid.width + x] !== Material.SOIL) heatCell(world, x, y);
}
