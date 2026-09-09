import { type Ant, type World } from "./types";
import { adultBodies, canAct } from "./adultBody";

export function validTask(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 255;
}

/** Memory writes do not move food or bodies and have no fixed behavioral interpretation. */
export function writeTask(ant: Ant, value: number | null): void {
  if (value !== null && !validTask(value)) throw new Error("task register must be a byte");
  ant.taskAge++;
  if (value === null || value === ant.task) return;
  ant.task = value;
  ant.taskAge = 0;
  ant.taskChanges++;
}

/** Explicit diagnostic intervention, never an ordinary controller action. */
export function overrideTask(world: World, id: number, value: number): void {
  if (!validTask(value)) throw new Error("task register must be a byte");
  if (world.registeredController && value >= world.registeredController.tasks)
    throw new Error("task value is outside this model's vocabulary");
  const ant = adultBodies(world).find(
    (candidate) => candidate.id === id && canAct(world, candidate)
  );
  if (!ant) throw new Error("task override requires a living ant");
  const age = ant.taskAge,
    unchanged = ant.task === value;
  writeTask(ant, value);
  if (unchanged) ant.taskAge = age;
  world.taskOverrides++;
}
