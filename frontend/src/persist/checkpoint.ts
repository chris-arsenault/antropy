import { type World } from "../sim/types";
import { controller } from "../sim/controller";
import { validateSnapshot } from "./validation";
import { balance, total } from "../sim/resources";

export function serializeWorld(world: World) {
  return {
    ...world,
    nutrient: Array.from(world.nutrient),
    chemical: Array.from(world.chemical),
    genomes: [...world.genomes.values()].map((r) => ({
      ...r,
      genome: controller.encodeGenome(r.genome),
    })),
    ancestry: [...world.ancestry.values()],
    cells: world.cells.map((cell) => ({
      ...cell,
      inputs: Array.from(cell.inputs),
      brain: controller.encodeState(cell.brain),
    })),
  };
}
export type Checkpoint = ReturnType<typeof serializeWorld>;
export function checkpointToJson(world: World): string {
  return JSON.stringify(serializeWorld(world));
}

export function restoreWorld(text: string): World {
  const data: unknown = JSON.parse(text);
  validateSnapshot(data);
  const genomes = new Map(
    data.genomes.map((r) => [r.id, { ...r, genome: controller.decodeGenome(r.genome) }])
  );
  const world: World = {
    ...data,
    nutrient: Float64Array.from(data.nutrient),
    chemical: Float64Array.from(data.chemical),
    genomes,
    ancestry: new Map(data.ancestry.map((a) => [a.id, a])),
    cells: data.cells.map((cell) => ({
      ...cell,
      inputs: Float32Array.from(cell.inputs),
      brain: controller.decodeState(cell.brain),
    })),
  };
  const scale = Math.max(1, world.ledger.initial + world.ledger.supplied);
  if (Math.abs(balance(world)) > scale * 1e-8)
    throw new Error("Checkpoint resource balance is inconsistent");
  if (
    Math.abs(world.ledger.emitted - world.ledger.chemicalLoss - total(world.chemical)) >
    Math.max(1, world.ledger.emitted) * 1e-8
  )
    throw new Error("Checkpoint chemical balance is inconsistent");
  return world;
}
