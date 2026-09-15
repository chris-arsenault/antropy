import { type Engine } from "../../src/engine/client";
import { type Genotype } from "../../src/engine/types";
import {
  allocationGenome,
  membraneGenome,
  detoxGenome,
  stressSpecies,
  chemicalContext,
  type ChemicalContext,
} from "./chemicalGenotypes";
import { type CapabilityCase } from "./capabilityFixture";

function motor(base: Genotype, factor: number) {
  const g = structuredClone(base);
  for (const c of g.chromosomes) c.physical[1] = factor - 1;
  return g;
}
function movementCases(c: ChemicalContext): CapabilityCase[] {
  const genotype = c.genotype;
  return (["persistent", "brief"] as const).flatMap((context) => [
    {
      key: `propulsion-${context}`,
      context,
      hypothesis: "Inventory-dependent propulsion preserves intake and lowers motor expense",
      variants: [
        { label: "fast", genotype, changes: { swimBiasDelta: 0.3 } },
        {
          label: "inventory brake 0.6",
          genotype,
          changes: { swimBiasDelta: 0.3, inventoryBrake: 0.6 },
        },
      ],
    },
    {
      key: `motor-${context}`,
      context,
      mature: true,
      hypothesis:
        "Coordinated motor investment changes speed versus construction and maintenance costs",
      variants: [
        {
          label: "half motor, gain sqrt(2)",
          genotype: motor(genotype, 0.5),
          changes: { swimBiasDelta: 0.3, motorGain: Math.sqrt(2) },
        },
        {
          label: "double motor, gain 1/sqrt(2)",
          genotype: motor(genotype, 2),
          changes: { swimBiasDelta: 0.3, motorGain: 1 / Math.sqrt(2) },
        },
      ],
    },
    {
      key: `recurrence-${context}`,
      context,
      hypothesis: "Baseline recurrence contributes beyond phasic receptors and local contrast",
      variants: [
        { label: "intact fast", genotype, changes: { swimBiasDelta: 0.3 } },
        {
          label: "recurrent block zero",
          genotype,
          changes: { swimBiasDelta: 0.3, recurrence: "zero" },
        },
      ],
    },
  ]);
}
function processingCases(c: ChemicalContext): CapabilityCase[] {
  return (["uniform0", "uniform1"] as const).map((context) => ({
    key: `processing-${context}`,
    context,
    mature: true,
    hypothesis: "Equal total import/enzyme stocks yield substrate-dependent acquisition and growth",
    variants: [
      { label: "75% first-source investment", genotype: allocationGenome(0.75, c) },
      { label: "25% first-source investment", genotype: allocationGenome(0.25, c) },
    ],
  }));
}
function protectionCases(c: ChemicalContext): CapabilityCase[] {
  return [0, 0.1].flatMap((concentration) => [
    {
      key: `compatibility-${concentration ? "exposed" : "clean"}`,
      context: "uniform0" as const,
      exposure: { species: stressSpecies(c), concentration },
      hypothesis: "Membrane compatibility reduces matched exposure without universal immunity",
      variants: [
        { label: "compatible membrane", genotype: membraneGenome(true, c) },
        { label: "distant membrane", genotype: membraneGenome(false, c) },
      ],
    },
    {
      key: `detoxification-${concentration ? "exposed" : "clean"}`,
      context: "uniform0" as const,
      exposure: { species: stressSpecies(c), concentration },
      hypothesis:
        "Paid import and transformation reduce injury relative to an isoenergetic self-reaction",
      variants: [
        { label: "detoxifying offset", genotype: detoxGenome(true, c) },
        { label: "zero offset", genotype: detoxGenome(false, c) },
      ],
    },
  ]);
}
export function capabilityScreens(engine: Engine): CapabilityCase[] {
  const c = chemicalContext(engine);
  return [...movementCases(c), ...processingCases(c), ...protectionCases(c)];
}
export const founderGenotype = (engine: Engine) => chemicalContext(engine).genotype;
