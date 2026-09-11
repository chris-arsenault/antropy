import { type World } from "./types";
import { matrixMobility } from "./matrix";
import { percent } from "./budgetStats";

/** Consequences at occupied positions, rather than cumulative secretion totals. */
export function ecologyStats(world: World) {
  let impairedCells = 0,
    matrixSlowedCells = 0,
    maxDamage = 0,
    mobility = 0;
  for (const cell of world.cells) {
    if (cell.damage >= 0.2) impairedCells++;
    const factor = matrixMobility(world, cell);
    if (factor <= 0.8) matrixSlowedCells++;
    mobility += factor;
    maxDamage = Math.max(maxDamage, cell.damage);
  }
  const matrixHalfSpeedArea = world.matrix.filter((q) => q * world.config.matrixDrag >= 1).length;
  return {
    impairedCells,
    maxDamage,
    matrixSlowedCells,
    meanMatrixMobility: mobility / Math.max(1, world.cells.length),
    matrixHalfSpeedArea,
    matrixHalfSpeedWorldPercent: percent(matrixHalfSpeedArea, world.matrix.length),
    matrixSlowedPopulationPercent: percent(matrixSlowedCells, world.cells.length),
    impairedPopulationPercent: percent(impairedCells, world.cells.length),
  };
}
