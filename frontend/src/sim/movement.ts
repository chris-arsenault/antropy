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
function separate(a: Cell, b: Cell, index: SpatialIndex, world: World): void {
  const c = world.config;
  const dx = delta(b.x - a.x, c.width),
    dy = delta(b.y - a.y, c.height),
    d = Math.hypot(dx, dy);
  const ra = radius(a, c),
    rb = radius(b, c);
  const overlap = ra + rb - d;
  if (overlap < -1e-8) return;
  markContact(a, dx, dy);
  markContact(b, -dx, -dy);
  if (overlap <= 0) return;
  const angle = d > 1e-10 ? Math.atan2(dy, dx) : (a.id + b.id) * 2.399963;
  index.remove(a);
  index.remove(b);
  const pa = moved(a, angle, (-overlap * rb) / (ra + rb), c);
  const pb = moved(b, angle, (overlap * ra) / (ra + rb), c);
  if (matrixAllows(world, a, pa, ra)) Object.assign(a, pa);
  if (matrixAllows(world, b, pb, rb)) Object.assign(b, pb);
  index.add(a);
  index.add(b);
}
export function resolveContacts(world: World): void {
  const index = new SpatialIndex(world.config, world.cells);
  for (let pass = 0; pass < 4; pass++)
    for (const a of world.cells)
      for (const b of index.near(a)) if (b.id > a.id) separate(a, b, index, world);
}
export function moveBodies(world: World): void {
  const c = world.config,
    rates = new Map(world.cells.map((cell) => [cell.id, locomotion(cell, c)]));
  const fastest = world.cells.reduce((v, cell) => Math.max(v, rates.get(cell.id)!.speed), 0);
  const smallest = world.cells.reduce((r, cell) => Math.min(r, radius(cell, c)), Infinity);
  const steps = Math.max(1, Math.ceil((fastest * c.dt) / Math.min(0.25, smallest / 2)));
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
  for (let step = 0; step < steps; step++) {
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
    resolveContacts(world);
  }
  for (const cell of world.cells) emitActions(world, cell);
}
