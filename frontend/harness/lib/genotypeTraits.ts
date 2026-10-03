import { type EngineWorld } from "../../src/engine/client";
import { type Genotype } from "../../src/engine/types";
import { type RecognitionProfile } from "../../src/engine/bindingTypes";
import { enzymeStock } from "../../src/engine/bodyParts";
export interface GenotypeFacts {
  expressed: Genotype["chromosomes"][number];
  blueprint: number[];
  sourceImportCapacity: number[];
  recognition: RecognitionProfile;
}
/** Ratios describe kernel-expressed targets; body funding is recorded separately. */
export function traitValues(world: EngineWorld, id: number) {
  const {
      blueprint: b,
      expressed: g,
      recognition,
    } = world.command<GenotypeFacts>("genotypeFacts", { id }),
    m = g.chemistry;
  const importers = m.transporters.reduce((sum, _t, i) => sum + b[7 + i], 0);
  return {
    membraneX: recognition.sites[16].preferred[0],
    membraneY: recognition.sites[16].preferred[1],
    core: b[0],
    motor: b[1] / b[0],
    importers: importers / b[0],
    enzymes:
      m.programs.reduce((sum, active, slot) => sum + (active ? b[enzymeStock(slot)] : 0), 0) / b[0],
    importX: recognition.sites[4].preferred[0],
    importY: recognition.sites[4].preferred[1],
  };
}
