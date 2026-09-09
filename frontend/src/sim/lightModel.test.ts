import { expect, it } from "vitest";
import { createGrid, setBacking, setCell } from "./grid";
import { Material } from "./materials";
import { skyLight } from "./terrain";

it("attenuates an open shaft by backing depth independently of sky occlusion", () => {
  const grid = createGrid(7, 12);
  for (let y = 0; y <= 7; y++) setBacking(grid, 3, y, Material.SOIL);
  expect(skyLight(grid, 3, 5, "occluded")).toBe(1);
  expect(skyLight(grid, 3, 5, "depth-attenuated")).toBe(Math.exp(-0.8 * 3));
  expect(skyLight(grid, 3, 8, "depth-attenuated")).toBe(1);
  setCell(grid, 3, 9, Material.WOOD);
  expect(skyLight(grid, 3, 5, "occluded")).toBe(0);
  expect(skyLight(grid, 3, 5, "depth-attenuated")).toBe(0);
});
