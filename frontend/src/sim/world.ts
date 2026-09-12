import { DEFAULT_CONFIG, validateConfig, type Config } from "./config";
import { type World } from "./types";
import { createRandomState, nextRandom } from "./random";
import { seedGenotype } from "./genetics/genotype";
import { advanceFields } from "./ecologyFields";
import { newDeposit } from "./deposits";
import { damageCells } from "./interference";
import { infer } from "./inference";
import { moveBodies, resolveContacts } from "./movement";
import { absorb } from "./resources";
import { metabolize } from "./development";
import { createLedger, heldMaterial, heldEnergy } from "./accounting";
import { blueprint } from "./phenotype";
import { bodyRadius } from "./body";
import { makeCell, reproduce } from "./reproduction";
import { SpatialIndex } from "./spatial";

/** Raster fields at their initial concentrations; the cycle's pools are empty when it is off. */
function initialFields(c: Config) {
  const area = c.width * c.height;
  return {
    nutrient: new Float64Array(area).fill(c.initialNutrient / 2),
    nutrientB: new Float64Array(area).fill(c.initialNutrient / 2),
    toxin: new Float64Array(area),
    matrix: new Float64Array(area),
    boundToxin: new Float64Array(area),
    detritus: new Float64Array(area),
    carbon: new Float64Array(area).fill(c.cycle?.initialCarbon ?? 0),
    oxygen: new Float64Array(area).fill(c.cycle?.atmosphereOxygen ?? 0),
    chemical: new Float64Array(area),
  };
}
export function createWorld(seedValue = 101, config: Config = DEFAULT_CONFIG): World {
  if (!Number.isInteger(seedValue) || seedValue < -2147483648 || seedValue > 4294967295)
    throw new Error("Seed must be a 32-bit integer");
  validateConfig(config);
  const c = structuredClone(config),
    world: World = {
      substrate: "bacteria-xy",
      version: 6,
      seed: seedValue,
      tick: 0,
      config: c,
      rng: createRandomState(seedValue),
      environmentRng: createRandomState(seedValue ^ 0x7321),
      geneticRng: createRandomState(seedValue ^ 0x6713),
      cells: [],
      ...initialFields(c),
      patchCenters: [],
      sources: [],
      genomes: new Map(),
      ancestry: new Map(),
      nextCell: 1,
      nextGenome: 2,
      events: [],
      interventions: [],
      stopReason: null,
      ledger: createLedger(),
    };
  world.genomes.set(1, { id: 1, parent: null, born: 0, genome: seedGenotype(c), learned: 0 });
  for (let i = 0; i < 3; i++)
    world.patchCenters.push({
      x: nextRandom(world.environmentRng) * c.width,
      y: nextRandom(world.environmentRng) * c.height,
    });
  for (let i = 0; i < c.sourceCount; i++) world.sources.push(newDeposit(world, i));
  const index = new SpatialIndex(c, []);
  for (let i = 0; i < c.founders; i++) {
    const position = findStart(world, index);
    const cell = makeCell(world, position, null, 1);
    world.cells.push(cell);
    index.add(cell);
  }
  world.ledger.initialMaterial = heldMaterial(world);
  world.ledger.initial = heldEnergy(world);
  world.ledger.initialOxygen = world.oxygen.reduce((s, v) => s + v, 0);
  return world;
}
function findStart(world: World, index: SpatialIndex) {
  const r = bodyRadius(
    {
      body: blueprint(world.genomes.get(1)!.genome, world.config),
      reserve: world.config.founderReserve,
    },
    world.config
  );
  for (let attempt = 0; attempt < 10000; attempt++) {
    const p = {
      x: nextRandom(world.rng) * world.config.width,
      y: nextRandom(world.rng) * world.config.height,
    };
    if (index.free(p, r, -1)) return p;
  }
  throw new Error("Founder placement exceeds physical capacity");
}
export function stepWorld(world: World): void {
  if (world.stopReason) return;
  advanceFields(world);
  for (const cell of world.cells) infer(world, cell);
  moveBodies(world);
  damageCells(world);
  absorb(world);
  metabolize(world);
  resolveContacts(world);
  reproduce(world);
  world.tick++;
}
