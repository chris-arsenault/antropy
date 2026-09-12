import { createWorld } from "../../src/sim/world";
import { DEFAULT_CONFIG, type Config } from "../../src/sim/config";
import { type World } from "../../src/sim/types";
import { type Genotype } from "../../src/sim/genetics/genotype";
import { type Genome } from "../../src/sim/controller";
import { BODY_PARTS, structuralMass } from "../../src/sim/body";
import { blueprint } from "../../src/sim/phenotype";
import { initializeReceptors } from "../../src/sim/sensors";
import { heldEnergy, heldMaterial } from "../../src/sim/accounting";
import { foodAccess } from "./foodAccess";
import { type QuickScenario } from "./quickScenario";

export interface CapabilityCase {
  key: string;
  hypothesis: string;
  context: "brief" | "persistent" | "uniformA" | "uniformB";
  variants: { label: string; genome: Genotype }[];
  mature?: boolean;
  config?: Partial<Config>;
  toxin?: number;
  provenance?: Record<string, unknown>;
}

export function constructed(behavior: Genome, physical: Record<number, number> = {}): Genotype {
  const genes = new Float32Array(BODY_PARTS.length);
  for (const [i, value] of Object.entries(physical)) genes[Number(i)] = value;
  return { chromosomes: [{ behavior, physical: genes }] };
}

export function ancestralProcessing(g: Genotype): Genotype {
  return {
    chromosomes: g.chromosomes.map((c) => {
      const physical = c.physical.slice();
      physical[2] = 0;
      physical[4] = 0;
      return { physical, behavior: c.behavior };
    }),
  };
}

function uniform(seed: number, foodB: boolean): World {
  const w = createWorld(seed, {
    ...DEFAULT_CONFIG,
    width: 24,
    height: 24,
    founders: 16,
    sourceCount: 0,
    initialNutrient: 0,
    foodEpochs: undefined,
    foodZones: undefined,
    mutationRate: 0,
    physicalMutationRate: 0,
    learningRetention: 0,
    learning: "static",
  });
  (foodB ? w.nutrientB : w.nutrient).fill(96 / (24 * 24));
  for (const [i, c] of w.cells.entries()) {
    c.x = 4 + 4 * (i % 4);
    c.y = 4 + 4 * Math.floor(i / 4);
    c.heading = 0;
  }
  return w;
}

function install(w: World, test: CapabilityCase, swap: boolean): void {
  for (const [i, variant] of test.variants.entries()) {
    const id = i + 1;
    w.genomes.set(id, { id, parent: null, born: 0, learned: 0, genome: variant.genome });
  }
  w.nextGenome = test.variants.length + 1;
  for (const [i, c] of w.cells.entries()) {
    c.genome = ((i + Number(swap)) % test.variants.length) + 1;
    w.ancestry.get(c.id)!.genome = c.genome;
    if (test.mature) {
      const body = { ...blueprint(w.genomes.get(c.genome)!.genome, w.config) };
      const extra = structuralMass(body) - structuralMass(c.body);
      const expense = Math.max(0, extra) * w.config.constructionEnergy;
      c.reserve -= extra;
      c.energy -= expense;
      c.body = body;
      w.ledger.construction += expense;
      if (c.reserve < 0 || c.energy <= 0) throw new Error("Cannot fund diagnostic mature body");
    }
    initializeReceptors(w, c);
  }
  w.ledger.initialMaterial = heldMaterial(w);
  w.ledger.initial = heldEnergy(w) + w.ledger.construction;
}

export function capabilityScenario(test: CapabilityCase): QuickScenario {
  const foodB = test.context === "uniformB",
    uniformFood = test.context.startsWith("uniform");
  return {
    name: test.key,
    hypothesis: test.hypothesis,
    specification: {
      ...test,
      variants: test.variants.map((v) => v.label),
      provisioning: test.mature
        ? "Mature blueprint paid from common material/energy packet"
        : "Common founder stocks; targets develop through paid growth",
    },
    target: { x: uniformFood ? 12 : 16, y: uniformFood ? 12 : 16, radius: uniformFood ? 0 : 2 },
    offeredFoodA: foodB ? 0 : 96,
    offeredFoodB: foodB ? 96 : 0,
    create(seed, swap) {
      const w = uniformFood
        ? uniform(seed, foodB)
        : foodAccess(test.context as "brief" | "persistent").create(seed, false);
      Object.assign(w.config, test.config);
      w.toxin.fill(test.toxin ?? 0);
      install(w, test, swap);
      return w;
    },
  };
}
