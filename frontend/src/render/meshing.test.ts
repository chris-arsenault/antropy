import { describe, expect, it } from "vitest";
import { createGrid, setVoxel } from "../sim/grid";
import { Material } from "../sim/materials";
import { buildChunkGeometry } from "./meshing";

const VERTS_PER_FACE = 6;

describe("buildChunkGeometry", () => {
  it("emits six faces for an isolated voxel", () => {
    const grid = createGrid(16, 16, 16);
    setVoxel(grid, 8, 8, 8, Material.ROCK);
    const geometry = buildChunkGeometry(grid, 0, 0, 0);
    expect(geometry.vertexCount).toBe(6 * VERTS_PER_FACE);
    expect(geometry.positions.length).toBe(geometry.vertexCount * 3);
    expect(geometry.normals.length).toBe(geometry.vertexCount * 3);
    expect(geometry.colors.length).toBe(geometry.vertexCount * 3);
  });

  it("culls the shared face between two adjacent voxels", () => {
    const grid = createGrid(16, 16, 16);
    setVoxel(grid, 8, 8, 8, Material.ROCK);
    setVoxel(grid, 9, 8, 8, Material.ROCK);
    const geometry = buildChunkGeometry(grid, 0, 0, 0);
    expect(geometry.vertexCount).toBe(10 * VERTS_PER_FACE);
  });

  it("emits only the surface of a solid cube", () => {
    const grid = createGrid(16, 16, 16);
    for (let x = 4; x < 7; x++) {
      for (let y = 4; y < 7; y++) {
        for (let z = 4; z < 7; z++) {
          setVoxel(grid, x, y, z, Material.CLAY);
        }
      }
    }
    const geometry = buildChunkGeometry(grid, 0, 0, 0);
    expect(geometry.vertexCount).toBe(54 * VERTS_PER_FACE);
  });

  it("culls faces against solid voxels in the neighboring chunk", () => {
    const grid = createGrid(32, 16, 16);
    setVoxel(grid, 15, 8, 8, Material.ROCK);
    setVoxel(grid, 16, 8, 8, Material.ROCK);
    const chunk0 = buildChunkGeometry(grid, 0, 0, 0);
    const chunk1 = buildChunkGeometry(grid, 1, 0, 0);
    expect(chunk0.vertexCount).toBe(5 * VERTS_PER_FACE);
    expect(chunk1.vertexCount).toBe(5 * VERTS_PER_FACE);
  });

  it("emits faces at the world boundary", () => {
    const grid = createGrid(16, 16, 16);
    setVoxel(grid, 0, 0, 0, Material.ROCK);
    const geometry = buildChunkGeometry(grid, 0, 0, 0);
    expect(geometry.vertexCount).toBe(6 * VERTS_PER_FACE);
  });
});
