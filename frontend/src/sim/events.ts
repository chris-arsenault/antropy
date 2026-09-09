import { type World, type Event } from "./types";

export function recordEvent(
  world: World,
  kind: Event["kind"],
  cell: number,
  values: number[]
): void {
  world.events.push({ tick: world.tick, kind, cell, values });
  if (world.events.length > 512) world.events.splice(0, world.events.length - 512);
}
export function overrideTask(world: World, id: number, task: number): void {
  if (!Number.isInteger(task) || task < 0 || task > 255)
    throw new Error("Task byte must be 0..255");
  const cell = world.cells.find((c) => c.id === id);
  if (!cell) throw new Error("Cell no longer alive");
  world.interventions.push({ tick: world.tick, cell: id, previous: cell.brain.task, value: task });
  recordEvent(world, "override", id, [cell.brain.task, task]);
  cell.brain.task = task;
}
