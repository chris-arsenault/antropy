import { expect, it } from "vitest";
import { ColonyActivity } from "./colonyActivity";
import { createWorld } from "../../src/sim/world";
import { PROGRAMMED_LIFECYCLE_CONFIG } from "../../src/sim/config";
import { IDLE_ACTION } from "../../src/sim/controller/contract";
import { senseColony } from "../../src/sim/colonySensors";
import { applyActionToAnt } from "../../src/sim/actions";
import { putFood } from "../../src/sim/resources";
import { cellIndex } from "../../src/sim/grid";

it("attributes external harvest to the acting worker and preserves turn runs across windows", () => {
  const world = createWorld(
    7,
    "programmed-lifecycle",
    {
      ...PROGRAMMED_LIFECYCLE_CONFIG,
      foodEnergyDensity: 0.5,
    },
    false
  );
  const ant = world.ant,
    activity = new ColonyActivity();
  ant.x = 50;
  ant.y = world.config.surfaceBase + 6;
  ant.heading = 0;
  putFood(world, cellIndex(world.grid, 51, ant.y), 4);
  const pickup = { ...IDLE_ACTION, mandible: true };
  activity.observe(world, ant, senseColony(world, ant), pickup);
  applyActionToAnt(world, ant, pickup);
  activity.finishAction(world);
  const window = activity.window(1);
  expect(window.activeForagers).toBe(1);
  expect(window.workers[0].harvestQuantity).toBe(4);
  for (let tick = 1; tick <= 110; tick++) {
    world.tick = tick;
    activity.observe(world, ant, senseColony(world, ant), { ...IDLE_ACTION, turn: 1 });
    activity.finishAction(world);
    if (tick === 90) activity.window(tick);
  }
  expect(activity.window(110).longTurnTicks).toBe(11);
  expect(activity.episodes()[0].length).toBe(110);
});
