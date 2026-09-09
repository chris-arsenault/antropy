import { type World, type Cell } from "./types";
import { type Config } from "./config";
import { delta, moved, radius, wrap } from "./geometry";
import { deterministicJitter } from "./random";
import { SpatialIndex } from "./spatial";
import { deposit } from "./fields";

export function basal(cell: Cell, c: Config): number {
  return (c.maintenance * cell.mass + c.controllerCost) * c.dt;
}
function pay(world: World, cell: Cell): void {
  const c = world.config,
    a = cell.action;
  const motor = (c.swimCost * a.swim + c.turnCost * Math.abs(a.turn)) * cell.mass * c.dt;
  const chemical = c.secretionCost * c.secretionRate * a.secrete * c.dt;
  const available = Math.max(0, cell.energy - basal(cell, c));
  const scale = Math.min(1, available / Math.max(1e-30, motor + chemical));
  a.swim *= scale;
  a.turn *= scale;
  a.secrete *= scale;
  cell.energy -= (motor + chemical) * scale;
  world.ledger.motors += motor * scale;
  world.ledger.secretion += chemical * scale;
}
function markContact(a: Cell, dx: number, dy: number): void {
  // Y increases down the image; heading increases clockwise, left is negative rotation.
  const angle = wrap(Math.atan2(dy, dx) - a.heading + Math.PI / 4, 2 * Math.PI);
  const clockwise = Math.floor(angle / (Math.PI / 2));
  a.contacts[[0, 3, 2, 1][clockwise]] = 1;
}
function separate(a: Cell, b: Cell, index: SpatialIndex, c: Config): void {
  const dx = delta(b.x - a.x, c.width),
    dy = delta(b.y - a.y, c.height),
    d = Math.hypot(dx, dy);
  const overlap = radius(a.mass, c) + radius(b.mass, c) - d;
  if (overlap < -1e-8) return;
  markContact(a, dx, dy);
  markContact(b, -dx, -dy);
  if (overlap <= 0) return;
  const angle = d > 1e-10 ? Math.atan2(dy, dx) : (a.id + b.id) * 2.399963;
  index.remove(a);
  index.remove(b);
  Object.assign(a, moved(a, angle, -overlap / 2, c));
  Object.assign(b, moved(b, angle, overlap / 2, c));
  index.add(a);
  index.add(b);
}
export function resolveContacts(world: World): void {
  const index = new SpatialIndex(world.config, world.cells);
  for (let pass = 0; pass < 4; pass++)
    for (const a of world.cells)
      for (const b of index.near(a)) if (b.id > a.id) separate(a, b, index, world.config);
}
export function moveBodies(world: World): void {
  const c = world.config,
    steps = Math.max(1, Math.ceil((c.speed * c.dt) / (c.radius / 2)));
  for (const cell of world.cells) {
    pay(world, cell);
    cell.contacts = [0, 0, 0, 0];
    const turn = cell.action.turn * c.turnRate * c.dt;
    cell.heading = wrap(
      cell.heading +
        turn +
        deterministicJitter(world.seed, world.tick, cell.id) *
          Math.sqrt(6 * c.rotationalDiffusion * c.dt),
      2 * Math.PI
    );
    world.ledger.turning += Math.abs(turn);
  }
  for (let step = 0; step < steps; step++) {
    for (const cell of world.cells) {
      const d = (cell.action.swim * c.speed * c.dt) / steps;
      Object.assign(cell, moved(cell, cell.heading, d, c));
      world.ledger.distance += d;
    }
    resolveContacts(world);
  }
  for (const cell of world.cells) {
    const amount = cell.action.secrete * c.secretionRate * c.dt;
    deposit(world.chemical, cell, amount, c);
    world.ledger.emitted += amount;
  }
}
