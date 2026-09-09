import { occupied } from "../contact";
import { cellIndex, getCell, setCell } from "../grid";
import { Material, MATERIALS } from "../materials";
import { type Point, samePoint } from "../geometry";
import { type Ant, type World } from "../types";
import { type ActionResult } from "../colony/contract";
import { supportedSite } from "./sites";

export function diggable(material: Material): boolean {
  return [Material.SOIL, Material.CLAY, Material.LOOSE_SOIL, Material.WOOD].includes(material);
}

function loaded(world: World, ant: Ant): boolean {
  return (
    ant.brood !== null || ant.spoil !== null || ant.cargo > 0 || world.queen.carrier === ant.id
  );
}

export function dig(world: World, ant: Ant, point: Point): ActionResult {
  if (!world.config.environment.excavation) return "blocked";
  if (loaded(world, ant)) return "full";
  const material = getCell(world.grid, point.x, point.y);
  if (!diggable(material) || occupied(world, point)) return "blocked";
  const index = cellIndex(world.grid, point.x, point.y);
  const work = (world.construction.excavation.get(index) ?? 0) + 0.2;
  if (work + 1e-9 < MATERIALS[material].excavationWork) {
    world.construction.excavation.set(index, work);
    return "working";
  }
  world.construction.excavation.delete(index);
  setCell(world.grid, point.x, point.y, Material.AIR);
  ant.spoil = material;
  const job = world.construction.jobs.find((entry) => entry.id === ant.job);
  if (job && samePoint(job, point)) job.spoilPending = true;
  world.construction.excavated++;
  return "success";
}

export function canDepositSpoil(world: World, point: Point): boolean {
  return (
    supportedSite(world, point) &&
    !world.food.has(cellIndex(world.grid, point.x, point.y)) &&
    !world.construction.loose.has(cellIndex(world.grid, point.x, point.y))
  );
}

export function depositSpoil(world: World, ant: Ant, point: Point): ActionResult {
  if (ant.spoil === null) return "empty";
  if (!canDepositSpoil(world, point)) return "blocked";
  setCell(world.grid, point.x, point.y, ant.spoil);
  ant.spoil = null;
  const job = world.construction.jobs.find((entry) => entry.id === ant.job);
  if (job) job.spoilPending = false;
  world.construction.deposited++;
  return "success";
}

export function recoverSpoil(world: World, ant: Ant, point: Point): ActionResult {
  if (loaded(world, ant)) return "full";
  const index = cellIndex(world.grid, point.x, point.y);
  if (getCell(world.grid, point.x, point.y) !== Material.AIR) return "blocked";
  const pile = world.construction.loose.get(index);
  if (!pile?.length) return "empty";
  ant.spoil = pile.pop()!;
  if (!pile.length) world.construction.loose.delete(index);
  const job = world.construction.jobs.find((entry) => entry.id === ant.job);
  if (job && job.recovery !== null) {
    world.knowledge.locations.delete(job.recovery);
    job.recovery = null;
  }
  return "success";
}
