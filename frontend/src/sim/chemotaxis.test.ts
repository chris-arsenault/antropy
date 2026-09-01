import { describe, expect, it } from "vitest";
import { surfaceSpawnY } from "./ant";
import { rnnController, zeroGenome } from "./controller/rnn";
import { type Genome } from "./controller/contract";
import { voxelIndex } from "./grid";
import { depositScent, stepScentField } from "./scent";
import { createWorld, spawnAnt, stepWorld, type World } from "./world";

const PLUME_OFFSET_X = 4;
const PLUME_OFFSET_Z = 2;
const PRECHARGE_PASSES = 30;
const TICKS = 150;
const REQUIRED_IMPROVEMENT = 1.5;

/**
 * M5 behavioral assay (exit gate): a chemotaxis-seeded RNN ant closes on a
 * food-scent plume within smelling range; a zero-genome control does not
 * move. Fully deterministic: fixed seeds, fixed genome, no majority vote.
 */
function runAssay(seed: number, genome: Genome): { start: number; end: number } {
  const world: World = createWorld(seed);
  world.foodTarget = 0; // no distracting food

  const x = 40;
  const z = 40;
  const y = surfaceSpawnY(world.grid, x, z);
  if (y === null) {
    throw new Error("no spawn surface");
  }
  const plumeX = x + PLUME_OFFSET_X;
  const plumeZ = z + PLUME_OFFSET_Z;
  const plumeY = surfaceSpawnY(world.grid, plumeX, plumeZ) ?? y;
  const plumeIndex = voxelIndex(world.grid, plumeX, plumeY, plumeZ);

  for (let i = 0; i < PRECHARGE_PASSES; i++) {
    depositScent(world.foodScent, plumeIndex, 1.5);
    stepScentField(world.grid, world.foodScent);
  }

  const ant = spawnAnt(world, {
    x,
    y,
    z,
    heading: 0, // roughly toward the plume, offset in z so steering must act
    energy: 1,
    lineageId: 0,
    patrilineId: 0,
    motherId: 0,
    fatherId: 0,
    genome,
    controllerState: rnnController.createState(),
    traits: rnnController.physical(genome),
  });

  const distance = () => Math.hypot(ant.x - plumeX, ant.z - plumeZ);
  const start = distance();
  let best = start;
  for (let t = 0; t < TICKS; t++) {
    depositScent(world.foodScent, plumeIndex, 1.5);
    stepWorld(world);
    best = Math.min(best, distance());
  }
  return { start, end: best };
}

describe("chemotaxis assay (M5 gate)", () => {
  it("closes on the plume with a seeded founder genome", { timeout: 60_000 }, () => {
    const genomeSource = createWorld(3101);
    const genome = rnnController.seed(genomeSource.rng);
    const { start, end } = runAssay(3111, genome);
    expect(end).toBeLessThan(start - REQUIRED_IMPROVEMENT);
  });

  it("does not move with the zero-genome control", { timeout: 60_000 }, () => {
    const { start, end } = runAssay(3102, zeroGenome());
    expect(end).toBeCloseTo(start);
  });
});
