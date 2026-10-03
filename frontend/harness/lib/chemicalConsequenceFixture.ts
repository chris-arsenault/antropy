import { type CellState, type Genotype } from "../../src/engine/types";
import { type EngineWorld } from "../../src/engine/client";
import { frozen, install, pulse } from "./engineFixtures";
import { bindingGenotype, bindingLock } from "./ruggedBindingFixture";
import { type QuickScenario } from "./quickScenario";

export const CONSEQUENCE_LABELS = ["E0M0", "E1M0", "E0M1", "E1M1"] as const;
export const CONSEQUENCE_REGISTRATION = "docs/plans/CHEMICAL-CONSEQUENCE-ASSAY.md";
export interface ConsequenceCase {
  variant: number;
  supplied: boolean;
  lambda: number;
  enzymeActive: boolean;
}
export const consequenceCases: ConsequenceCase[] = [
  ...[false, true].flatMap((supplied) =>
    [0, 1, 2, 3].map((variant) => ({ variant, supplied, lambda: 6, enzymeActive: true }))
  ),
  ...[false, true].flatMap((supplied) =>
    [2, 3].map((variant) => ({ variant, supplied, lambda: 6, enzymeActive: false }))
  ),
  ...[false, true].flatMap((supplied) =>
    [0, 3].map((variant) => ({ variant, supplied, lambda: 0.25, enzymeActive: true }))
  ),
];
export const consequenceName = (c: ConsequenceCase) =>
  `${CONSEQUENCE_LABELS[c.variant]}-${c.supplied ? "136" : "blank"}-lambda${c.lambda}-${c.enzymeActive ? "active" : "off"}`;

export function consequenceGenotype(base: Genotype, variant: number): Genotype {
  const g = bindingGenotype(base, 0);
  for (const ch of g.chromosomes) {
    ch.physical = structuredClone(base.chromosomes[0].physical);
    ch.physical[7] = ch.physical[11] = 3;
    const m = ch.chemistry;
    m.programs = Array.from({ length: 8 }, (_, i) => i === 0);
    m.enzymes[0] = { x: 8, y: 8, centerX: 4, centerY: 8, angle: 0 };
    const keys = m.keys!;
    keys.receptors = Array.from({ length: 4 }, () => bindingLock(136));
    keys.transporters[0] = bindingLock(136);
    keys.enzymes[0] = bindingLock(128);
    keys.membrane = bindingLock(128);
    keys.enzymes[0].weights[4] = variant & 1 ? 1 : -1;
    keys.membrane.weights[4] = variant & 2 ? 1 : -1;
  }
  return g;
}

export function consequenceScenario(c: ConsequenceCase, shared = false): QuickScenario {
  return {
    name: `chemical-consequence-${shared ? "shared" : consequenceName(c)}`,
    hypothesis:
      "One chemical becomes funded substrate or damaging exposure through inherited enzyme and membrane binding changes.",
    specification: {
      registration: CONSEQUENCE_REGISTRATION,
      ...c,
      shared,
      mixture: c.supplied ? [[136, 576]] : [],
      changingLoci: ["enzymes[0].weights[4]", "membrane.weights[4]"],
      initialInventory: 0,
      initialEnergy: 0.5,
      frozen,
    },
    target: { x: 12, y: 12, radius: 6 },
    stopOnExtinction: true,
    create(engine, seed, swap) {
      if (seed !== 27) throw new Error("Registered world seed is27");
      const world = engine.create(seed, {
        preset: "diagnostic",
        ...frozen,
        chemistrySeed: 101,
        width: 24,
        height: 24,
        mesh: 2,
        founders: shared ? 4 : 1,
        sourceCount: 0,
        sourcePriming: 0,
        bindingLambda: c.lambda,
      });
      try {
        const base = world.command<Genotype>("genotype", { id: 1 });
        const packet = world.command<{ cell: CellState }>("inspect", { cell: 1 }).cell;
        const logits = Array.from({ length: 28 }, () => -3);
        logits[0] = logits[1] = logits[6] = 0;
        logits[2] = logits[5] = 3;
        logits[9] = c.enzymeActive ? 3 : -3;
        const behavior = world.command<Genotype["chromosomes"][number]["behavior"]>(
          "diagnosticController",
          { logits }
        );
        const variants = (shared ? [0, 1, 2, 3] : [c.variant]).map((variant) => {
          const genotype = consequenceGenotype(base, variant);
          for (const ch of genotype.chromosomes) ch.behavior = structuredClone(behavior);
          return { label: CONSEQUENCE_LABELS[variant], genotype };
        });
        install(
          world,
          variants,
          Array.from({ length: shared ? 4 : 1 }, (_, i) => ({
            cell: i + 1,
            variant: shared ? (i + Number(swap) * 2) % 4 : 0,
            x: shared ? 11 + 2 * (i % 2) : 12,
            y: shared ? 11 + 2 * Math.floor(i / 2) : 12,
            heading: 0,
          }))
        );
        matchConsequencePackets(world, packet, shared ? 4 : 1);
        if (c.supplied) pulse(world, [[136, 576]]);
        return world;
      } catch (error) {
        world.dispose();
        throw error;
      }
    },
  };
}

function matchConsequencePackets(world: EngineWorld, packet: CellState, count: number) {
  for (let i = 0; i < count; i++)
    world.command("intervene", {
      cell: i + 1,
      inventory: Array.from({ length: 256 }, () => 0),
      boundMaterial: packet.boundMaterial.amounts,
      energy: 0.5,
      damage: 0,
      resetMemory: true,
    });
}

export function consequenceGenomes(world: EngineWorld) {
  const cells = world.command<{ cells: { genome: number }[] }>("frame").cells;
  return [...new Set(cells.map((c) => c.genome))].map((id) => {
    const genotype = world.command<Genotype>("genotype", { id });
    const keys = genotype.chromosomes[0].chemistry.keys!;
    const variant =
      Number(keys.enzymes[0].weights[4] === 1) + 2 * Number(keys.membrane.weights[4] === 1);
    return { variant, label: CONSEQUENCE_LABELS[variant], genotype };
  });
}
