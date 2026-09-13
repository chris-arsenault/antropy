/**
 * Abiotic disturbance. At random times a random disc of the world is stirred and thinned: the
 * dissolved fields inside are mixed toward their disc mean, and each cell inside dies with a
 * fixed probability, its material going to detritus as any death does. Nothing is created or
 * removed from the world; disturbance opens ground and resets local chemistry, which selects on
 * colonising against holding. Absent configuration disables it and draws no randomness.
 */
import { type World, type Cell } from "./types";
import { nextRandom } from "./random";
import { wrap } from "./geometry";
import { perish } from "./reproduction";

export interface DisturbanceConfig {
  /** Mean model seconds between events; timing is memoryless. */
  readonly meanInterval: number;
  /** Radius of the disturbed disc in world units. */
  readonly radius: number;
  /** Probability that a cell inside the disc dies. */
  readonly mortality: number;
  /** Fraction by which each dissolved field inside the disc moves toward its disc mean. */
  readonly mixing: number;
}
export const DEFAULT_DISTURBANCE: DisturbanceConfig = {
  meanInterval: 2000,
  radius: 10,
  mortality: 0.9,
  mixing: 1,
};
/** Fields that water movement mixes; matrix and what it binds stay put. */
const MIXED = [
  "nutrient",
  "nutrientB",
  "chemical",
  "toxin",
  "toxinB",
  "detritus",
  "carbon",
  "oxygen",
] as const;
/** Allowed range of each constant: [minimum, maximum, minimum exclusive]. */
const RANGES: Record<keyof DisturbanceConfig, [number, number, boolean]> = {
  meanInterval: [0, Infinity, true],
  radius: [0, Infinity, false],
  mortality: [0, 1, false],
  mixing: [0, 1, false],
};

const withinRange = (v: unknown, [low, high, exclusive]: [number, number, boolean]) =>
  typeof v === "number" && Number.isFinite(v) && v <= high && (exclusive ? v > low : v >= low);
export function validateDisturbance(value: unknown): void {
  if (value === undefined) return;
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid disturbance");
  const d = value as Record<string, unknown>;
  const bad = Object.entries(RANGES).find(([key, range]) => !withinRange(d[key], range));
  if (bad) throw new Error(`Invalid disturbance: ${bad[0]}`);
}

function inside(x: number, y: number, cx: number, cy: number, r: number, world: World): boolean {
  const c = world.config;
  let dx = Math.abs(x - cx),
    dy = Math.abs(y - cy);
  dx = Math.min(dx, c.width - dx);
  dy = Math.min(dy, c.height - dy);
  return dx * dx + dy * dy <= r * r;
}
/** Raster indices whose centres lie within the disc. */
function disc(world: World, cx: number, cy: number, r: number): number[] {
  const c = world.config,
    indices: number[] = [];
  for (let y = 0; y < c.height; y++)
    for (let x = 0; x < c.width; x++)
      if (inside(x + 0.5, y + 0.5, cx, cy, r, world)) indices.push(y * c.width + x);
  return indices;
}
function mixField(field: Float64Array, indices: number[], mixing: number): void {
  let sum = 0;
  for (const i of indices) sum += field[i];
  const mean = sum / indices.length;
  for (const i of indices) field[i] += (mean - field[i]) * mixing;
}
/** Advances the disturbance process by one tick; returns whether an event struck. */
export function disturb(world: World): boolean {
  const d = world.config.disturbance;
  if (!d) return false;
  const rng = world.environmentRng;
  if (nextRandom(rng) >= 1 - Math.exp(-world.config.dt / d.meanInterval)) return false;
  const cx = wrap(nextRandom(rng) * world.config.width, world.config.width),
    cy = wrap(nextRandom(rng) * world.config.height, world.config.height);
  const indices = disc(world, cx, cy, d.radius);
  if (indices.length > 0) for (const key of MIXED) mixField(world[key], indices, d.mixing);
  const victims = new Set<Cell>();
  for (const cell of world.cells)
    if (inside(cell.x, cell.y, cx, cy, d.radius, world) && nextRandom(rng) < d.mortality)
      victims.add(cell);
  for (const cell of victims) perish(world, cell, "disturbance");
  world.cells = world.cells.filter((cell) => !victims.has(cell));
  world.ledger.disturbances++;
  world.ledger.disturbanceDeaths += victims.size;
  return true;
}
