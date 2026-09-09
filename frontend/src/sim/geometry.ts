import { type Config } from "./config";
import { type Point, type Cell } from "./types";
import { bodyRadius } from "./body";

export const wrap = (value: number, size: number): number => ((value % size) + size) % size;
export const delta = (value: number, size: number): number =>
  wrap(value + size / 2, size) - size / 2;
export function distance(a: Point, b: Point, c: Config): number {
  return Math.hypot(delta(a.x - b.x, c.width), delta(a.y - b.y, c.height));
}
export const radius = (cell: Pick<Cell, "body" | "reserve">, c: Config): number =>
  bodyRadius(cell, c);
export function moved(p: Point, heading: number, length: number, c: Config): Point {
  return {
    x: wrap(p.x + Math.cos(heading) * length, c.width),
    y: wrap(p.y + Math.sin(heading) * length, c.height),
  };
}
