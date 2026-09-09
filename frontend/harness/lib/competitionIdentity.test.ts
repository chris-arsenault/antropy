import { expect, it } from "vitest";
import { createWorld } from "../../src/sim/world";
import { checkpointToJson } from "../../src/persist/checkpoint";
import { overrideTask } from "../../src/sim/events";
import { decodeGenotype } from "../../src/sim/genetics/codec";
import { sameGenotype } from "../../src/sim/genetics/genotype";
import { prepareCompetition } from "./competitionIdentity";

it("competition identity embeds replayable genomes, checkpoint hash and source interventions", () => {
  const world = createWorld();
  overrideTask(world, 1, 19);
  const text = checkpointToJson(world);
  const { identity, ancestor } = prepareCompetition(text, 1);
  expect(identity.sourceInterventions).toEqual(world.interventions);
  expect(identity.checkpointHash).toHaveLength(64);
  expect(identity.ancestor.hash).toBe(identity.descendant.hash);
  const reconstructed = decodeGenotype(JSON.parse(JSON.stringify(identity.descendant.genome)));
  expect(sameGenotype(ancestor, reconstructed)).toBe(true);
  overrideTask(world, 1, 20);
  expect(prepareCompetition(checkpointToJson(world), 1).identity.checkpointHash).not.toBe(
    identity.checkpointHash
  );
});
