import { describe, expect, it } from "vitest";
import { CHUNK_SIZE, affectedChunkKeys, chunkKey, chunkOfVoxel } from "./chunks";
import { createWorld, mutateVoxel } from "./world";
import { Material } from "./materials";

describe("chunk addressing", () => {
  it("assigns unique keys across a large chunk volume", () => {
    const seen = new Set<number>();
    for (let cx = 0; cx < 8; cx++) {
      for (let cy = 0; cy < 4; cy++) {
        for (let cz = 0; cz < 8; cz++) {
          seen.add(chunkKey(cx, cy, cz));
        }
      }
    }
    expect(seen.size).toBe(8 * 4 * 8);
  });

  it("maps voxels to their containing chunk", () => {
    expect(chunkOfVoxel(0, 0, 0)).toEqual({ cx: 0, cy: 0, cz: 0 });
    expect(chunkOfVoxel(15, 15, 15)).toEqual({ cx: 0, cy: 0, cz: 0 });
    expect(chunkOfVoxel(16, 31, 47)).toEqual({ cx: 1, cy: 1, cz: 2 });
  });

  it("marks only the owning chunk for interior voxels", () => {
    expect(affectedChunkKeys(5, 5, 5)).toEqual([chunkKey(0, 0, 0)]);
  });

  it("marks face-adjacent chunks for boundary voxels", () => {
    const keys = affectedChunkKeys(CHUNK_SIZE, 5, 5);
    expect(keys).toContain(chunkKey(1, 0, 0));
    expect(keys).toContain(chunkKey(0, 0, 0));
  });
});

describe("mutateVoxel", () => {
  it("writes the grid and records dirty chunks", () => {
    const world = createWorld(7);
    world.dirtyChunks.clear();
    mutateVoxel(world, 20, 50, 20, Material.FOOD);
    expect(world.grid.data.length).toBeGreaterThan(0);
    expect(world.dirtyChunks.has(chunkKey(1, 3, 1))).toBe(true);
  });

  it("dirties the neighboring chunk on a boundary write", () => {
    const world = createWorld(7);
    world.dirtyChunks.clear();
    mutateVoxel(world, 16, 5, 5, Material.AIR);
    expect(world.dirtyChunks.has(chunkKey(1, 0, 0))).toBe(true);
    expect(world.dirtyChunks.has(chunkKey(0, 0, 0))).toBe(true);
  });
});
