import { describe, expect, it } from "vitest";
import { createGrid, setVoxel, voxelIndex } from "./grid";
import { Material } from "./materials";
import {
  createMaterialScentField,
  exchangeMaterialScent,
  sampleMaterialScent,
  setMaterialScent,
} from "./materialScent";
import { createScentField, depositScent, sampleScent } from "./scent";

describe("material colony odor", () => {
  it("re-emits from marked material into adjacent air", () => {
    const grid = createGrid(5, 5, 5);
    const material = createMaterialScentField(grid);
    const air = createScentField(grid);
    const wall = voxelIndex(grid, 2, 2, 2);
    const neighbor = voxelIndex(grid, 3, 2, 2);
    setVoxel(grid, 2, 2, 2, Material.CLAY);
    setMaterialScent(material, wall, 0.75, 4);

    exchangeMaterialScent(grid, air, material);

    expect(sampleScent(air, neighbor, 4)).toBeGreaterThan(0);
  });

  it("absorbs owner-tagged odor from adjacent air", () => {
    const grid = createGrid(5, 5, 5);
    const material = createMaterialScentField(grid);
    const air = createScentField(grid);
    const wall = voxelIndex(grid, 2, 2, 2);
    const neighbor = voxelIndex(grid, 3, 2, 2);
    setVoxel(grid, 2, 2, 2, Material.CLAY);
    depositScent(air, neighbor, 1, 7);

    exchangeMaterialScent(grid, air, material);

    expect(sampleMaterialScent(material, wall, 7)).toBeGreaterThan(0);
  });
});
