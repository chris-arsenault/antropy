import { DEFAULT_CONFIG } from "../../src/sim/config";
import { createWorld } from "../../src/sim/world";
import { type World } from "../../src/sim/types";
import { travelGenome } from "../../src/sim/controller/diagnostics";
import { initializeReceptors } from "../../src/sim/sensors";
import { heldEnergy, heldMaterial, total } from "../../src/sim/accounting";
import { type QuickScenario } from "./quickScenario";

function installVariants(w: World): void {
  const base = w.genomes.get(1)!;
  for (const [i, speed] of (["fast", "slow"] as const).entries()) {
    const genome = {
      chromosomes: base.genome.chromosomes.map((c) => ({
        physical: c.physical.slice(),
        behavior: travelGenome(speed),
      })),
    };
    w.genomes.set(i + 1, { ...base, id: i + 1, genome });
  }
  w.nextGenome = 3;
}

function placeFood(w: World): void {
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 32; x++)
      w.nutrient[y * 32 + x] = Math.exp(-((x - 16) ** 2 + (y - 16) ** 2) / 8);
  const factor = 96 / total(w.nutrient);
  for (let i = 0; i < w.nutrient.length; i++) w.nutrient[i] *= factor;
}

export function foodAccess(context: "persistent" | "brief"): QuickScenario {
  const distance = context === "persistent" ? 4 : 8;
  const decay = context === "persistent" ? DEFAULT_CONFIG.nutrientDecay : Math.log(2) / 24;
  return {
    name: `food-access-${context}`,
    hypothesis:
      "Higher propulsion repays its cost for distant perishable food; lower propulsion pays near persistent food.",
    specification: {
      context,
      distance,
      foodHalfLifeTicks: Math.log(2) / (decay * DEFAULT_CONFIG.dt),
      patchSigma: 2,
      initialHeadingOffsetRadians: Math.PI / 4,
      variants: { 1: "fast propulsion bias 1", 2: "slow propulsion bias 0.15" },
      limitations:
        "Constructed strategies, bundled opportunity contexts, no evolved discovery; recycled food B remains active.",
    },
    target: { x: 16, y: 16, radius: 2 },
    offeredFoodA: 96,
    create(seed, swap, probe) {
      const w = createWorld(seed, {
        ...DEFAULT_CONFIG,
        width: 32,
        height: 32,
        founders: probe ? 1 : 16,
        sourceCount: 0,
        initialNutrient: 0,
        nutrientDecay: decay,
        foodEpochs: undefined,
        mutationRate: 0,
        physicalMutationRate: 0,
        learningRetention: 0,
        learning: "static",
      });
      installVariants(w);
      placeFood(w);
      for (const [i, cell] of w.cells.entries()) {
        const angle = (2 * Math.PI * i) / 16;
        cell.x = 16 + distance * Math.cos(angle);
        cell.y = 16 + distance * Math.sin(angle);
        cell.heading = angle + Math.PI + Math.PI / 4;
        cell.genome = probe ? Number(probe === "slow") + 1 : ((i + Number(swap)) % 2) + 1;
        w.ancestry.get(cell.id)!.genome = cell.genome;
        initializeReceptors(w, cell);
      }
      w.ledger.initial = heldEnergy(w);
      w.ledger.initialMaterial = heldMaterial(w);
      return w;
    },
  };
}
