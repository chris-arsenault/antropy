import { describe, expect, it } from "vitest";
import { SEX_MALE } from "./ant";
import { tryLayEgg } from "./actions";
import { foundColony } from "./colony";
import { Input, INPUT_COUNT } from "./controller/contract";
import { rnnController } from "./controller/rnn";
import { createRng } from "./rng";
import { COLONY } from "./tunables";
import { createWorld, stepWorld } from "./world";

function inputs(): Float32Array {
  const buffer = new Float32Array(INPUT_COUNT);
  buffer[Input.BIAS] = 1;
  return buffer;
}

describe("haplodiploidy (spec §7.1)", () => {
  it("produces a haploid offspring that serializes at single length", () => {
    const rng = createRng(41);
    const mother = rnnController.seed(rng);
    const son = rnnController.haploidOffspring(mother, rng);

    const motherBytes = rnnController.serializeGenome(mother);
    const sonBytes = rnnController.serializeGenome(son);
    expect(sonBytes.length * 2).toBe(motherBytes.length);

    const restored = rnnController.deserializeGenome(sonBytes);
    expect(Array.from(rnnController.serializeGenome(restored))).toEqual(Array.from(sonBytes));
  });

  it("expresses a haploid genome raw: sons of an inbred mother match her", () => {
    const rng = createRng(42);
    const mother = rnnController.seed(rng);
    // Make the mother homozygous: both copies identical.
    const bytes = rnnController.serializeGenome(mother);
    const half = bytes.length / 2;
    bytes.set(bytes.subarray(0, half), half);
    const homozygous = rnnController.deserializeGenome(bytes);

    const son = rnnController.haploidOffspring(homozygous, rng);
    const motherOut = Array.from(
      rnnController.act(homozygous, inputs(), rnnController.createState()).outputs
    );
    const sonOut = Array.from(rnnController.act(son, inputs(), rnnController.createState()).outputs);
    expect(sonOut).toEqual(motherOut);
  });

  it("recombines a haploid father's whole copy into a diploid daughter", () => {
    const rng = createRng(43);
    const mother = rnnController.seed(rng);
    const father = rnnController.haploidOffspring(rnnController.seed(rng), rng);
    const daughter = rnnController.recombine(mother, father, rng);
    expect(daughter).not.toBeNull();
    const bytes = rnnController.serializeGenome(daughter as NonNullable<typeof daughter>);
    const fatherBytes = rnnController.serializeGenome(father);
    // The daughter's second copy is the father's copy verbatim.
    expect(Array.from(bytes.subarray(fatherBytes.length))).toEqual(Array.from(fatherBytes));
  });
});

describe("worker-laid males (spec §7.1 channel 2)", () => {
  it("lays a haploid male egg from the worker's own energy", () => {
    const world = createWorld(44);
    foundColony(world);
    const worker = world.ants[0];
    worker.energy = 1;
    const before = worker.energy;

    tryLayEgg(world, worker);
    expect(world.eggs.length).toBe(1);
    const egg = world.eggs[0];
    expect(egg.sex).toBe(SEX_MALE);
    expect(egg.motherId).toBe(worker.id);
    expect(worker.energy).toBeCloseTo(before - worker.traits.eggEndowment - COLONY.eggLayCost);

    // Isolate the egg from the colony (no policing, no interference) and
    // incubate to hatch.
    world.ants = [];
    for (let t = 0; t <= COLONY.incubationTicks && world.ants.length === 0; t++) {
      stepWorld(world);
    }
    const male = world.ants.find((ant) => ant.sex === SEX_MALE);
    expect(male).toBeDefined();
    expect((male as NonNullable<typeof male>).motherId).toBe(worker.id);
  });

  it("refuses to lay below the energy reserve", () => {
    const world = createWorld(45);
    foundColony(world);
    const worker = world.ants[0];
    worker.energy = 0.1;
    tryLayEgg(world, worker);
    expect(world.eggs.length).toBe(0);
  });
});
