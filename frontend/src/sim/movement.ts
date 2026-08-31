import { getVoxel, getVoxelSafe, inBounds, type VoxelGrid } from "./grid";
import { Material, isSolid } from "./materials";

/** Motor commands driving lattice movement (design spec §4 outputs). */
export interface MotorState {
  /** Turn rate in [-1, 1]; scaled to radians per tick. */
  turn: number;
  /** Forward thrust in [0, 1]; accumulates into steps. */
  forward: number;
  /** Vertical preference in [-1, 1]: down, level, or up candidates first. */
  verticalBias: number;
}

export const TURN_RADIANS_PER_TICK = Math.PI / 4;
export const MAX_STEPS_PER_TICK = 1;

const NEIGHBORHOOD_26: readonly (readonly [number, number, number])[] = (() => {
  const offsets: [number, number, number][] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx !== 0 || dy !== 0 || dz !== 0) {
          offsets.push([dx, dy, dz]);
        }
      }
    }
  }
  return offsets;
})();

/** An ant clings when any voxel in its 26-neighborhood is solid. */
export function hasSupport(grid: VoxelGrid, x: number, y: number, z: number): boolean {
  for (const [dx, dy, dz] of NEIGHBORHOOD_26) {
    if (isSolid(getVoxelSafe(grid, x + dx, y + dy, z + dz))) {
      return true;
    }
  }
  return false;
}

/** A voxel an ant may occupy: in bounds, air, and clinging to something. */
export function isLegalPosition(grid: VoxelGrid, x: number, y: number, z: number): boolean {
  return (
    inBounds(grid, x, y, z) && getVoxel(grid, x, y, z) === Material.AIR && hasSupport(grid, x, y, z)
  );
}

/** Heading quantized to one of 8 horizontal directions. */
export function headingToDirection(heading: number): { dx: number; dz: number } {
  const octant = Math.round((heading / (Math.PI / 4)) % 8);
  const index = ((octant % 8) + 8) % 8;
  const dxTable = [1, 1, 0, -1, -1, -1, 0, 1];
  const dzTable = [0, 1, 1, 1, 0, -1, -1, -1];
  return { dx: dxTable[index], dz: dzTable[index] };
}

/**
 * Forward step candidates in preference order: the facing direction at the
 * vertical level the bias prefers, then the other levels, then a stationary
 * climb (straight up/down) as the last resort.
 */
export function stepCandidates(
  heading: number,
  verticalBias: number
): { dx: number; dy: number; dz: number }[] {
  const { dx, dz } = headingToDirection(heading);
  let levels: number[];
  if (verticalBias > 0.33) {
    levels = [1, 0, -1];
  } else if (verticalBias < -0.33) {
    levels = [-1, 0, 1];
  } else {
    levels = [0, 1, -1];
  }
  const candidates = levels.map((dy) => ({ dx, dy, dz }));
  const climb = verticalBias >= 0 ? 1 : -1;
  candidates.push({ dx: 0, dy: climb, dz: 0 });
  return candidates;
}
