import { describe, expect, it } from "vitest";
import { buildAntIndex } from "./antIndex";
import { braitenbergController } from "./controller/braitenberg";
import { Input } from "./controller/contract";
import { voxelIndex } from "./grid";
import { depositScent, scentResponse, type ScentField } from "./scent";
import { createInputBuffer, sense, type SenseContext } from "./senses";
import { createWorld, populateForagers, type World } from "./world";

function contextFor(world: World): SenseContext {
  return {
    ...world,
    antIndex: buildAntIndex(world.grid, world.ants),
    climate: () => 1,
  };
}

describe("directly-ahead chemoreception", () => {
  it("samples every scent field in all three vertical bands", () => {
    const world = createWorld(717, braitenbergController);
    populateForagers(world, 1);
    const ant = world.ants[0];
    ant.heading = 0;
    ant.traits = { ...ant.traits, sensorGain: 1 };
    const positions = [
      voxelIndex(world.grid, ant.x + 1, ant.y, ant.z),
      voxelIndex(world.grid, ant.x + 1, ant.y - 1, ant.z),
      voxelIndex(world.grid, ant.x + 1, ant.y + 1, ant.z),
    ];
    const fields: readonly [ScentField, number, readonly [number, number, number]][] = [
      [
        world.pheromoneA,
        ant.lineageId,
        [Input.PHEROMONE_A_AHEAD, Input.PHEROMONE_A_DOWN_AHEAD, Input.PHEROMONE_A_UP_AHEAD],
      ],
      [
        world.pheromoneB,
        ant.lineageId,
        [Input.PHEROMONE_B_AHEAD, Input.PHEROMONE_B_DOWN_AHEAD, Input.PHEROMONE_B_UP_AHEAD],
      ],
      [
        world.foodScent,
        0,
        [Input.FOOD_SCENT_AHEAD, Input.FOOD_SCENT_DOWN_AHEAD, Input.FOOD_SCENT_UP_AHEAD],
      ],
      [
        world.nestScent,
        ant.lineageId,
        [Input.NEST_SCENT_AHEAD, Input.NEST_SCENT_DOWN_AHEAD, Input.NEST_SCENT_UP_AHEAD],
      ],
      [
        world.colonyScent,
        ant.lineageId,
        [Input.COLONY_SCENT_AHEAD, Input.COLONY_SCENT_DOWN_AHEAD, Input.COLONY_SCENT_UP_AHEAD],
      ],
    ];

    for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex++) {
      const [field, owner] = fields[fieldIndex];
      for (let band = 0; band < positions.length; band++) {
        depositScent(field, positions[band], 0.1 * (fieldIndex + 1) + 0.01 * band, owner);
      }
    }
    const inputs = sense(contextFor(world), ant, createInputBuffer());

    for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex++) {
      const [, , channels] = fields[fieldIndex];
      for (let band = 0; band < channels.length; band++) {
        expect(inputs[channels[band]]).toBeCloseTo(
          scentResponse(0.1 * (fieldIndex + 1) + 0.01 * band, 1)
        );
      }
    }
  });
});
