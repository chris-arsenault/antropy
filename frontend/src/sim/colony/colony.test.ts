import { describe, expect, it } from "vitest";
import { FORAGER_CONFIG } from "../config";
import { createWorld } from "../world";
import { cellIndex, setCell, setBacking } from "../grid";
import { Material } from "../materials";
import { energyResidual, putFood } from "../resources";
import { createAnt } from "../ant";
import { WAIT } from "./contract";
import { observeKnowledge, expireKnowledge } from "./knowledge";
import { applyRequest } from "./resolve";
import { observeCandidates } from "./observation";
import { actProgrammed, linearController } from "../controller/linear/controller";
import { seedLinearGenome } from "../controller/linear/seed";
import { createRandomState } from "../random";
import { runLinear, runSpecialized } from "../controller/linear/machine";
import { validateLinearGenome } from "../controller/linear/genome";

function fixture(scenario: "colony-programmed" | "colony-lgp" = "colony-programmed") {
  const world = createWorld(1, scenario, FORAGER_CONFIG, false);
  for (let y = 20; y <= 28; y++)
    for (let x = 20; x <= 32; x++) {
      setCell(world.grid, x, y, Material.AIR);
      setBacking(world.grid, x, y, Material.SOIL);
    }
  world.ant.x = 22;
  world.ant.y = 24;
  world.knowledge.locations.clear();
  world.knowledge.locations.set(-1, {
    id: -1,
    kind: "entrance",
    x: 29,
    y: 24,
    backed: true,
    quantity: 0,
    observedAt: null,
  });
  return world;
}

it("reports a full deposit without losing cargo or suppressing its task write", () => {
  const world = fixture(),
    ant = world.ant;
  ant.cargo = 0.5;
  putFood(world, cellIndex(world.grid, ant.x + 1, ant.y), world.config.cacheCapacity);
  expect(applyRequest(world, ant, { ...WAIT, kind: "deposit", heading: 0, task: 201 })).toBe(
    "full"
  );
  expect(ant.cargo).toBe(0.5);
  expect(ant.task).toBe(201);
});
describe("colony knowledge and explicit actions", () => {
  it("shares encountered food, records depletion and expires sightings without sensing regrowth remotely", () => {
    const world = fixture();
    const id = cellIndex(world.grid, 23, 24),
      hidden = cellIndex(world.grid, 31, 24);
    putFood(world, id, 3);
    putFood(world, hidden, 4);
    putFood(world, cellIndex(world.grid, world.ant.x, world.ant.y), 0.4);
    observeKnowledge(world, world.ant);
    expect(world.knowledge.locations.get(id)?.quantity).toBe(3);
    expect(Object.keys(world.knowledge.locations.get(id)!)).toEqual([
      "x",
      "y",
      "id",
      "backed",
      "kind",
      "quantity",
      "observedAt",
    ]);
    expect(world.knowledge.locations.has(hidden)).toBe(false);
    expect(
      world.knowledge.locations.get(cellIndex(world.grid, world.ant.x, world.ant.y))
    ).not.toHaveProperty("decision");
    const other = createAnt(world, 2, 0, { x: 26, y: 24 });
    expect(observeCandidates(world, other).some((c) => c.request.destination === id)).toBe(true);
    world.food.delete(id);
    observeKnowledge(world, world.ant);
    expect(world.knowledge.locations.get(id)?.quantity).toBe(0);
    putFood(world, id, 5);
    expect(world.knowledge.locations.get(id)?.quantity).toBe(0);
    world.tick = world.config.knowledgeDuration + 1;
    expireKnowledge(world);
    expect(world.knowledge.locations.has(id)).toBe(false);
    expect(world.knowledge.locations.has(-1)).toBe(true);
  });

  it("acquires without moving, traverses and reverses physically, and retains arbitrary task values", () => {
    const world = fixture(),
      ant = world.ant;
    const start = { x: ant.x, y: ant.y },
      energy = ant.energy;
    applyRequest(world, ant, { ...WAIT, kind: "acquire", destination: -1, task: 249 });
    expect({ x: ant.x, y: ant.y }).toEqual(start);
    const length = ant.decision.route!.cells.length;
    for (let i = 1; i < length; i++) applyRequest(world, ant, { ...WAIT, kind: "forward" });
    expect(ant.decision.result).toBe("arrived");
    for (let i = 1; i < length; i++) applyRequest(world, ant, { ...WAIT, kind: "backward" });
    expect({ x: ant.x, y: ant.y }).toEqual(start);
    expect(ant.energy).toBeLessThan(energy);
    expect(ant.task).toBe(249);
    expect(ant.taskAge).toBe(2 * (length - 1));
    expect(Math.abs(energyResidual(world))).toBeLessThan(1e-8);
  });

  it("reports unknown, occupied, off-route and changed terrain without changing destination", () => {
    const world = fixture(),
      ant = world.ant;
    expect(applyRequest(world, ant, { ...WAIT, kind: "acquire", destination: 900 })).toBe(
      "unknown-destination"
    );
    applyRequest(world, ant, { ...WAIT, kind: "acquire", destination: -1 });
    const route = ant.decision.route!,
      next = route.cells[1];
    world.ants.push(
      createAnt(world, 2, 0, { x: next % world.grid.width, y: Math.floor(next / world.grid.width) })
    );
    expect(applyRequest(world, ant, { ...WAIT, kind: "forward" })).toBe("blocked");
    expect(route.cursor).toBe(0);
    applyRequest(world, ant, { ...WAIT, kind: "up" });
    expect(ant.y).toBe(25);
    expect(applyRequest(world, ant, { ...WAIT, kind: "forward" })).toBe("off-route");
    applyRequest(world, ant, { ...WAIT, kind: "acquire", destination: -1 });
    setCell(world.grid, 30, 24, Material.ROCK);
    expect(applyRequest(world, ant, { ...WAIT, kind: "forward" })).toBe("off-route");
  });
});

