import { type World, type Cell } from "./types";
import { type Config } from "./config";
import { express, type Genotype } from "./genetics/genotype";
import { type Body, BODY_PARTS } from "./body";

/** Independent construction targets; capabilities come from actual body stocks. */
export function blueprint(genome: Genotype, c: Config): Body {
  const genes = express(genome).physical;
  const core = c.birthMass * Math.exp(genes[0]);
  return {
    core,
    motor: core * c.motorRatio * Math.exp(genes[1]),
    transport: core * c.transporterRatio * Math.exp(genes[2]),
    storage: core * c.storageRatio * Math.exp(genes[3]),
  };
}
export const targetBody = (world: World, cell: Cell): Body =>
  blueprint(world.genomes.get(cell.genome)!.genome, world.config);
export function divisionReady(world: World, cell: Cell): boolean {
  const target = targetBody(world, cell);
  return BODY_PARTS.every((key) => cell.body[key] >= 2 * target[key] - 1e-12);
}
