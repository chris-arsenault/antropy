import { describe, expect, it } from "vitest";
import { getVoxel, type VoxelGrid } from "./grid";
import { Material, isSolid } from "./materials";
import { generateTerrain, surfaceHeight } from "./terrain";
import { TERRAIN, WORLD_SIZE_Y } from "./tunables";

const LAYER_RANK: Partial<Record<number, number>> = {
  [Material.TOPSOIL]: 0,
  [Material.CLAY]: 1,
  [Material.ROCK]: 2,
};

function checkColumnOrdering(grid: VoxelGrid, seed: number, x: number, z: number): void {
  const surface = surfaceHeight(seed, x, z);
  let previousRank = -1;
  for (let y = grid.sizeY - 1; y >= 0; y--) {
    const material = getVoxel(grid, x, y, z);
    if (y > surface) {
      expect(material).toBe(Material.AIR);
      continue;
    }
    expect(isSolid(material)).toBe(true);
    const rank = LAYER_RANK[material];
    expect(rank).toBeDefined();
    expect(rank as number).toBeGreaterThanOrEqual(previousRank);
    previousRank = rank as number;
  }
}

function materialFractions(grid: VoxelGrid): (m: number) => number {
  const counts = new Map<number, number>();
  for (const value of grid.data) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return (m) => (counts.get(m) ?? 0) / grid.data.length;
}

describe("generateTerrain determinism", () => {
  const grid = generateTerrain(1234);

  it("is byte-identical for the same seed", () => {
    const again = generateTerrain(1234);
    expect(Buffer.from(again.data).equals(Buffer.from(grid.data))).toBe(true);
  });

  it("differs for a different seed", () => {
    const other = generateTerrain(4321);
    expect(Buffer.from(other.data).equals(Buffer.from(grid.data))).toBe(false);
  });
});

describe("generateTerrain structure", () => {
  const seed = 1234;
  const grid = generateTerrain(seed);

  it("keeps surface heights within amplitude bounds", () => {
    for (let x = 0; x < grid.sizeX; x += 7) {
      for (let z = 0; z < grid.sizeZ; z += 7) {
        const h = surfaceHeight(seed, x, z);
        expect(h).toBeGreaterThanOrEqual(TERRAIN.surfaceBase - TERRAIN.surfaceAmplitude);
        expect(h).toBeLessThanOrEqual(TERRAIN.surfaceBase + TERRAIN.surfaceAmplitude);
        expect(h).toBeLessThan(WORLD_SIZE_Y);
      }
    }
  });

  it("orders every sampled column as air, topsoil, clay, rock", { timeout: 30_000 }, () => {
    for (let x = 0; x < grid.sizeX; x += 5) {
      for (let z = 0; z < grid.sizeZ; z += 5) {
        checkColumnOrdering(grid, seed, x, z);
      }
    }
  });

  it("makes the bottom row rock", () => {
    for (let x = 0; x < grid.sizeX; x += 11) {
      for (let z = 0; z < grid.sizeZ; z += 11) {
        expect(getVoxel(grid, x, 0, z)).toBe(Material.ROCK);
      }
    }
  });

  it("keeps material fractions within sane bounds", () => {
    const fraction = materialFractions(grid);
    expect(fraction(Material.AIR)).toBeGreaterThan(0.15);
    expect(fraction(Material.AIR)).toBeLessThan(0.6);
    expect(fraction(Material.TOPSOIL)).toBeGreaterThan(0.02);
    expect(fraction(Material.CLAY)).toBeGreaterThan(0.05);
    expect(fraction(Material.ROCK)).toBeGreaterThan(0.2);
  });
});
