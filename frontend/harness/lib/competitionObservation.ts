import { type EngineWorld } from "../../src/engine/client";
import { type CellState } from "../../src/engine/types";

/** Current-state descriptions, grouped by original founder lineage, never fitness signals. */
export function competitionObservation(world: EngineWorld, groups: ReadonlyMap<number, number>) {
  const { cells } = world.command<{ cells: { cell: CellState }[] }>("assayFrame");
  return [0, 1].map((group) => {
    const members = cells.map((c) => c.cell).filter((c) => groups.get(c.lineage) === group),
      n = Math.max(1, members.length);
    return {
      group,
      population: members.length,
      meanEnergy: members.reduce((s, c) => s + c.energy, 0) / n,
      meanInventory: members.reduce((s, c) => s + c.inventory.material, 0) / n,
      meanSwimEffort: members.reduce((s, c) => s + c.action.swim, 0) / n,
      meanAbsoluteTurnEffort: members.reduce((s, c) => s + Math.abs(c.action.turn), 0) / n,
      meanTransportEfforts: [0, 1, 2, 3].map(
        (i) => members.reduce((s, c) => s + c.action.transport[i], 0) / n
      ),
      meanReceptor0Reading: members.reduce((s, c) => s + c.inputs[0], 0) / n,
    };
  });
}
