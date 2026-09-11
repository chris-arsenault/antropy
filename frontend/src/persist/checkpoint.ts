import { type World } from "../sim/types";
import { MATERIAL_FIELDS } from "../sim/types";
import { controller } from "../sim/controller";
import { encodeGenotype, decodeGenotype } from "../sim/genetics/codec";
import { validateSnapshot } from "./validation";
import { balance, materialBalance, total } from "../sim/accounting";
import { provenance, restoreProvenance } from "./provenance";

export function serializeWorld(world: World, exportSource?: string) {
  return {
    ...world,
    exportSource,
    provenance: provenance(world),
    ...(Object.fromEntries(MATERIAL_FIELDS.map((key) => [key, Array.from(world[key])])) as Record<
      (typeof MATERIAL_FIELDS)[number],
      number[]
    >),
    genomes: [...world.genomes.values()].map((r) => ({
      ...r,
      genome: encodeGenotype(r.genome),
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
export function checkpointToJson(world: World, exportSource?: string): string {
  return JSON.stringify(serializeWorld(world, exportSource));
}

export function restoreWorld(text: string): World {
  const data: unknown = JSON.parse(text);
  validateSnapshot(data);
  const { provenance: history, exportSource, ...physical } = data;
  if (
    exportSource !== undefined &&
    (typeof exportSource !== "string" || exportSource.length < 1 || exportSource.length > 256)
  )
    throw new Error("Invalid export source");
  const genomes = new Map(
    data.genomes.map((r) => [r.id, { ...r, genome: decodeGenotype(r.genome) }])
  );
  const world: World = {
    ...physical,
    ...(Object.fromEntries(
      MATERIAL_FIELDS.map((key) => [key, Float64Array.from(data[key])])
    ) as Record<(typeof MATERIAL_FIELDS)[number], Float64Array>),
    genomes,
    ancestry: new Map(data.ancestry.map((a) => [a.id, a])),
    cells: data.cells.map((cell) => ({
      ...cell,
      inputs: Float32Array.from(cell.inputs),
      brain: controller.decodeState(cell.brain),
    })),
  };
  restoreProvenance(world, history);
  const scale = Math.max(
    1,
    world.ledger.initial + world.ledger.supplied * world.config.nutrientEnergy
  );
  if (Math.abs(balance(world)) > scale * 1e-8)
    throw new Error("Checkpoint resource balance is inconsistent");
  if (
    Math.abs(materialBalance(world)) >
    Math.max(1, world.ledger.initialMaterial + world.ledger.supplied) * 1e-8
  )
    throw new Error("Checkpoint material balance is inconsistent");
  if (
    Math.abs(world.ledger.emitted - world.ledger.chemicalLoss - total(world.chemical)) >
    Math.max(1, world.ledger.emitted) * 1e-8
  )
    throw new Error("Checkpoint chemical balance is inconsistent");
  return world;
}
