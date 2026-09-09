import { expect, it } from "vitest";
import { constructionFixture } from "./fixture";
import { applyRequest } from "../colony/resolve";
import { WAIT } from "../colony/contract";
import { cellIndex, getCell, setCell } from "../grid";
import { Material } from "../materials";
import { energyResidual, putFood } from "../resources";
import { requestConstruction } from "./sites";
import { createAnt } from "../ant";
import { maintainColony } from "../lifecycle";
import { settleWorld } from "../settling";

it.each([
  [Material.LOOSE_SOIL, 2],
  [Material.SOIL, 5],
  [Material.CLAY, 15],
  [Material.WOOD, 20],
])(
  "excavates material %s with %s work actions, preserving backing and buried food",
  (material, turns) => {
    const { world } = constructionFixture(),
      ant = world.ant;
    const index = cellIndex(world.grid, 24, 21);
    setCell(world.grid, 24, 21, material);
    putFood(world, index, 2);
    world.economy.initial += 2;
    for (let i = 1; i < turns; i++)
      expect(applyRequest(world, ant, { ...WAIT, kind: "dig" })).toBe("working");
    expect(applyRequest(world, ant, { ...WAIT, kind: "dig" })).toBe("success");
    expect(ant.spoil).toBe(material);
    expect(world.grid.backing[index]).toBe(Material.SOIL);
    expect(world.food.get(index)).toBe(2);
    expect(applyRequest(world, ant, { ...WAIT, kind: "deposit-spoil" })).toBe("blocked");
    expect(applyRequest(world, ant, { ...WAIT, kind: "deposit-spoil", heading: 4 })).toBe(
      "success"
    );
    expect(getCell(world.grid, 22, 21)).toBe(material);
    expect(world.construction.excavated).toBe(world.construction.deposited);
    expect(Math.abs(energyResidual(world))).toBeLessThan(1e-8);
  }
);

it("rejects rock, competing claims and overlapping cargo without changing physical loads", () => {
  const { world } = constructionFixture(),
    ant = world.ant;
  const job = requestConstruction(world, "dig", { x: 24, y: 21 }, { x: 30, y: 21 });
  const other = createAnt(world, 2, 0, { x: 23, y: 22 });
  world.ants.push(other);
  expect(applyRequest(world, ant, { ...WAIT, kind: "claim", destination: job.id })).toBe("success");
  expect(applyRequest(world, other, { ...WAIT, kind: "claim", destination: job.id })).toBe(
    "blocked"
  );
  expect(applyRequest(world, ant, { ...WAIT, kind: "dig", heading: 6 })).toBe("blocked");
  ant.cargo = 1;
  expect(applyRequest(world, ant, { ...WAIT, kind: "dig" })).toBe("full");
});

it("carries a queen through paid collision-resolved steps and releases on a supported cell", () => {
  const { world } = constructionFixture(),
    ant = world.ant;
  ant.x = 24;
  expect(applyRequest(world, ant, { ...WAIT, kind: "attach-queen" })).toBe("success");
  const reserve = ant.energy;
  expect(applyRequest(world, ant, { ...WAIT, kind: "left" })).toBe("success");
  expect(world.queen.x).toBe(ant.x);
  expect(ant.energy).toBeLessThan(reserve - world.config.moveCost);
  expect(applyRequest(world, ant, { ...WAIT, kind: "down" })).toBe("blocked");
  expect(applyRequest(world, ant, { ...WAIT, kind: "release-queen", heading: 2 })).toBe("blocked");
  expect(applyRequest(world, ant, { ...WAIT, kind: "release-queen" })).toBe("success");
  expect(world.queen.carrier).toBeNull();
  expect(world.knowledge.locations.get(-2)?.x).toBe(24);
  expect(Math.abs(energyResidual(world))).toBeLessThan(1e-8);
});

it("drops queen and conserved spoil when a worker dies, and reopens its claim", () => {
  const { world } = constructionFixture(),
    ant = world.ant;
  const job = requestConstruction(world, "dig", { x: 24, y: 21 }, { x: 30, y: 21 });
  applyRequest(world, ant, { ...WAIT, kind: "claim", destination: job.id });
  setCell(world.grid, 24, 21, Material.LOOSE_SOIL);
  applyRequest(world, ant, { ...WAIT, kind: "dig" });
  applyRequest(world, ant, { ...WAIT, kind: "dig" });
  ant.age = world.config.workerLifespan;
  maintainColony(world);
  expect(world.construction.loose.get(cellIndex(world.grid, 23, 21))).toEqual([
    Material.LOOSE_SOIL,
  ]);
  expect(job.status).toBe("pending");
  expect(Math.abs(energyResidual(world))).toBeLessThan(1e-8);
  const second = constructionFixture().world;
  second.ant.x = 24;
  applyRequest(second, second.ant, { ...WAIT, kind: "attach-queen" });
  second.ant.age = second.config.workerLifespan;
  maintainColony(second);
  settleWorld(second);
  expect(second.queen.carrier).toBeNull();
  expect(second.queen.alive).toBe(true);
});

it("creates independent cache sites and refuses to retire a nonempty source", () => {
  const { world, source } = constructionFixture(),
    ant = world.ant;
  expect(applyRequest(world, ant, { ...WAIT, kind: "create-cache" })).toBe("success");
  expect(world.caches.size).toBe(2);
  ant.x = 39;
  expect(applyRequest(world, ant, { ...WAIT, kind: "retire-cache" })).toBe("blocked");
  expect(world.caches.has(source)).toBe(true);
  expect(world.food.get(cellIndex(world.grid, 40, 21))).toBe(7);
});
