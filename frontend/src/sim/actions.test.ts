import { describe, expect, it } from "vitest";
import { applyAction } from "./actions";
import { CHEMISTRY } from "./config";
import { FORAGER_CONFIG } from "./config";
import { IDLE_ACTION } from "./controller/contract";
import { storedFood } from "./resources";
import { cellIndex, pointAt } from "./grid";
import { DIRECTIONS, headingBetween, stepFrom, type Point } from "./geometry";
import { isWalkable } from "./scent";
import { createWorld } from "./world";

function stanceBeside(world: ReturnType<typeof createWorld>, target: Point): Point {
  for (const direction of DIRECTIONS) {
    const point = { x: target.x - direction.x, y: target.y - direction.y };
    if (isWalkable(world.grid, point.x, point.y)) return point;
  }
  throw new Error("target has no stance");
}

function placeFacing(world: ReturnType<typeof createWorld>, target: Point): void {
  const stance = stanceBeside(world, target);
  world.ant.x = stance.x;
  world.ant.y = stance.y;
  world.ant.heading = headingBetween(stance, target);
}

describe("shared 2D action resolver", () => {
  it("moves one external cell into carried state and then the visible cache", () => {
    const world = createWorld(1, "programmed", FORAGER_CONFIG, false);
    const food = pointAt(world.grid, [...world.foodSources][0]);
    placeFacing(world, food);

    applyAction(world, {
      ...IDLE_ACTION,
      turn: 0,
      move: false,
      mandible: true,
      pheromoneA: 0,
      pheromoneB: 0,
    });
    expect(world.ant.cargo).toBe(1);
    expect(world.metrics.foodPickedUp).toBe(1);

    placeFacing(world, world.cache);
    applyAction(world, {
      ...IDLE_ACTION,
      turn: 0,
      move: false,
      mandible: true,
      pheromoneA: 0,
      pheromoneB: 0,
    });
    expect(world.ant.cargo).toBe(0);
    expect(world.metrics.foodDeposited).toBe(1);
    expect(storedFood(world)).toBe(1);
  });

  it("deposits a bounded pheromone amount only through successful movement", () => {
    const world = createWorld(1, "programmed", FORAGER_CONFIG, false);
    const target = stepFrom(world.ant, world.ant.heading);
    const targetIndex = cellIndex(world.grid, target.x, target.y);

    applyAction(world, {
      ...IDLE_ACTION,
      turn: 0,
      move: true,
      mandible: false,
      pheromoneA: 0,
      pheromoneB: 1,
    });

    expect([world.ant.x, world.ant.y]).toEqual([target.x, target.y]);
    expect(world.pheromoneB.values[targetIndex]).toBeCloseTo(CHEMISTRY.pheromoneDeposit);
    expect(world.metrics.pheromoneDeposited).toBeCloseTo(CHEMISTRY.pheromoneDeposit);
  });
});
