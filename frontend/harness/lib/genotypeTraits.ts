import { type EngineWorld } from "../../src/engine/client";
import { type Genotype } from "../../src/engine/types";
export interface GenotypeFacts {
  expressed: Genotype["chromosomes"][number];
  blueprint: number[];
  sourceImportCapacity: number[];
}
/** Ratios describe kernel-expressed targets; body funding is recorded separately. */
export function traitValues(world: EngineWorld, id: number) {
  const { blueprint: b, expressed: g } = world.command<GenotypeFacts>("genotypeFacts", { id }),
    m = g.chemistry;
  const importers = m.transporters.reduce((sum, t, i) => sum + (t.export ? 0 : b[7 + i]), 0);
  return {
    membraneX: m.membrane.x,
    membraneY: m.membrane.y,
    core: b[0],
    motor: b[1] / b[0],
    importers: importers / b[0],
    enzymes: b.slice(11, 15).reduce((a, q) => a + q, 0) / b[0],
    importX: m.transporters[0].x,
    importY: m.transporters[0].y,
  };
}
