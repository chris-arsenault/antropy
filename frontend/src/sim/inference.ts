import { controller } from "./controller";
import { express } from "./genetics/genotype";
import { basal } from "./body";
import { recordEvent } from "./events";
import { observe } from "./sensors";
import { type World, type Cell } from "./types";
import { flow } from "./observation";

/** Observes, funds optional learning, and lets the controller choose this cell's efforts. */
export function infer(world: World, cell: Cell): void {
  const c = world.config,
    genome = express(world.genomes.get(cell.genome)!.genome).behavior;
  const previous = cell.brain.task,
    plastic = c.learning === "plastic";
  const strength = controller.plasticityStrength(genome);
  const cost = c.plasticityCost * strength * c.dt;
  const learn = plastic && strength > 0 && cell.energy >= basal(cell, c) + cost;
  cell.inputs = observe(world, cell);
  if (learn) {
    cell.energy -= cost;
    world.ledger.learning += cost;
    flow(world, cell, "learning", cost);
  }
  cell.action = controller.act(genome, cell.inputs, cell.brain, { dt: c.dt, plastic, learn });
  if (previous !== cell.brain.task) {
    world.ledger.taskWrites++;
    recordEvent(world, "task", cell.id, [previous, cell.brain.task]);
  }
}
