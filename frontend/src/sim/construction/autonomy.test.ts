import { expect, it } from "vitest";
import { constructionFixture } from "./fixture";
import { FORAGER_CONFIG } from "../config";
import { actColonyWorker } from "../colony/actors";
import { climateMesh, meshIndex } from "../climate/mesh";
import { observeHabitat, siteIdentity } from "./habitat";
import { observePressures, PRESSURE_FEATURE_NAMES } from "./pressureObservation";
import { cellIndex } from "../grid";
import { WAIT } from "../colony/contract";

function fixture(driver: "colony-programmed" | "colony-lgp", capacity = 96) {
  return constructionFixture(driver, 1, {
    cacheCapacity: capacity,
    workerCount: 2,
    environment: {
      ...FORAGER_CONFIG.environment,
      autonomousConstruction: true,
      microclimate: true,
    },
  }).world;
}

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s leaves mild space alone and selects observed shelter under heat without manual orders",
  (driver) => {
    const mild = fixture(driver);
    actColonyWorker(mild, mild.ant);
    expect(mild.construction.jobs).toHaveLength(0);
    const world = fixture(driver),
      mesh = climateMesh(world.grid, world.config);
    world.climate.temperature[meshIndex(mesh, world.queen.x, world.queen.y)] = 40;
    actColonyWorker(world, world.ant);
    expect(world.construction.interventions).toBe(0);
    expect(world.construction.jobs).toHaveLength(1);
    expect(world.construction.jobs[0]).toMatchObject({
      kind: "queen",
      origin: "controller",
      owner: world.ant.id,
    });
  }
);

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s accounts pending storage before another worker chooses to build",
  (driver) => {
    const world = fixture(driver, 8);
    Object.assign(world.ants[0], { x: 39, y: 21 });
    Object.assign(world.ants[1], { x: 41, y: 21 });
    actColonyWorker(world, world.ants[0]);
    actColonyWorker(world, world.ants[1]);
    expect(world.construction.jobs.filter((job) => job.kind === "cache")).toHaveLength(1);
  }
);

it("retains timestamped climate observations until another visit instead of reading remote fields", () => {
  const world = fixture("colony-programmed");
  observeHabitat(world, world.ant);
  const id = siteIdentity(cellIndex(world.grid, 22, 21));
  const record = world.habitat.sites.get(id)!;
  const mesh = climateMesh(world.grid, world.config);
  world.climate.temperature[meshIndex(mesh, 22, 21)] = 40;
  world.ant.x = 40;
  const inputs = observePressures(
    world,
    world.ant
  )({
    ...WAIT,
    kind: "propose",
    destination: id,
    proposal: { kind: "queen", dump: id, source: null },
  });
  expect(inputs[PRESSURE_FEATURE_NAMES.indexOf("siteTemperature")]).toBe(record.temperature);
  expect(record.temperature).toBe(24);
});
