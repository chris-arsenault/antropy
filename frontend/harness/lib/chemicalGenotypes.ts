import { type Engine } from "../../src/engine/client";
import {
  type Definition,
  type EngineConfig,
  type Genotype,
  type Target,
} from "../../src/engine/types";

export interface ChemicalContext {
  config: EngineConfig;
  chemistry: Definition["chemistry"];
  genotype: Genotype;
  stationary: Genotype["chromosomes"][number]["behavior"];
}
export const chemicalContext = (engine: Engine, config: Partial<EngineConfig> = {}) =>
  engine.command<ChemicalContext>("configuration", { config });
export const coordinate = (species: number) => ({ x: Math.floor(species / 16), y: species % 16 });
export const enzymeBetween = (from: Target, to: Target) => ({
  ...from,
  centerX: (from.x + to.x) / 2,
  centerY: (from.y + to.y) / 2,
  angle: 0,
});
export function stressSpecies(context: ChemicalContext) {
  return context.chemistry.properties.reduce(
    (best, p, s, all) => (p.stress > all[best].stress ? s : best),
    0
  );
}
export function lowStressProduct(context: ChemicalContext) {
  return context.chemistry.properties.reduce(
    (best, p, s, all) =>
      p.potential + 8 * p.stress < all[best].potential + 8 * all[best].stress ? s : best,
    0
  );
}
export function allocationGenome(firstShare: number, context: ChemicalContext): Genotype {
  if (!Number.isFinite(firstShare) || firstShare < 0 || firstShare > 1)
    throw new Error("Invalid machinery share");
  const g = structuredClone(context.genotype);
  for (const c of g.chromosomes) {
    c.behavior = structuredClone(context.stationary);
    for (const slot of [0, 1]) {
      const multiplier = 2 * (slot === 0 ? firstShare : 1 - firstShare);
      for (const locus of [7 + slot, 11 + slot, 13 + slot]) c.physical[locus] = multiplier - 1;
    }
  }
  return g;
}
export function membraneGenome(compatible: boolean, context: ChemicalContext): Genotype {
  const g = allocationGenome(0.5, context),
    p = coordinate(stressSpecies(context));
  for (const c of g.chromosomes)
    c.chemistry.membrane = compatible ? p : { x: p.x < 8 ? 15 : 0, y: p.y < 8 ? 15 : 0 };
  return g;
}
/** Dedicated import and unary detoxification replace one processing slot each. */
export function detoxGenome(enabled: boolean, context: ChemicalContext): Genotype {
  const g = membraneGenome(false, context),
    from = coordinate(stressSpecies(context)),
    to = coordinate(lowStressProduct(context));
  for (const c of g.chromosomes) {
    c.chemistry.transporters[1] = { ...from };
    c.chemistry.enzymes[1] = {
      ...from,
      centerX: enabled ? enzymeBetween(from, to).centerX : 0,
      centerY: enabled ? enzymeBetween(from, to).centerY : 0,
      angle: 0,
    };
  }
  return g;
}
