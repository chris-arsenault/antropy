import { type World, type Cell } from "../sim/types";
import { branch, relatedness } from "../observe/ancestry";
import { comparisonTo } from "../observe/geneticDistance";
import { traitValues, type Trait } from "../observe/traits";
import { strategyClusters, clusterColor } from "../observe/clusters";

export const COLOR_MODES = {
  strategy: "Strategy clusters",
  family: "Recent families",
  founder: "Founder ancestry",
  relatedness: "Relatives of selected cell",
  physical: "Physical genes vs selected",
  controller: "Controller genes vs selected",
  motor: "Inherited motor investment",
  foodA: "Inherited A/B allocation",
  defense: "Inherited defense",
  weapon: "Inherited toxin machinery",
  builder: "Inherited matrix machinery",
} as const;
export type ColorMode = keyof typeof COLOR_MODES;
export const DEFAULT_COLOR_MODE: ColorMode = "strategy";
export const identityColor = (id: number) => `hsl(${(id * 137.508) % 360},70%,72%)`;
const heat = (fraction: number) => `hsl(${220 - 190 * Math.min(1, Math.max(0, fraction))},75%,65%)`;
const traitScales: Partial<Record<ColorMode, number>> = {
  motor: 16,
  foodA: 100,
  defense: 5,
  weapon: 4,
  builder: 4,
};

function strategyColors(world: World): (cell: Cell) => string {
  const ranks = new Map(strategyClusters(world).ranks.map((rank, i) => [world.cells[i].id, rank]));
  return (cell) => clusterColor(ranks.get(cell.id) ?? 0);
}
export function populationColors(world: World, mode: ColorMode, selected: number | null) {
  if (mode === "strategy") return strategyColors(world);
  const reference = world.ancestry.get(selected ?? -1);
  const genome = reference ? world.genomes.get(reference.genome)!.genome : null;
  const compare = genome ? comparisonTo(genome) : null;
  const traits = new Map<number, ReturnType<typeof traitValues>>();
  return (cell: Cell): string => {
    if (mode === "family") return identityColor(branch(world, cell.id).family);
    if (mode === "founder") return identityColor(cell.lineage);
    const scale = traitScales[mode];
    if (scale) {
      if (!traits.has(cell.genome)) traits.set(cell.genome, traitValues(world, cell.genome));
      return heat(traits.get(cell.genome)![mode as Trait] / scale);
    }
    if (!reference || !genome) return "#60717c";
    if (mode === "relatedness") {
      const relation = relatedness(world, reference.id, cell.id);
      return relation ? heat(relation.links / 16) : "#46535d";
    }
    const distance = compare!(world.genomes.get(cell.genome)!.genome);
    return mode === "physical" ? heat(distance.physical / 0.1) : heat(distance.controller / 0.01);
  };
}
export function colorLegend(mode: ColorMode): string {
  const descriptions: Record<ColorMode, string> = {
    strategy:
      "Colored rim: one of three inherited-trait clusters, ranked by A share (orange lowest, blue, green highest)",
    family: "Colored rim: four-generation ancestry branch",
    founder: "Colored rim: original founder ancestry",
    relatedness:
      "Rim: blue = close kin; orange = 16+ ancestry links; gray = no recorded common ancestor",
    physical: "Rim: blue = identical physical genes; orange = log RMS distance ≥0.1",
    controller: "Rim: blue = identical controller genes; orange = RMS distance ≥0.01",
    motor: "Rim: blue → orange = 0–16% motor target / core",
    foodA: "Rim: blue → orange = 0–100% A share of processing targets",
    defense: "Rim: blue → orange = 0–5% defense target / core",
    weapon: "Rim: blue → orange = 0–4% toxin machinery target / core",
    builder: "Rim: blue → orange = 0–4% matrix machinery target / core",
  };
  return descriptions[mode];
}
