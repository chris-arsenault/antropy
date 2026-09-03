import { describe, expect, it } from "vitest";
import { rnnController } from "./controller/rnn";
import { Material } from "./materials";
import { classifyNest, hasSymmetryBrokenStructure } from "./nestMetrics";
import { createWorld, mutateVoxel, type World } from "./world";

const SITE = { x: 96, z: 96 } as const;

function carve(world: World, cells: readonly (readonly [number, number, number])[]): void {
  for (const [dx, dy, dz] of cells) {
    const x = SITE.x + dx;
    const z = SITE.z + dz;
    const surface = world.surfaceMap[z * world.grid.sizeX + x];
    mutateVoxel(world, x, surface - 8 + dy, z, Material.AIR);
  }
}

describe("Appendix D shared nest classifier", () => {
  it("excludes ambient sky from the morphology and existence gate", () => {
    const world = createWorld(18_001, rnnController);
    const morphology = classifyNest(world);

    expect(morphology.cavityVoxels).toBe(0);
    expect(hasSymmetryBrokenStructure(morphology)).toBe(false);
  });

  it("describes a one-wide shaft as corridor-only", () => {
    const world = createWorld(18_002, rnnController);
    carve(world, [
      [0, 0, 0],
      [0, 1, 0],
      [0, 2, 0],
      [0, 3, 0],
    ]);
    const morphology = classifyNest(world);

    expect(morphology.corridorVoxels).toBe(4);
    expect(morphology.nonCorridorVoxels).toBe(0);
    expect(morphology.branchVoxels).toBe(0);
    expect(hasSymmetryBrokenStructure(morphology)).toBe(false);
  });

  it("partitions a flat 2x2 void as one bulge", () => {
    const world = createWorld(18_003, rnnController);
    carve(world, [
      [0, 0, 0],
      [1, 0, 0],
      [0, 0, 1],
      [1, 0, 1],
    ]);
    const morphology = classifyNest(world);

    expect(morphology.nonCorridorVoxels).toBe(4);
    expect(morphology.voids).toHaveLength(1);
    expect(morphology.voids[0]).toMatchObject({ kind: "bulge", volume: 4 });
    expect(hasSymmetryBrokenStructure(morphology)).toBe(true);
  });

  it("classifies an interior 2x2x2 void as a chamber", () => {
    const world = createWorld(18_004, rnnController);
    const cube: [number, number, number][] = [];
    for (let dy = 0; dy < 2; dy++) {
      for (let dz = 0; dz < 2; dz++) {
        for (let dx = 0; dx < 2; dx++) {
          cube.push([dx, dy, dz]);
        }
      }
    }
    carve(world, cube);
    const morphology = classifyNest(world);

    expect(morphology.voids).toHaveLength(1);
    expect(morphology.voids[0]).toMatchObject({ kind: "chamber", volume: 8, doorwayCount: 0 });
    expect(morphology.networkComponentVolumes).toEqual([8]);
  });

  it("detects a branch without promoting it to a named void", () => {
    const world = createWorld(18_005, rnnController);
    carve(world, [
      [0, 0, 0],
      [-1, 0, 0],
      [1, 0, 0],
      [0, 0, 1],
    ]);
    const morphology = classifyNest(world);

    expect(morphology.nonCorridorVoxels).toBe(0);
    expect(morphology.branchVoxels).toBe(1);
    expect(hasSymmetryBrokenStructure(morphology)).toBe(true);
  });
});
