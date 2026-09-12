import { type World, type Cell } from "./types";
import { delta, moved, radius, wrap } from "./geometry";
import { deterministicJitter } from "./random";
import { SpatialIndex } from "./spatial";
import { locomotion } from "./body";
import { affordActions, emitActions } from "./secretion";
import { matrixAllows, matrixMobility } from "./matrix";
function markContact(a: Cell, dx: number, dy: number): void {
  // Y increases down the image; heading increases clockwise, left is negative rotation.
  const angle = wrap(Math.atan2(dy, dx) - a.heading + Math.PI / 4, 2 * Math.PI);
  const clockwise = Math.floor(angle / (Math.PI / 2));
  a.contacts[[0, 3, 2, 1][clockwise]] = 1;
}
/** Returns whether any body was displaced; touching without overlap only marks contact. */
function separate(a: Cell, b: Cell, index: SpatialIndex, world: World): boolean {
  const c = world.config;
  const dx = delta(b.x - a.x, c.width),
    dy = delta(b.y - a.y, c.height),
    d = Math.hypot(dx, dy);
  const ra = index.radius(a),
    rb = index.radius(b);
  const overlap = ra + rb - d;
  if (overlap < -1e-8) return false;
  markContact(a, dx, dy);
  markContact(b, -dx, -dy);
  if (overlap <= 0) return false;
  const angle = d > 1e-10 ? Math.atan2(dy, dx) : (a.id + b.id) * 2.399963;
  index.remove(a);
  index.remove(b);
  const pa = moved(a, angle, (-overlap * rb) / (ra + rb), c);
  const pb = moved(b, angle, (overlap * ra) / (ra + rb), c);
  if (matrixAllows(world, a, pa, ra)) Object.assign(a, pa);
  if (matrixAllows(world, b, pb, rb)) Object.assign(b, pb);
  index.add(a);
  index.add(b);
  return true;
}
function separationPass(world: World, index: SpatialIndex): boolean {
  const cells = world.cells;
  let displaced = false;
  for (let i = 0; i < cells.length; i++) {
    const a = cells[i],
      near = index.near(a);
    for (let j = 0; j < near.length; j++)
      if (near[j].id > a.id && separate(a, near[j], index, world)) displaced = true;
  }
  return displaced;
}
/** Four separation passes; a pass that displaces nothing makes the remaining passes no-ops. */
export function resolveContacts(world: World): void {
  const index = new SpatialIndex(world.config, world.cells);
  for (let pass = 0; pass < 4; pass++) if (!separationPass(world, index)) return;
}
/** Pays efforts and turns every body; returns the substep count for bounded translation. */
function orient(world: World, rates: Map<number, ReturnType<typeof locomotion>>): number {
  const c = world.config;
  const fastest = world.cells.reduce((v, cell) => Math.max(v, rates.get(cell.id)!.speed), 0);
  const smallest = world.cells.reduce((r, cell) => Math.min(r, radius(cell, c)), Infinity);
  for (const cell of world.cells) {
    affordActions(world, cell);
    cell.contacts = [0, 0, 0, 0];
    const turn = cell.action.turn * rates.get(cell.id)!.turnRate * c.dt;
    cell.heading = wrap(
      cell.heading +
        turn +
        deterministicJitter(world.seed, world.tick, cell.id) *
          Math.sqrt(6 * rates.get(cell.id)!.rotationalDiffusion * c.dt),
      2 * Math.PI
    );
    world.ledger.turning += Math.abs(turn);
  }
  return Math.max(1, Math.ceil((fastest * c.dt) / Math.min(0.25, smallest / 2)));
}
/** One bounded translation substep with matrix drag; solid mode also checks swept footprints. */
function moveStep(
  world: World,
  rates: Map<number, ReturnType<typeof locomotion>>,
  steps: number
): void {
  const c = world.config;
  for (const cell of world.cells) {
    const d =
      (cell.action.swim * rates.get(cell.id)!.speed * c.dt * matrixMobility(world, cell)) / steps;
    const next = moved(cell, cell.heading, d, c);
    if (matrixAllows(world, cell, next, radius(cell, c))) {
      Object.assign(cell, next);
      world.ledger.distance += d;
    } else {
      cell.contacts[0] = 1;
      world.ledger.matrixBlocked++;
    }
  }
}
export function moveBodies(world: World): void {
  const c = world.config,
    rates = new Map(world.cells.map((cell) => [cell.id, locomotion(cell, c)]));
  const steps = orient(world, rates);
  for (let step = 0; step < steps; step++) {
    moveStep(world, rates, steps);
    resolveContacts(world);
  }
  for (const cell of world.cells) emitActions(world, cell);
}
