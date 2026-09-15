import { type Engine, type EngineWorld } from "../../src/engine/client";
import { type Genotype } from "../../src/engine/types";

export type DiagnosticChanges = Partial<{
  swimBiasDelta: number;
  inventoryBrake: number;
  motorGain: number;
  recurrence: "zero";
  transport: [number, number, number, number];
  chemotaxis: number;
  plasticityAlpha: number;
}>;
export interface Variant {
  label: string;
  genotype: Genotype;
  changes?: DiagnosticChanges;
}
export interface Assignment {
  cell: number;
  variant: number;
  x: number;
  y: number;
  heading: number;
}
export const frozen = {
  mutationRate: 0,
  physicalMutationRate: 0,
  transmission: "clonal",
  transferRate: 0,
  learningRetention: 0,
  learning: "static",
} as const;
export function install(
  world: EngineWorld,
  variants: Variant[],
  assignments: Assignment[],
  mature = false
) {
  return world.command<{ genomes: number[]; constructed: number; constructionHeat: number }>(
    "installFixture",
    {
      fixture: {
        variants: variants.map(({ genotype, changes }) => ({ genotype, changes })),
        assignments,
        mature,
      },
    }
  );
}
export function pulse(
  world: EngineWorld,
  mixture: [number, number][],
  center?: [number, number],
  sigma?: number
) {
  world.command("pulse", { pulse: { mixture, center: center ?? null, sigma: sigma ?? null } });
}
export function behaviorChange(
  engine: Engine,
  genotype: Genotype,
  changes: DiagnosticChanges
): Genotype {
  const g = structuredClone(genotype);
  for (const c of g.chromosomes)
    c.behavior = engine.command("controllerChange", { genome: c.behavior, changes });
  return g;
}
export function assignPopulation(
  world: EngineWorld,
  variants: Variant[],
  assignment: (index: number) => number
) {
  const frame = world.command<{ cells: { id: number; x: number; y: number; heading: number }[] }>(
    "frame"
  );
  return install(
    world,
    variants,
    frame.cells
      .map((c, i) => ({ ...c, cell: c.id, variant: assignment(i) }))
      .map(({ cell, variant, x, y, heading }) => ({ cell, variant, x, y, heading }))
  );
}
/** A rare invader occupies one in ten positions; the rest cycle among the resident variants. */
export function rareAssignment(i: number, n: number, rare: number | null, swap: boolean) {
  if (rare !== null && i % 10 === 0) return rare;
  const slot = (i + Number(swap)) % n;
  return rare !== null && slot === rare ? (slot + 1) % n : slot;
}
