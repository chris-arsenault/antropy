import { expect, it } from "vitest";
import { createWorld } from "../../src/sim/world";
import { checkpointToJson } from "../../src/persist/checkpoint";
import { overrideTask } from "../../src/sim/events";
import { controller } from "../../src/sim/controller";
import { prepareCompetition } from "./competitionIdentity";

it("competition identity embeds replayable genomes, checkpoint hash and source interventions", () => {
  const world = createWorld();
  overrideTask(world, 1, 19);
  const text = checkpointToJson(world);
  const { identity, ancestor } = prepareCompetition(text, 1);
  expect(identity.sourceInterventions).toEqual(world.interventions);
  expect(identity.checkpointHash).toHaveLength(64);
  expect(identity.ancestor.hash).toBe(identity.descendant.hash);
  const reconstructed = controller.decodeGenome(
    JSON.parse(JSON.stringify(identity.descendant.genome))
  );
  expect(controller.genomeDistance(ancestor, reconstructed)).toBe(0);
  overrideTask(world, 1, 20);
  expect(prepareCompetition(checkpointToJson(world), 1).identity.checkpointHash).not.toBe(
    identity.checkpointHash
  );
});
