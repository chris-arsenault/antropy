import { type World } from "../sim/types";
import { blueprint } from "../sim/phenotype";
import { distribution } from "../sim/inheritedStats";

export const TRAITS = [
  { key: "core", label: "Core target", unit: "% of founder core", ceiling: 200 },
  { key: "motor", label: "Motor investment", unit: "% of core", ceiling: 16 },
  {
    key: "foodA",
    label: "Food A processing allocation",
    unit: "% of A + B processing",
    ceiling: 100,
  },
  { key: "defense", label: "Defense investment", unit: "% of core", ceiling: 5 },
  { key: "weapon", label: "Toxin machinery", unit: "% of core", ceiling: 4 },
  { key: "builder", label: "Matrix machinery", unit: "% of core", ceiling: 4 },
  { key: "photo", label: "Light harvesting", unit: "% of core", ceiling: 10 },
] as const;
export type Trait = (typeof TRAITS)[number]["key"];
export const EFFORTS = ["swim", "turn", "toxin", "matrix", "repair"] as const;
export type Effort = (typeof EFFORTS)[number];

export function traitValues(world: World, genome: World["cells"][number]["genome"]) {
  const b = blueprint(world.genomes.get(genome)!.genome, world.config);
  return {
    core: (100 * b.core) / world.config.birthMass,
    motor: (100 * b.motor) / b.core,
    foodA: (100 * b.transport) / (b.transport + b.transportB),
    defense: (100 * b.defense) / b.core,
    weapon: (100 * b.weapon) / b.core,
    builder: (100 * b.builder) / b.core,
    photo: (100 * b.photo) / b.core,
  };
}
export function histogram(values: number[], ceiling: number) {
  const bins = new Array<number>(10).fill(0);
  for (const value of values) bins[Math.min(9, Math.max(0, Math.floor((10 * value) / ceiling)))]++;
  return bins;
}
export function traitSnapshot(world: World) {
  const genomes = new Map<number, ReturnType<typeof traitValues>>();
  for (const cell of world.cells)
    if (!genomes.has(cell.genome)) genomes.set(cell.genome, traitValues(world, cell.genome));
  return TRAITS.map((trait) => {
    const values = world.cells.map((c) => genomes.get(c.genome)![trait.key]);
    const stats = distribution(values),
      ceiling = Math.max(trait.ceiling, stats?.max ?? 0);
    return { ...trait, stats, ceiling, bins: histogram(values, ceiling) };
  });
}
export function effortSnapshot(world: World) {
  return EFFORTS.map((key) => ({
    key,
    bins: histogram(
      world.cells.map((c) => 100 * Math.abs(c.action[key])),
      100
    ),
  }));
}
