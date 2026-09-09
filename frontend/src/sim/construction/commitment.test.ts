import { expect, it } from "vitest";
import { constructionFixture } from "./fixture";
import { requestConstruction } from "./sites";
import { applyRequest } from "../colony/resolve";
import { WAIT } from "../colony/contract";
import { actColonyWorker } from "../colony/actors";
import { cellIndex, setBacking } from "../grid";
import { Material } from "../materials";
import { FORAGER_CONFIG } from "../config";
import { observeHabitat } from "./habitat";

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s finishes cache work without acquiring unrelated spoil",
  (driver) => {
    const { world } = constructionFixture(driver, 1, {
      environment: {
        ...FORAGER_CONFIG.environment,
        collectiveWork: true,
        autonomousConstruction: true,
      },
    });
    const job = requestConstruction(world, "cache", { x: 24, y: 21 }, { x: 24, y: 21 });
    applyRequest(world, world.ant, { ...WAIT, kind: "claim", destination: job.id });
    world.construction.loose.set(cellIndex(world.grid, 22, 21), [Material.SOIL]);
    actColonyWorker(world, world.ant);
    expect(world.ant.decision.history.at(-1)?.request.kind).toBe("create-cache");
    actColonyWorker(world, world.ant);
    expect(job.status).toBe("done");
    expect(world.ant.spoil).toBeNull();
  }
);

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s follows its hungry brood route past a satisfied queen",
  (driver) => {
    const { world } = constructionFixture(driver, 1, {
      environment: { ...FORAGER_CONFIG.environment, autonomousConstruction: true },
    });
    world.brood.push({ id: 1, x: 35, y: 21, stage: "larva", age: 0, energy: 2, investment: 0 });
    world.ant.x = 33;
    observeHabitat(world, world.ant);
    Object.assign(world.ant, { x: 25, y: 23, cargo: 0.1 });
    applyRequest(world, world.ant, { ...WAIT, kind: "acquire", destination: -100000001, task: 18 });
    actColonyWorker(world, world.ant);
    expect(world.ant.decision.history.at(-1)?.request.kind).toBe("forward");
    expect(world.ant.decision.route?.destination).toBe(-100000001);
  }
);

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s carries spoil away from the entrance before dumping",
  (driver) => {
    const { world } = constructionFixture(driver, 1, {
      environment: {
        ...FORAGER_CONFIG.environment,
        collectiveWork: true,
        autonomousConstruction: true,
      },
    });
    for (let x = 30; x < 56; x++)
      for (let y = 21; y < 29; y++) setBacking(world.grid, x, y, Material.AIR);
    world.knowledge.locations.set(-1, {
      id: -1,
      x: 30,
      y: 21,
      kind: "entrance",
      quantity: 0,
      backed: false,
      observedAt: null,
    });
    Object.assign(world.ant, { x: 31, y: 21, spoil: Material.SOIL });
    actColonyWorker(world, world.ant);
    expect(world.ant.spoil).toBe(Material.SOIL);
    expect(world.ant.x).toBeGreaterThan(31);
  }
);
