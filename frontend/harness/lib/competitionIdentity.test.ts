// @vitest-environment node
import { expect, it } from "vitest";
import { loadEngine } from "../numerical/engine";
import { prepareCompetition } from "./competitionIdentity";
it("embeds exact genomes, checkpoint identity and retained interventions", async () => {
  const engine = await loadEngine(),
    world = engine.create(101, { width: 24, height: 24, sourceCount: 0, founders: 4 });
  try {
    world.command("task", { cell: 1, value: 19 });
    const { identity, ancestor } = prepareCompetition(world, 1);
    expect(identity.retainedEvents).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "override", cell: 1 })])
    );
    expect(identity.checkpointHash).toHaveLength(64);
    expect(identity.ancestor.hash).toBe(identity.descendant.hash);
    expect(JSON.parse(JSON.stringify(identity.descendant.genome))).toEqual(ancestor);
    world.command("task", { cell: 1, value: 20 });
    expect(prepareCompetition(world, 1).identity.checkpointHash).not.toBe(identity.checkpointHash);
  } finally {
    world.dispose();
  }
});
it("uses the declared lineage and birth-order representative rule", async () => {
  const engine = await loadEngine(),
    world = engine.create(101, { width: 24, height: 24, sourceCount: 0, founders: 4 });
  try {
    expect(prepareCompetition(world, "representative").identity.selection).toMatchObject({
      genome: 1,
      cell: 1,
      lineage: 1,
      lineagePopulation: 1,
    });
  } finally {
    world.dispose();
  }
});
