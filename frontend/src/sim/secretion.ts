import { type World, type Cell } from "./types";
import { deposit } from "./fields";
import { basal } from "./body";
import { flow } from "./observation";

function amounts(world: World, cell: Cell): number[] {
  const c = world.config,
    a = cell.action,
    working = 1 - cell.damage;
  return [
    a.secrete * c.secretionRate * cell.body.core * c.dt,
    a.toxin * c.toxinRate * cell.body.weapon * c.dt * working,
    a.matrix * c.matrixRate * cell.body.builder * c.dt * working,
  ];
}
export function affordActions(world: World, cell: Cell): void {
  const c = world.config,
    a = cell.action;
  const effort = Math.max(1, Math.hypot(a.swim, a.turn));
  a.swim /= effort;
  a.turn /= effort;
  const requested = amounts(world, cell).reduce((s, q) => s + q, 0);
  const precursor = Math.min(1, cell.reserve / Math.max(requested, 1e-30));
  a.secrete *= precursor;
  a.toxin *= precursor;
  a.matrix *= precursor;
  const q = amounts(world, cell);
  const synthesis = q[0] * c.secretionCost + q[1] + q[2] * 0.5;
  const motor = (a.swim ** 2 + a.turn ** 2) * cell.body.motor * c.motorPowerDensity * c.dt;
  const available = Math.max(0, cell.energy - basal(cell, c));
  const scale =
    motor + synthesis <= available
      ? 1
      : (2 * available) /
        Math.max(1e-30, synthesis + Math.sqrt(synthesis ** 2 + 4 * motor * available));
  a.swim *= scale;
  a.turn *= scale;
  a.secrete *= scale;
  a.toxin *= scale;
  a.matrix *= scale;
  cell.energy = Math.max(0, cell.energy - motor * scale ** 2 - synthesis * scale);
  world.ledger.motors += motor * scale ** 2;
  world.ledger.secretion += synthesis * scale;
  flow(world, cell, "motors", motor * scale ** 2);
  flow(world, cell, "synthesis", synthesis * scale);
}
export function emitActions(world: World, cell: Cell): void {
  const q = amounts(world, cell),
    c = world.config;
  cell.reserve = Math.max(0, cell.reserve - q.reduce((s, v) => s + v, 0));
  deposit(world.chemical, cell, q[0], c);
  deposit(world.toxin, cell, q[1], c);
  deposit(world.matrix, cell, q[2], c);
  world.ledger.emitted += q[0];
  world.ledger.toxinEmitted += q[1];
  world.ledger.matrixEmitted += q[2];
  flow(world, cell, "signal", q[0]);
  flow(world, cell, "toxin", q[1]);
  flow(world, cell, "matrix", q[2]);
}
