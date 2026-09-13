import { type World } from "./types";
import { diffuse } from "./fields";
import { advanceDeposits } from "./deposits";
import { exchangeAtmosphere } from "./cycle";

/** Matrix binds free toxin of one type up to `capacity`, releases the excess, and destroys bound toxin. */
function bindToxin(
  world: World,
  i: number,
  capacity: number,
  free: Float64Array,
  bound: Float64Array
): void {
  const c = world.config;
  const released = Math.max(0, bound[i] - capacity);
  bound[i] -= released;
  free[i] += released;
  const binding =
    Math.min(free[i], Math.max(0, capacity - bound[i])) * (1 - Math.exp(-c.matrixBinding * c.dt));
  free[i] -= binding;
  bound[i] += binding;
  const destroyed = bound[i] * (1 - Math.exp(-c.toxinDecay * c.dt));
  bound[i] -= destroyed;
  world.ledger.toxinLoss += destroyed;
}
function react(world: World): void {
  const c = world.config,
    typed = c.toxinTypes === 2;
  for (let i = 0; i < world.matrix.length; i++) {
    const decayed = world.matrix[i] * (1 - Math.exp(-c.matrixDecay * c.dt));
    world.matrix[i] -= decayed;
    world.detritus[i] += decayed;
    // Both toxin types share the matrix's binding capacity, split evenly when two exist.
    const capacity = (world.matrix[i] * c.matrixCapacity) / (typed ? 2 : 1);
    bindToxin(world, i, capacity, world.toxin, world.boundToxin);
    if (typed) bindToxin(world, i, capacity, world.toxinB, world.boundToxinB);
    const food = world.detritus[i] * (1 - Math.exp(-c.detritusDecay * c.dt));
    // Decomposition returns feedstock as both foods equally; it favours neither pathway.
    world.detritus[i] -= food;
    world.nutrient[i] += food / 2;
    world.nutrientB[i] += food / 2;
  }
}
export function advanceFields(world: World): void {
  const c = world.config;
  advanceDeposits(world);
  react(world);
  world.ledger.nutrientLoss += diffuse(
    world.nutrient,
    c,
    c.nutrientDiffusion,
    c.nutrientDecay,
    world.matrix
  );
  world.ledger.nutrientLoss += diffuse(
    world.nutrientB,
    c,
    c.nutrientDiffusion,
    c.nutrientDecay,
    world.matrix
  );
  if (world.chemical.some((value) => value > 0))
    world.ledger.chemicalLoss += diffuse(
      world.chemical,
      c,
      c.chemicalDiffusion,
      c.chemicalDecay,
      world.matrix
    );
  world.ledger.toxinLoss += diffuse(world.toxin, c, c.toxinDiffusion, c.toxinDecay, world.matrix);
  if (c.toxinTypes === 2)
    world.ledger.toxinLoss += diffuse(
      world.toxinB,
      c,
      c.toxinDiffusion,
      c.toxinDecay,
      world.matrix
    );
  if (c.cycle) {
    diffuse(world.carbon, c, c.cycle.carbonDiffusion, 0, world.matrix);
    diffuse(world.oxygen, c, c.cycle.oxygenDiffusion, 0, world.matrix);
    exchangeAtmosphere(world);
  }
}
