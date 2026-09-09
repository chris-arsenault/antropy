import { expect, it } from "vitest";
import { constructionFixture } from "./fixture";
import { requestConstruction, addCache } from "./sites";
import { applyRequest } from "../colony/resolve";
import { WAIT } from "../colony/contract";
import { actColonyWorker } from "../colony/actors";
import { observeCandidates, F } from "../colony/observation";
import { REQUESTS } from "../colony/contract";
import { linearController } from "../controller/linear/controller";
import { all, compile, eq, input } from "../controller/linear/expression";
import { setCell } from "../grid";
import { Material } from "../materials";
import { observeHabitat } from "./habitat";
import { FORAGER_CONFIG } from "../config";

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s prioritizes an observed depleted queen over a less depleted larva",
  (driver) => {
    const { world } = constructionFixture(driver, 1, {
      environment: { ...FORAGER_CONFIG.environment, autonomousConstruction: true },
    });
    world.queen.energy = 4;
    observeHabitat(world, world.ant);
    world.brood.push({ id: 1, x: 45, y: 21, stage: "larva", age: 0, energy: 2, investment: 0 });
    world.ant.x = 43;
    observeHabitat(world, world.ant);
    Object.assign(world.ant, { x: 35, cargo: 4 });
    actColonyWorker(world, world.ant);
    expect(world.ant.decision.history.at(-1)?.request).toMatchObject({
      kind: "acquire",
      destination: -2,
    });
    actColonyWorker(world, world.ant);
    expect(world.ant.decision.history.at(-1)?.request.kind).toBe("forward");
    expect(world.ant.decision.route?.destination).toBe(-2);
  }
);

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s checks remembered brood after finishing a delivery, without a remote hunger update",
  (driver) => {
    const { world } = constructionFixture(driver, 1, {
      environment: { ...FORAGER_CONFIG.environment, autonomousConstruction: true },
    });
    world.brood.push({ id: 1, x: 35, y: 21, stage: "egg", age: 0, energy: 2, investment: 0 });
    world.ant.x = 33;
    observeHabitat(world, world.ant);
    expect(world.knowledge.locations.get(-100000001)?.quantity).toBe(0);
    world.brood[0].stage = "larva";
    world.tick = 700;
    Object.assign(world.ant, { x: 24, cargo: 2 });
    applyRequest(world, world.ant, { ...WAIT, kind: "acquire", destination: -2 });
    actColonyWorker(world, world.ant);
    expect(world.ant.decision.history.at(-1)?.request).toMatchObject({
      kind: "acquire",
      destination: -100000001,
    });
    for (let i = 0; i < 25 && world.ant.cargo > 0; i++) actColonyWorker(world, world.ant);
    expect(world.economy.broodFed).toBe(2);
    expect(world.ant.cargo).toBe(0);
  }
);

it("exposes local construction to an independent LGP without a user request or claim", () => {
  const { world } = constructionFixture("colony-lgp");
  setCell(world.grid, 24, 21, Material.CLAY);
  const genome = {
    version: 1 as const,
    instructions: compile(all(eq(input(F.action), REQUESTS.indexOf("dig")), input(F.diggable)), 0),
  };
  const decision = linearController.act(
    genome,
    observeCandidates(world, world.ant),
    world.ant.decision.registers
  );
  expect(decision.request).toMatchObject({ kind: "dig", heading: 0 });
  expect(world.ant.job).toBeNull();
  expect(applyRequest(world, world.ant, decision.request)).toBe("working");
});

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s finishes queen placement without reattaching",
  (driver) => {
    const { world } = constructionFixture(driver),
      ant = world.ant;
    ant.x = 24;
    const job = requestConstruction(world, "queen", { x: 25, y: 21 }, { x: 30, y: 21 });
    applyRequest(world, ant, { ...WAIT, kind: "claim", destination: job.id });
    actColonyWorker(world, ant);
    expect(ant.decision.history.at(-1)?.request.kind).toBe("finish");
    expect(job.status).toBe("done");
    expect(world.queen.carrier).toBeNull();
  }
);

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s follows a cache route instead of switching destinations",
  (driver) => {
    const { world, source } = constructionFixture(driver),
      ant = world.ant;
    addCache(world, { x: 44, y: 21 });
    ant.x = 24;
    ant.cargo = 2;
    applyRequest(world, ant, { ...WAIT, kind: "acquire", destination: source, task: 19 });
    const x = ant.x;
    actColonyWorker(world, ant);
    expect(ant.decision.history.at(-1)?.request.kind).toBe("forward");
    expect(ant.x).toBeGreaterThan(x);
    expect(ant.decision.route?.destination).toBe(source);
  }
);

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s takes a care load toward the queen instead of redepositing",
  (driver) => {
    const { world } = constructionFixture(driver, 1, {
        environment: { ...FORAGER_CONFIG.environment, autonomousConstruction: true },
      }),
      ant = world.ant;
    world.queen.energy -= 2;
    observeHabitat(world, ant);
    ant.x = 39;
    ant.cargo = 2;
    ant.task = 36;
    actColonyWorker(world, ant);
    expect(ant.decision.history.at(-1)?.request).toMatchObject({
      kind: "acquire",
      destination: -2,
    });
    expect(ant.cargo).toBe(2);
    expect(ant.task).toBe(36);
    actColonyWorker(world, ant);
    expect(ant.decision.history.at(-1)?.request.kind).toBe("forward");
    expect(ant.cargo).toBe(2);
  }
);
