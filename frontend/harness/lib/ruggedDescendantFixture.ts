import { type CellState, type Genotype, type Summary } from "../../src/engine/types";
import { type Engine } from "../../src/engine/client";
import { frozen, install, pulse } from "./engineFixtures";
import { type QuickScenario } from "./quickScenario";

export const circuit = new Set([0, 128, 136, 8]);
export type Variant = "descendant" | "parent" | "bias-restored";
export type Mixture = "local" | "circuit";
export interface Candidate {
  lambda: number;
  cell: CellState;
  descendant: Genotype;
  parent: Genotype;
  local: number[];
  selectedFraction: number;
  locus: { chromosome: number; enzyme: number; before: number; after: number };
}

export function largestBiasChange(descendant: Genotype, parent: Genotype) {
  const loci = descendant.chromosomes.flatMap((ch, chromosome) => {
    if (!ch.chemistry.keys || !parent.chromosomes[chromosome].chemistry.keys)
      throw new Error("Candidate lacks inherited keys");
    return ch.chemistry.keys.enzymes.map((key, enzyme) => ({
      chromosome,
      enzyme,
      before: parent.chromosomes[chromosome].chemistry.keys!.enzymes[enzyme].bias,
      after: key.bias,
    }));
  });
  const locus = loci.sort((a, b) => Math.abs(b.after - b.before) - Math.abs(a.after - a.before))[0];
  if (!locus || locus.after === locus.before)
    throw new Error("Candidate has no enzyme bias change");
  return locus;
}

function candidateGenotype(candidate: Candidate, variant: Variant) {
  const genotype = structuredClone(variant === "parent" ? candidate.parent : candidate.descendant);
  if (variant === "bias-restored") {
    const { chromosome, enzyme, before } = candidate.locus;
    genotype.chromosomes[chromosome].chemistry.keys!.enzymes[enzyme].bias = before;
  }
  return genotype;
}

export function attributionScenario(
  candidate: Candidate,
  variant: Variant,
  mixture: Mixture,
  limits: { document: string; maxRSS: number; maxWasm: number }
): QuickScenario {
  const doses: [number, number][] = candidate.local.flatMap((q, s) =>
    q > 0 && (mixture === "local" || circuit.has(s)) ? [[s, q * 576]] : []
  );
  let runningEngine: Engine | null = null;
  return {
    name: `rugged-attribution-lambda${candidate.lambda}-${variant}-${mixture}`,
    hypothesis:
      "An ordinary inherited binding jump makes additional local substrates fund work and growth.",
    specification: { registration: limits.document, candidate, variant, mixture, frozen, doses },
    target: { x: 12, y: 12, radius: 6 },
    stopOnExtinction: true,
    create(engine, seed) {
      runningEngine = engine;
      const world = engine.create(seed, {
        preset: "ecology",
        ...frozen,
        width: 24,
        height: 24,
        mesh: 2,
        founders: 1,
        sourceCount: 0,
        sourcePriming: 0,
        bindingLambda: candidate.lambda,
      });
      try {
        const packet = world.command<{ cell: CellState }>("inspect", { cell: 1 }).cell;
        install(
          world,
          [{ label: variant, genotype: candidateGenotype(candidate, variant) }],
          [{ cell: 1, variant: 0, x: 12, y: 12, heading: 0 }]
        );
        world.command("intervene", {
          cell: 1,
          inventory: Array.from({ length: 256 }, () => 0),
          boundMaterial: packet.boundMaterial.amounts,
          energy: 0.5,
          damage: 0,
          resetMemory: true,
        });
        pulse(world, doses);
        return world;
      } catch (error) {
        world.dispose();
        throw error;
      }
    },
    beforeStep(world) {
      if (world.command<Summary>("summary").population > 12) throw new Error("Population cap");
      if (process.memoryUsage().rss > limits.maxRSS) throw new Error("RSS cap");
      if (runningEngine!.memoryBytes > limits.maxWasm) throw new Error("WASM cap");
    },
  };
}
