import { describe, expect, it } from "vitest";
import { SEX_MALE } from "./ant";
import {
  GENETIC_ROLE_MALE,
  GENETIC_ROLE_WORKER,
  offspringIdentity,
  type GeneticRecord,
} from "./ancestry";
import { rnnController } from "./controller/rnn";
import { computeEvolutionStats } from "./evolutionStats";
import { createWorld, spawnAnt } from "./world";

function record(
  world: ReturnType<typeof createWorld>,
  id: number,
  values: Partial<GeneticRecord>
): GeneticRecord {
  return {
    id,
    motherId: 0,
    fatherId: 0,
    founderLineId: id,
    colonyId: 1,
    patrilineId: 1,
    sex: 0,
    role: GENETIC_ROLE_WORKER,
    birthTick: 0,
    deathTick: 100,
    deathAge: 10,
    observedFromBirth: true,
    offspringCount: 0,
    netEnergyDelivered: 10,
    traits: world.controller.physical(world.controller.fixedSeed()),
    ...values,
  };
}

describe("evolution statistics", () => {
  it("derives completed parent-offspring regressions and reproductive variance", () => {
    const world = createWorld(5101);
    const parents = [
      record(world, 1, { deathAge: 10, netEnergyDelivered: 10, offspringCount: 1 }),
      record(world, 2, { deathAge: 20, netEnergyDelivered: 40, offspringCount: 1 }),
      record(world, 3, { deathAge: 30, netEnergyDelivered: 90, offspringCount: 1 }),
    ];
    const children = parents.map((parent, index) =>
      record(world, index + 4, {
        motherId: parent.id,
        founderLineId: parent.id,
        sex: SEX_MALE,
        role: GENETIC_ROLE_MALE,
        deathAge: parent.deathAge * 2,
        netEnergyDelivered: parent.netEnergyDelivered * 4,
      })
    );
    world.geneticRecords = new Map([...parents, ...children].map((entry) => [entry.id, entry]));

    const result = computeEvolutionStats(world);

    expect(result.deliveryHeritability).toEqual({ value: 2, samples: 3 });
    expect(result.lifespanHeritability).toEqual({ value: 2, samples: 3 });
    expect(result.effectivePopulation.value).not.toBeNull();
    expect(result.effectivePopulation.reproductiveEvents).toBe(3);
    expect(result.founderLines.contributingLines).toBe(3);
  });

  it("uses controller-owned distances and retains honest unavailable states", () => {
    const world = createWorld(5102);
    const founder = rnnController.fixedSeed();
    const first = spawnAnt(world, {
      x: 1,
      y: 1,
      z: 1,
      heading: 0,
      energy: 1,
      lineageId: 1,
      patrilineId: 1,
      motherId: 0,
      fatherId: 0,
      genome: founder,
      controllerState: rnnController.createState(),
      traits: rnnController.physical(founder),
    });
    const mutant = rnnController.mutate(founder, 1, world.rng);
    const identity = offspringIdentity(world, first.founderLineId);
    spawnAnt(
      world,
      {
        x: 2,
        y: 1,
        z: 1,
        heading: 0,
        energy: 1,
        lineageId: 1,
        patrilineId: 1,
        motherId: first.geneticId,
        fatherId: 0,
        genome: mutant,
        controllerState: rnnController.createState(),
        traits: rnnController.physical(mutant),
      },
      identity,
      true
    );
    world.founderGenomes = [founder];

    const result = computeEvolutionStats(world);
    const expected = rnnController.genomeDistance(founder, mutant);

    expect(result.deliveryHeritability).toEqual({ value: null, samples: 0 });
    expect(result.effectivePopulation.value).toBeNull();
    expect(result.pairwiseGenomeDistance).toEqual({ value: expected, samples: 1 });
    expect(result.founderGenomeDistance.value).toBeCloseTo(expected / 2);
    expect(result.founderGenomeDistance.max).toBeCloseTo(expected);
    expect(result.founderLines.representedLines).toBe(1);
  });
});
