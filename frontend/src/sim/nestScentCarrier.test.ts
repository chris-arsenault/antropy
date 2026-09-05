import { describe, expect, it } from "vitest";
import { placeBootstrapColony } from "./colony";
import { PROGRAMMED_COLONY_CONFIG } from "./config";
import { voxelIndex } from "./grid";
import { primeAuthoredNestTrail } from "./nestScentCarrier";
import { authorProgrammedNest } from "./programmedNest";
import { sampleScent, scentActiveIndices } from "./scent";
import { createWorld } from "./world";

function trailFixture(enabled: boolean) {
  const world = createWorld(6110, undefined, {
    ...PROGRAMMED_COLONY_CONFIG,
    authoredNestTrail: enabled,
  });
  const nest = authorProgrammedNest(world);
  const colony = placeBootstrapColony(world, nest.queenHome, nest.workerStations, nest.entrance);
  primeAuthoredNestTrail(world, colony, nest.workerStations);
  return { world, nest, colony };
}

describe("authored nest entrance trail", () => {
  it("is an optional owner-tagged scent carrier joining worker starts to the entrance", () => {
    const disabled = trailFixture(false);
    const enabled = trailFixture(true);
    const { world, nest, colony } = enabled;
    const seededPoints = [nest.entrance, ...nest.workerStations];

    expect(disabled.world.pheromoneA.activeCount).toBe(0);
    expect(world.pheromoneA.activeCount).toBeGreaterThan(0);
    expect(
      seededPoints.every((point) => {
        const index = voxelIndex(world.grid, point.x, point.y, point.z);
        return sampleScent(world.pheromoneA, index, colony.id) > 0;
      })
    ).toBe(true);
    expect(
      scentActiveIndices(world.pheromoneA).every(
        (index) => world.pheromoneA.owners[index] === colony.id
      )
    ).toBe(true);
  });
});
