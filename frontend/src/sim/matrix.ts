import { type World, type Point } from "./types";
import { sample } from "./fields";
import { moved, delta } from "./geometry";

export function matrixExposure(world: World, point: Point, radius: number): number {
  return Math.max(
    sample(world.matrix, point, world.config),
    ...[0, 1, 2, 3].map((i) =>
      sample(world.matrix, moved(point, (i * Math.PI) / 2, radius, world.config), world.config)
    )
  );
}
export function matrixFree(world: World, point: Point, radius: number): boolean {
  if (world.config.matrixMode === "porous") return true;
  return matrixExposure(world, point, radius) < world.config.matrixBarrier;
}
export function matrixAllows(world: World, from: Point, to: Point, radius: number): boolean {
  if (world.config.matrixMode === "porous") return true;
  const dx = delta(to.x - from.x, world.config.width),
    dy = delta(to.y - from.y, world.config.height);
  const distance = Math.hypot(dx, dy),
    steps = Math.max(1, Math.ceil(distance / 0.25));
  let previous = matrixExposure(world, from, radius);
  for (let i = 1; i <= steps; i++) {
    const point = moved(from, Math.atan2(dy, dx), (distance * i) / steps, world.config);
    const next = matrixExposure(world, point, radius);
    if (next >= world.config.matrixBarrier && next >= previous - 1e-12) return false;
    previous = next;
  }
  return true;
}
export const matrixMobility = (world: World, point: Point): number =>
  1 / (1 + world.config.matrixDrag * sample(world.matrix, point, world.config));
