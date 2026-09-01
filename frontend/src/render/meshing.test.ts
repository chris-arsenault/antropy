import { describe, expect, it } from "vitest";
import { createGrid, setVoxel, type VoxelGrid } from "../sim/grid";
import { Material } from "../sim/materials";
import { buildChunkGeometries } from "./meshing";

const VERTS_PER_FACE = 6;

/** Surface map placing the whole test grid above ground (no tunnel faces). */
function aboveGround(grid: VoxelGrid): Int16Array {
  return new Int16Array(grid.sizeX * grid.sizeZ).fill(-1);
}

function totalVerts(grid: VoxelGrid, map: Int16Array, cx: number, cy: number, cz: number) {
  const built = buildChunkGeometries(grid, map, cx, cy, cz);
  return built.surface.vertexCount + built.tunnel.vertexCount;
}

describe("buildChunkGeometries", () => {
  it("emits six faces for an isolated voxel", () => {
    const grid = createGrid(16, 16, 16);
    setVoxel(grid, 8, 8, 8, Material.ROCK);
    const built = buildChunkGeometries(grid, aboveGround(grid), 0, 0, 0);
    expect(built.surface.vertexCount).toBe(6 * VERTS_PER_FACE);
    expect(built.tunnel.vertexCount).toBe(0);
    expect(built.surface.positions.length).toBe(built.surface.vertexCount * 3);
    expect(built.surface.normals.length).toBe(built.surface.vertexCount * 3);
    expect(built.surface.colors.length).toBe(built.surface.vertexCount * 3);
  });

  it("culls the shared face between two adjacent voxels", () => {
    const grid = createGrid(16, 16, 16);
    setVoxel(grid, 8, 8, 8, Material.ROCK);
    setVoxel(grid, 9, 8, 8, Material.ROCK);
    expect(totalVerts(grid, aboveGround(grid), 0, 0, 0)).toBe(10 * VERTS_PER_FACE);
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
    expect(totalVerts(grid, aboveGround(grid), 0, 0, 0)).toBe(54 * VERTS_PER_FACE);
  });

  it("culls faces against solid voxels in the neighboring chunk", () => {
    const grid = createGrid(32, 16, 16);
    setVoxel(grid, 15, 8, 8, Material.ROCK);
    setVoxel(grid, 16, 8, 8, Material.ROCK);
    const map = aboveGround(grid);
    expect(totalVerts(grid, map, 0, 0, 0)).toBe(5 * VERTS_PER_FACE);
    expect(totalVerts(grid, map, 1, 0, 0)).toBe(5 * VERTS_PER_FACE);
  });

  it("emits faces at the world boundary", () => {
    const grid = createGrid(16, 16, 16);
    setVoxel(grid, 0, 0, 0, Material.ROCK);
    expect(totalVerts(grid, aboveGround(grid), 0, 0, 0)).toBe(6 * VERTS_PER_FACE);
  });

  it("classifies faces against subsurface air as tunnel walls", () => {
    const grid = createGrid(16, 16, 16);
    // Solid ground up to y=8; carve a one-voxel cavity at y=4.
    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        for (let y = 0; y <= 8; y++) {
          setVoxel(grid, x, y, z, Material.TOPSOIL);
        }
      }
    }
    setVoxel(grid, 8, 4, 8, Material.AIR);
    const map = new Int16Array(grid.sizeX * grid.sizeZ).fill(8);
    const built = buildChunkGeometries(grid, map, 0, 0, 0);
    // The cavity's six walls are tunnel faces; the top skin is surface.
    expect(built.tunnel.vertexCount).toBe(6 * VERTS_PER_FACE);
    expect(built.surface.vertexCount).toBeGreaterThan(0);
  });
});
