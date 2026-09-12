import { type World } from "../sim/types";
import { lineageCounts } from "../sim/inheritedStats";
import { familyCounts } from "../observe/ancestry";
import { traitSnapshot, effortSnapshot } from "../observe/traits";
import { strategyClusters, type StrategyCluster } from "../observe/clusters";

export interface PopulationPoint {
  tick: number;
  population: number;
  births: number;
  deaths: number;
  lineages: [number, number][];
  families: [number, number][];
  traits: ReturnType<typeof traitSnapshot>;
  efforts: ReturnType<typeof effortSnapshot>;
  strategies: StrategyCluster[];
}
export const populationPoint = (world: World): PopulationPoint => ({
  tick: world.tick,
  population: world.cells.length,
  births: world.ledger.births,
  deaths: world.ledger.deaths,
  lineages: lineageCounts(world),
  families: familyCounts(world),
  traits: traitSnapshot(world),
  efforts: effortSnapshot(world),
  strategies: strategyClusters(world).clusters,
});
export function appendPoint(history: PopulationPoint[], world: World): PopulationPoint[] {
  return appendSample(history, populationPoint(world));
}
export function appendSample(
  history: PopulationPoint[],
  point: PopulationPoint
): PopulationPoint[] {
  const next = [...history.filter((p) => p.tick < point.tick), point];
  return next.length <= 240 ? next : next.filter((_, i) => i % 2 === 0 || i === next.length - 1);
}

export function appendRecent(history: PopulationPoint[], point: PopulationPoint) {
  return [...history.filter((p) => p.tick > point.tick - 2000 && p.tick < point.tick), point];
}
