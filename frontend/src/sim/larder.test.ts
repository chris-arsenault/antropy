import { describe, expect, it } from "vitest";
import { MORTAL_NEST_CONFIG } from "./config";
import { rnnController } from "./controller/rnn";
import { getVoxel, voxelIndex } from "./grid";
import { restockFromLarder } from "./larder";
import { Material } from "./materials";
import { setMaterialScent } from "./materialScent";
import { buildAuthoredNestWorld } from "./nestWorld";
import { COLONY, ENERGY } from "./tunables";
import { mutateVoxel } from "./world";

function farFoodRoom() {
  const built = buildAuthoredNestWorld(4013, rnnController, MORTAL_NEST_CONFIG);
  const room = built.nest.chambers.find(
    (candidate) =>
      candidate.role === "food" &&
      Math.abs(candidate.center.x - built.colony.x) > COLONY.restockRadius
  );
  if (!room) throw new Error("fixture has no far food room");
  built.world.ants = [];
  return { ...built, point: { ...room.center } };
}

function placeStoredFood(built: ReturnType<typeof farFoodRoom>, owner: number): number {
  const { world, point } = built;
  const index = voxelIndex(world.grid, point.x, point.y, point.z);
  mutateVoxel(world, point.x, point.y, point.z, Material.FOOD);
  world.storedFood.add(index);
  if (owner !== 0) setMaterialScent(world.materialColonyScent, index, 0.75, owner);
  return index;
}

describe("multi-chamber larder", () => {
  it("restocks from colony-marked underground storage beyond the local radius", () => {
    const built = farFoodRoom();
    const index = placeStoredFood(built, built.colony.id);
    built.colony.stockpile = 0.5;

    restockFromLarder(built.world, built.colony);

    expect(getVoxel(built.world.grid, built.point.x, built.point.y, built.point.z)).toBe(
      Material.AIR
    );
    expect(built.world.storedFood.has(index)).toBe(false);
    expect(built.colony.stockpile).toBeCloseTo(0.5 + ENERGY.foodEnergy);
  });

  it("does not grant remote access to unmarked storage", () => {
    const built = farFoodRoom();
    const index = placeStoredFood(built, 0);
    built.colony.stockpile = 0.5;

    restockFromLarder(built.world, built.colony);

    expect(built.world.storedFood.has(index)).toBe(true);
    expect(built.colony.stockpile).toBe(0.5);
  });

  it("does not grant remote access to marked surface storage", () => {
    const built = farFoodRoom();
    const x = built.point.x;
    const z = built.point.z;
    built.point.y = built.world.surfaceMap[z * built.world.grid.sizeX + x] + 1;
    const index = placeStoredFood(built, built.colony.id);
    built.colony.stockpile = 0.5;

    restockFromLarder(built.world, built.colony);

    expect(built.world.storedFood.has(index)).toBe(true);
    expect(built.colony.stockpile).toBe(0.5);
  });
});
