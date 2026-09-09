import { expect, it } from "vitest";
import { createGrid, setBacking, setCell } from "../grid";
import { Material } from "../materials";
import { FORAGER_CONFIG } from "../config";
import { createClimate } from "./state";

it("books finite cavity heat into the initial budget without heating soil or exposed air", () => {
  const grid = createGrid(4, 4, "contact");
  grid.cells.fill(Material.AIR);
  setBacking(grid, 1, 1, Material.SOIL);
  setCell(grid, 2, 1, Material.SOIL);
  const climate = createClimate(grid, {
    ...FORAGER_CONFIG,
    climate: { ...FORAGER_CONFIG.climate, initialCavityHeat: 16 },
  });
  expect(climate.temperature[5]).toBe(40);
  expect(climate.temperature[6]).toBe(24);
  expect(climate.temperature[0]).toBe(24);
  const heat = climate.temperature.reduce(
    (sum, value, i) => sum + value * climate.heatCapacity[i],
    0
  );
  expect(climate.initialHeat).toBe(heat);
  expect(climate.heatExchange).toBe(0);
});
