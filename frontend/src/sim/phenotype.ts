import { type World, type Cell } from "./types";
import { type Config } from "./config";
import { express, type Genotype } from "./genetics/genotype";
import { type Body, BODY_PARTS } from "./body";

const blueprints = new WeakMap<Genotype, { config: Config; body: Body }>();
/** Independent construction targets; capabilities come from actual body stocks. */
export function blueprint(genome: Genotype, c: Config): Body {
  const cached = blueprints.get(genome);
  if (cached && cached.config === c) return cached.body;
  const genes = express(genome).physical;
  const core = c.birthMass * Math.exp(genes[0]);
  const body = {
    core,
    motor: core * c.motorRatio * Math.exp(genes[1]),
    transport: core * c.transporterRatio * Math.exp(genes[2]),
    storage: core * c.storageRatio * Math.exp(genes[3]),
    transportB: core * c.transportBRatio * Math.exp(genes[4]),
    defense: core * c.defenseRatio * Math.exp(genes[5]),
    weapon: core * c.weaponRatio * Math.exp(genes[6]),
    builder: core * c.builderRatio * Math.exp(genes[7]),
    photo: core * (c.cycle?.photoRatio ?? 0) * Math.exp(genes[8]),
  };
  // Genotypes are immutable; callers must not mutate the returned targets.
  blueprints.set(genome, { config: c, body });
  return body;
}
export const targetBody = (world: World, cell: Cell): Body =>
  blueprint(world.genomes.get(cell.genome)!.genome, world.config);
export function divisionReady(world: World, cell: Cell): boolean {
  const target = targetBody(world, cell);
  return BODY_PARTS.every((key) => cell.body[key] >= 2 * target[key] - 1e-12);
}
