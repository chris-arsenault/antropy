import { type World } from "./types";
import { diffuse } from "./fields";
import { advanceDeposits } from "./deposits";
import { exchangeAtmosphere } from "./cycle";

function react(world: World): void {
  const c = world.config;
  for (let i = 0; i < world.matrix.length; i++) {
    const decayed = world.matrix[i] * (1 - Math.exp(-c.matrixDecay * c.dt));
    world.matrix[i] -= decayed;
    world.detritus[i] += decayed;
    const capacity = world.matrix[i] * c.matrixCapacity;
    const released = Math.max(0, world.boundToxin[i] - capacity);
    world.boundToxin[i] -= released;
    world.toxin[i] += released;
    const bound =
      Math.min(world.toxin[i], Math.max(0, capacity - world.boundToxin[i])) *
      (1 - Math.exp(-c.matrixBinding * c.dt));
    world.toxin[i] -= bound;
    world.boundToxin[i] += bound;
    const destroyed = world.boundToxin[i] * (1 - Math.exp(-c.toxinDecay * c.dt));
    world.boundToxin[i] -= destroyed;
    world.ledger.toxinLoss += destroyed;
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
  if (c.cycle) {
    diffuse(world.carbon, c, c.cycle.carbonDiffusion, 0, world.matrix);
    diffuse(world.oxygen, c, c.cycle.oxygenDiffusion, 0, world.matrix);
    exchangeAtmosphere(world);
  }
}
