import { expect, it } from "vitest";
import { constructionFixture } from "./fixture";
import { FORAGER_CONFIG } from "../config";
import { setCell, setBacking, cellIndex } from "../grid";
import { Material } from "../materials";
import { observeHabitat, siteIdentity } from "./habitat";
import { observePressures, PRESSURE_FEATURE_NAMES } from "./pressureObservation";
import { F, OBSERVATION_NAMES } from "../colony/observation";
import { WAIT, type Request } from "../colony/contract";
import { PRESSURE_SCORE } from "../controller/linear/pressureSeed";
import { evaluate } from "../controller/linear/expression";
import { climateMesh, meshIndex } from "../climate/mesh";
import { type World } from "../types";
import { observeSpace } from "./spaceObservation";
import { availableSites } from "./habitat";

function fixture() {
  const result = constructionFixture("colony-programmed", 1, {
    environment: {
      ...FORAGER_CONFIG.environment,
      autonomousConstruction: true,
      microclimate: true,
    },
  });
  for (let x = 18; x <= 20; x++) {
    setCell(result.world.grid, x, 20, Material.ROCK);
    setCell(result.world.grid, x, 21, Material.AIR);
    setBacking(result.world.grid, x, 21, Material.AIR);
  }
  visit(result.world, 19);
  return result;
}

function visit(world: World, x: number, y = 21) {
  Object.assign(world.ant, { x, y });
  observeHabitat(world, world.ant);
}

function score(
  world: World,
  kind: NonNullable<Request["proposal"]>["kind"],
  x: number,
  y = 21,
  source: number | null = null
) {
  const destination = siteIdentity(cellIndex(world.grid, x, y));
  const values = observePressures(
    world,
    world.ant
  )({
    ...WAIT,
    kind: "propose",
    destination,
    proposal: { kind, dump: siteIdentity(cellIndex(world.grid, 18, 21)), source },
  });
  const inputs = Array(OBSERVATION_NAMES.length).fill(0) as number[];
  PRESSURE_FEATURE_NAMES.forEach((name, i) => {
    inputs[F[name]] = values[i];
  });
  inputs[F.action] = 25;
  inputs[F.energy] = 0.8;
  return evaluate(PRESSURE_SCORE, inputs);
}

it("expands adjoining floor under nursery pressure without excavating an unrelated floor pit", () => {
  const { world } = fixture();
  for (const x of [23, 27]) setCell(world.grid, x, 21, Material.SOIL);
  setCell(world.grid, 26, 20, Material.SOIL);
  setBacking(world.grid, 20, 21, Material.AIR);
  world.brood.push({ id: 1, x: 24, y: 21, stage: "egg", age: 0, energy: 2, investment: 0 });
  visit(world, 21);
  visit(world, 26);
  expect(score(world, "dig", 27)).toBeGreaterThan(0);
  expect(score(world, "dig", 26, 20)).toBeLessThan(0);
});

it("keeps a cooler portal out of queen placement while allowing cooler interior floor", () => {
  const { world } = fixture(),
    mesh = climateMesh(world.grid, world.config);
  world.climate.temperature[meshIndex(mesh, 25, 21)] = 40;
  setBacking(world.grid, 21, 21, Material.AIR);
  visit(world, 22);
  visit(world, 24);
  expect(score(world, "queen", 24)).toBeGreaterThan(0);
  expect(score(world, "queen", 22)).toBeLessThan(0);
});

it("requires a larger preservation improvement for a long cache relocation", () => {
  const { world, source } = fixture(),
    mesh = climateMesh(world.grid, world.config);
  for (const x of [28, 42]) {
    const index = meshIndex(mesh, x, 21);
    world.climate.water[index] = mesh.waterCapacity[index] * 0.1;
    visit(world, x);
  }
  visit(world, 39);
  expect(score(world, "move-cache", 42, 21, source)).toBeGreaterThan(0);
  expect(score(world, "move-cache", 28, 21, source)).toBeLessThan(0);
});

it("keeps an unfinished floor extension unavailable until its worker headroom is cleared", () => {
  const { world } = fixture();
  for (const x of [23, 27]) setCell(world.grid, x, 21, Material.SOIL);
  setCell(world.grid, 27, 22, Material.SOIL);
  world.brood.push({ id: 1, x: 24, y: 21, stage: "egg", age: 0, energy: 2, investment: 0 });
  visit(world, 26);
  expect(score(world, "dig", 27)).toBeGreaterThan(0);
  setCell(world.grid, 27, 21, Material.AIR);
  visit(world, 26);
  const id = siteIdentity(cellIndex(world.grid, 27, 21));
  expect(observeSpace(world, availableSites(world)).usable(world.habitat.sites.get(id)!)).toBe(
    false
  );
  expect(score(world, "dig", 27, 22)).toBeGreaterThan(0);
  setCell(world.grid, 27, 22, Material.AIR);
  visit(world, 26);
  expect(observeSpace(world, availableSites(world)).usable(world.habitat.sites.get(id)!)).toBe(
    true
  );
});
