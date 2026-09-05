import { describe, expect, it } from "vitest";
import { NEST_CONFIG, VARIATION_NEST_CONFIG } from "./config";
import { rnnController } from "./controller/rnn";
import { seedFounderGenomes, sexualOffspring } from "./genetics";
import { createWorld } from "./world";

describe("founder variation gate", () => {
  it("uses the same founder genome in every fixed-genetics world", () => {
    const first = seedFounderGenomes(createWorld(1, rnnController, NEST_CONFIG), 1)[0];
    const second = seedFounderGenomes(createWorld(2, rnnController, NEST_CONFIG), 1)[0];
    expect(Array.from(rnnController.serializeGenome(first))).toEqual(
      Array.from(rnnController.serializeGenome(second))
    );
  });

  it("draws a deterministic but genetically broad founder portfolio when admitted", () => {
    const firstWorld = createWorld(3, rnnController, VARIATION_NEST_CONFIG);
    const secondWorld = createWorld(3, rnnController, VARIATION_NEST_CONFIG);
    const first = seedFounderGenomes(firstWorld, 7);
    const second = seedFounderGenomes(secondWorld, 7);

    expect(
      first.some((genome) => rnnController.genomeDistance(first[0], genome) > 0)
    ).toBe(true);
    expect(first.map((genome) => Array.from(rnnController.serializeGenome(genome)))).toEqual(
      second.map((genome) => Array.from(rnnController.serializeGenome(genome)))
    );
  });

  it("recombines and mutates fertilized eggs without modifying either parent", () => {
    const world = createWorld(4, rnnController, VARIATION_NEST_CONFIG);
    const [mother, father] = seedFounderGenomes(world, 2);
    const motherBefore = rnnController.serializeGenome(mother);
    const fatherBefore = rnnController.serializeGenome(father);

    const child = sexualOffspring(world, mother, father);

    expect(rnnController.genomeDistance(child, mother)).toBeGreaterThan(0);
    expect(rnnController.serializeGenome(mother)).toEqual(motherBefore);
    expect(rnnController.serializeGenome(father)).toEqual(fatherBefore);
  });

  it("keeps fixed-mode offspring exact", () => {
    const world = createWorld(5, rnnController, NEST_CONFIG);
    const mother = rnnController.fixedSeed();
    const father = rnnController.seed(world.rng);

    expect(rnnController.serializeGenome(sexualOffspring(world, mother, father))).toEqual(
      rnnController.serializeGenome(mother)
    );
  });
});
