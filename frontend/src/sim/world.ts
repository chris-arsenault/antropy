import { DEFAULT_CONFIG, validateConfig, type Config } from "./config";
import { type World } from "./types";
import { createRandomState, nextRandom } from "./random";
import { controller } from "./controller";
import { advanceFields } from "./fields";
import { observe } from "./sensors";
import { moveBodies, resolveContacts } from "./movement";
import { absorb, metabolize, total } from "./resources";
import { makeCell, reproduce } from "./reproduction";
import { SpatialIndex } from "./spatial";
import { recordEvent } from "./events";

export function createWorld(seedValue = 101, config: Config = DEFAULT_CONFIG): World {
  if (!Number.isInteger(seedValue) || seedValue < -2147483648 || seedValue > 4294967295)
    throw new Error("Seed must be a 32-bit integer");
  validateConfig(config);
  const c = { ...config },
    world: World = {
      substrate: "bacteria-xy",
      version: 2,
      seed: seedValue,
      tick: 0,
      config: c,
      rng: createRandomState(seedValue),
      environmentRng: createRandomState(seedValue ^ 0x7321),
      geneticRng: createRandomState(seedValue ^ 0x6713),
      cells: [],
      nutrient: new Float64Array(c.width * c.height).fill(c.initialNutrient),
      chemical: new Float64Array(c.width * c.height),
      sources: [],
      genomes: new Map(),
      ancestry: new Map(),
      nextCell: 1,
      nextGenome: 2,
      events: [],
      interventions: [],
      stopReason: null,
      ledger: {
        initial: 0,
        supplied: 0,
        nutrientLoss: 0,
        metabolism: 0,
        motors: 0,
        secretion: 0,
        growthLoss: 0,
        division: 0,
        deathLoss: 0,
        emitted: 0,
        chemicalLoss: 0,
        births: 0,
        deaths: 0,
        divisions: 0,
        mutations: 0,
        distance: 0,
        turning: 0,
        taskWrites: 0,
        blockedDivisions: 0,
      },
    };
  world.genomes.set(1, { id: 1, parent: null, born: 0, genome: controller.seed() });
  for (let i = 0; i < c.sourceCount; i++)
    world.sources.push({
      x: nextRandom(world.environmentRng) * c.width,
      y: nextRandom(world.environmentRng) * c.height,
      remaining: c.sourceLifetime,
    });
  const index = new SpatialIndex(c, []);
  for (let i = 0; i < c.founders; i++) {
    const position = findStart(world, index);
    const cell = makeCell(world, position, null, 1, c.founderReserve);
    world.cells.push(cell);
    index.add(cell);
  }
  world.ledger.initial =
    total(world.nutrient) + world.cells.reduce((s, b) => s + b.mass + b.energy, 0);
  return world;
}
function findStart(world: World, index: SpatialIndex) {
  for (let attempt = 0; attempt < 10000; attempt++) {
    const p = {
      x: nextRandom(world.rng) * world.config.width,
      y: nextRandom(world.rng) * world.config.height,
    };
    if (index.free(p, world.config.birthMass, -1)) return p;
  }
  throw new Error("Founder placement exceeds physical capacity");
}
export function stepWorld(world: World): void {
  if (world.stopReason) return;
  advanceFields(world);
  for (const cell of world.cells) {
    const previous = cell.brain.task;
    cell.inputs = observe(world, cell);
    cell.action = controller.act(world.genomes.get(cell.genome)!.genome, cell.inputs, cell.brain);
    if (previous !== cell.brain.task) {
      world.ledger.taskWrites++;
      recordEvent(world, "task", cell.id, [previous, cell.brain.task]);
    }
  }
  moveBodies(world);
  absorb(world);
  metabolize(world);
  resolveContacts(world);
  reproduce(world);
  world.tick++;
}
