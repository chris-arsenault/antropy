import { type World, type Cell } from "./types";

export const FLOW_UNITS = {
  food_a: "material",
  food_b: "material",
  signal: "material",
  toxin: "material",
  matrix: "material",
  constructed: "material",
  catabolized: "material",
  repair_material: "material",
  motors: "energy",
  synthesis: "energy",
  maintenance: "energy",
  learning: "energy",
  construction: "energy",
  repair: "energy",
  catabolic_loss: "energy",
  division: "energy",
  damage: "fraction",
  repaired: "fraction",
} as const;
export type FlowChannel = keyof typeof FLOW_UNITS;
export interface FlowFact {
  readonly tick: number;
  readonly cell: number;
  readonly lineage: number;
  readonly genome: number;
  readonly channel: FlowChannel;
  readonly amount: number;
}
export interface LifeFact {
  readonly tick: number;
  readonly cell: number;
  readonly parent: number | null;
  readonly lineage: number;
  readonly genome: number;
  readonly kind: "birth" | "division" | "starvation" | "damage";
  readonly x: number;
  readonly y: number;
}
export interface Observer {
  flow(fact: FlowFact): void;
  life(fact: LifeFact): void;
}
const observers = new WeakMap<World, Observer>();
export function attachObserver(world: World, observer: Observer): () => void {
  if (observers.has(world)) throw new Error("World already has an observer");
  observers.set(world, observer);
  return () => observers.delete(world);
}
export function flow(world: World, cell: Cell, channel: FlowChannel, amount: number): void {
  const sink = observers.get(world);
  if (sink && amount !== 0)
    sink.flow({
      tick: world.tick,
      cell: cell.id,
      lineage: cell.lineage,
      genome: cell.genome,
      channel,
      amount,
    });
}
export function life(world: World, cell: Cell, kind: LifeFact["kind"]): void {
  const sink = observers.get(world);
  if (sink)
    sink.life({
      tick: world.tick,
      cell: cell.id,
      parent: cell.parent,
      lineage: cell.lineage,
      genome: cell.genome,
      kind,
      x: cell.x,
      y: cell.y,
    });
}
