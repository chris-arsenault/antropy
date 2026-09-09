import { type World, type Cell } from "./types";
import { type Config } from "./config";
import { delta, moved, radius, wrap } from "./geometry";
import { deterministicJitter } from "./random";
import { SpatialIndex } from "./spatial";
import { deposit } from "./fields";
import { basal, locomotion } from "./body";
function pay(world: World, cell: Cell): void {
  const c = world.config,
    a = cell.action;
  const effort = Math.max(1, Math.hypot(a.swim, a.turn));
  a.swim /= effort;
  a.turn /= effort;
  a.secrete = Math.min(a.secrete, cell.reserve / Math.max(1e-30, c.secretionRate * c.dt));
  const motor = (a.swim ** 2 + a.turn ** 2) * cell.body.motor * c.motorPowerDensity * c.dt;
  const chemical = c.secretionCost * c.secretionRate * a.secrete * c.dt;
  const available = Math.max(0, cell.energy - basal(cell, c));
  // Solve motor*s^2 + chemical*s = available using the stable positive root.
  const scale =
    motor + chemical <= available
      ? 1
      : (2 * available) /
        Math.max(1e-30, chemical + Math.sqrt(chemical ** 2 + 4 * motor * available));
  a.swim *= scale;
  a.turn *= scale;
  a.secrete *= scale;
  cell.energy = Math.max(0, cell.energy - motor * scale ** 2 - chemical * scale);
  world.ledger.motors += motor * scale ** 2;
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
  Object.assign(a, moved(a, angle, (-overlap * rb) / (ra + rb), c));
  Object.assign(b, moved(b, angle, (overlap * ra) / (ra + rb), c));
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
    rates = new Map(world.cells.map((cell) => [cell.id, locomotion(cell, c)]));
  const fastest = world.cells.reduce((v, cell) => Math.max(v, rates.get(cell.id)!.speed), 0);
  const smallest = world.cells.reduce((r, cell) => Math.min(r, radius(cell, c)), Infinity);
  const steps = Math.max(1, Math.ceil((fastest * c.dt) / (smallest / 2)));
  for (const cell of world.cells) {
    pay(world, cell);
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
      const d = (cell.action.swim * rates.get(cell.id)!.speed * c.dt) / steps;
      Object.assign(cell, moved(cell, cell.heading, d, c));
      world.ledger.distance += d;
    }
    resolveContacts(world);
  }
  for (const cell of world.cells) {
    const amount = cell.action.secrete * c.secretionRate * c.dt;
    cell.reserve = Math.max(0, cell.reserve - amount);
    deposit(world.chemical, cell, amount, c);
    world.ledger.emitted += amount;
  }
}