describe("linear genetic programs", () => {
  it("executes the seed as the same policy", () => {
    const world = fixture("colony-lgp");
    const candidates = observeCandidates(world, world.ant);
    expect(
      linearController.act(world.linearGenome!, candidates, world.ant.decision.registers).request
    ).toEqual(actProgrammed(candidates, world.ant.decision.registers).request);
  });

  it("varies executable genomes without mutating parents or creating nonfinite arithmetic", () => {
    const seed = seedLinearGenome(),
      before = JSON.stringify(seed),
      random = createRandomState(77);
    let changed = 0;
    for (let i = 0; i < 40; i++) {
      const child = linearController.recombine(linearController.mutate(seed, random), seed, random);
      expect(() => validateLinearGenome(child)).not.toThrow();
      expect(runLinear(child, [0, 1, -1, 1e6], Array(32).fill(0)).every(Number.isFinite)).toBe(
        true
      );
      changed += Number(linearController.genomeDistance(seed, child) > 0);
    }
    expect(changed).toBeGreaterThan(0);
    expect(JSON.stringify(seed)).toBe(before);
    expect(() => validateLinearGenome({ version: 1, instructions: [] })).toThrow();
  });

  it("specializes arbitrary varied programs without changing outputs or persistent memory", () => {
    const world = fixture("colony-lgp"),
      random = createRandomState(123);
    const candidates = observeCandidates(world, world.ant);
    let genome = seedLinearGenome();
    const memory = Array.from({ length: 32 }, (_, i) => (i - 16) / 10);
    for (let i = 0; i < 12; i++) {
      for (const candidate of candidates) {
        const full = runLinear(genome, candidate.inputs, memory);
        const optimized = runSpecialized(genome, candidate.inputs, memory);
        for (const register of [0, 1, 24, 25, 26, 27, 28, 29, 30, 31])
          expect(optimized[register]).toBe(full[register]);
      }
      genome = linearController.mutate(genome, random);
    }
  });
});
